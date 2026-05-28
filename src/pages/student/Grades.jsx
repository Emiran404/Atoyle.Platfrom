import React, { useEffect, useState } from 'react';
import { Award, Target, FileText, Calendar, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { StudentLayout } from '../../components/layouts';
import { useAuthStore } from '../../store/authStore';
import { useSubmissionStore } from '../../store/submissionStore';
import { useExamStore } from '../../store/examStore';
import { formatDateTime } from '../../utils/dateHelpers';
import { formatFileSize } from '../../utils/fileHelpers';
import { t } from '../../utils/i18n';
import OpticalFormModal from './OpticalFormModal';

const Grades = () => {
  const { user } = useAuthStore();
  const { loadSubmissions, getStudentSubmissions } = useSubmissionStore();
  const { loadExams, exams } = useExamStore();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [opticalFormOpen, setOpticalFormOpen] = useState(false);
  const [selectedSubmissionForOptic, setSelectedSubmissionForOptic] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        await loadExams();
        await loadSubmissions();

        const userSubmissions = getStudentSubmissions(user.id);
        // edit_granted durumundaki gönderimleri filtrele (düzenleme izni verilmiş)
        const activeSubmissions = userSubmissions.filter(sub => sub.status !== 'edit_granted');
        // Sınav bilgilerini ekle
        const subsWithExam = activeSubmissions.map(sub => ({
          ...sub,
          exam: exams.find(e => e.id === sub.examId)
        }));
        setSubmissions(subsWithExam);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Otomatik yenileme - Her 10 saniyede bir
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [user, exams.length]);

  const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
  const pendingSubmissions = submissions.filter(s => s.grade === null || s.grade === undefined);

  // Öğrenci-sınav bazında grupla (aynı sınav için birden fazla dosya varsa 1 gönderim say, ama tüm dosyaları sakla)
  const getUniqueSubmissions = (subs) => {
    const grouped = {};
    subs.forEach(sub => {
      const key = `${sub.examId}-${sub.studentId}`;
      if (!grouped[key]) {
        grouped[key] = { ...sub, files: [sub] };
      } else {
        // Aynı sınav için başka dosya varsa ekle
        grouped[key].files.push(sub);
      }
    });
    return Object.values(grouped);
  };

  const uniqueSubmissions = getUniqueSubmissions(submissions).sort((a, b) => 
    new Date(b.submittedAt) - new Date(a.submittedAt)
  );
  const uniqueGradedSubmissions = getUniqueSubmissions(gradedSubmissions);
  const uniquePendingSubmissions = getUniqueSubmissions(pendingSubmissions);

  const numGrades = uniqueGradedSubmissions.filter(s => typeof s.grade === 'number');
  const stats = {
    total: uniqueSubmissions.length,
    graded: uniqueGradedSubmissions.length,
    pending: uniquePendingSubmissions.length,
    average: numGrades.length > 0
      ? Math.round(numGrades.reduce((a, b) => a + b.grade, 0) / numGrades.length)
      : 0
  };

  const filteredSubmissions = activeTab === 'all'
    ? uniqueSubmissions
    : activeTab === 'graded'
      ? uniqueGradedSubmissions
      : uniquePendingSubmissions;

  const getStatusBadge = (submission) => {
    if (submission.grade !== null && submission.grade !== undefined) {
      const grade = submission.grade;
      if (grade === 'K') return { text: 'Kopya (İptal)', color: '#ef4444', bg: 'var(--color-background-secondary)' };
      if (grade >= 85) return { text: t('excellent'), color: '#10b981', bg: 'var(--color-background-secondary)' };
      if (grade >= 70) return { text: t('good'), color: '#3b82f6', bg: 'var(--color-background-secondary)' };
      if (grade >= 50) return { text: t('pass'), color: '#f59e0b', bg: 'var(--color-background-secondary)' };
      return { text: t('fail'), color: '#ef4444', bg: 'var(--color-background-secondary)' };
    }
    return { text: t('pending'), color: 'var(--color-text-muted)', bg: 'var(--color-background-secondary)' };
  };

  const styles = {
    container: { width: '1600px', margin: '40px auto' },
    header: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '8px' },
    subtitle: { fontSize: '14px', color: 'var(--color-text-muted)' },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '32px'
    },
    statCard: {
      backgroundColor: 'var(--color-surface)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid var(--color-border)',
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    statValue: { fontSize: '32px', fontWeight: '900', marginBottom: '6px' },
    statLabel: { fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '32px',
      backgroundColor: 'var(--color-background-secondary)',
      padding: '4px',
      borderRadius: '16px',
      width: 'fit-content'
    },
    tab: (active) => ({
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: active ? '#fff' : 'transparent',
      color: active ? '#2563eb' : 'var(--color-text-muted)',
      boxShadow: active ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }),
    card: {
      backgroundColor: 'var(--color-surface)',
      borderRadius: '20px',
      border: '1px solid var(--color-border)',
      overflow: 'hidden',
      marginBottom: '20px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '28px 28px 20px',
      borderBottom: '1px solid #f1f5f9'
    },
    examTitle: { fontSize: '19px', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '6px' },
    examDesc: { fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: '500' },
    badge: (status) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '750',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      backgroundColor: status.bg,
      color: status.color,
      border: `1px solid ${status.bg === 'var(--color-background-secondary)' ? '#fee2e2' : status.bg === 'var(--color-background-secondary)' ? '#dcfce7' : status.bg === 'var(--color-background-secondary)' ? 'var(--color-border)' : status.bg === 'var(--color-background-secondary)' ? '#fef3c7' : 'var(--color-border)'}`
    }),
    cardBody: {
      padding: '24px 28px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '24px'
    },
    infoItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14.5px', color: 'var(--color-text-secondary)', fontWeight: '500' },
    gradeSection: {
      padding: '24px 28px',
      backgroundColor: 'var(--color-background)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    gradeDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    gradeNumber: (grade) => ({
      fontSize: '42px',
      fontWeight: '900',
      color: grade === 'K' ? '#ef4444' : (grade >= 85 ? '#10b981' : grade >= 70 ? '#3b82f6' : grade >= 50 ? '#f59e0b' : '#ef4444'),
      lineHeight: 1
    }),
    feedback: {
      flex: 1,
      padding: '16px 20px',
      backgroundColor: 'var(--color-surface)',
      borderRadius: '12px',
      border: '1px solid var(--color-border)',
      fontSize: '14px',
      color: 'var(--color-text-muted)',
      marginLeft: '32px'
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '60px 20px',
      backgroundColor: 'var(--color-surface)',
      borderRadius: '16px',
      border: '1px solid var(--color-border)',
      minHeight: '300px'
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div style={{ ...styles.container, textAlign: 'center', paddingTop: '100px' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('loading')}</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>{t('gradesAndSubmissions')}</h1>
          <p style={styles.subtitle}>{t('allSubmissionsAndGrades')}</p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#3b82f6' }}>{stats.total}</div>
            <div style={styles.statLabel}>{t('totalSubmissions')}</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#10b981' }}>{stats.graded}</div>
            <div style={styles.statLabel}>{t('graded')}</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#f59e0b' }}>{stats.pending}</div>
            <div style={styles.statLabel}>{t('pending')}</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#8b5cf6' }}>{stats.average}</div>
            <div style={styles.statLabel}>{t('average')}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={styles.tab(activeTab === 'all')} onClick={() => setActiveTab('all')}>
            {t('all')} ({submissions.length})
          </button>
          <button style={styles.tab(activeTab === 'graded')} onClick={() => setActiveTab('graded')}>
            {t('graded')} ({gradedSubmissions.length})
          </button>
          <button style={styles.tab(activeTab === 'pending')} onClick={() => setActiveTab('pending')}>
            {t('pending')} ({pendingSubmissions.length})
          </button>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={48} color='var(--color-border-dark)' style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              {activeTab === 'all' ? t('noSubmissions') :
                activeTab === 'graded' ? t('noGradedSubmissions') :
                  t('noPendingSubmissions')}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              {activeTab === 'all' ? t('startByUploading') : ''}
            </p>
          </div>
        ) : (
          filteredSubmissions.map(submission => {
            const status = getStatusBadge(submission);
            return (
              <div 
                key={submission.id} 
                style={styles.card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                {/* Header */}
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.examTitle}>{submission.exam?.title || t('exam')}</h3>
                    <p style={styles.examDesc}>{submission.exam?.description?.substring(0, 100) || ''}</p>
                  </div>
                  <span style={styles.badge(status)}>
                    {submission.grade !== null && submission.grade !== undefined ? (
                      <><CheckCircle size={14} /> {status.text}</>
                    ) : (
                      <><Clock size={14} /> {status.text}</>
                    )}
                  </span>
                </div>

                {/* Body */}
                <div style={styles.cardBody}>
                  {submission.isQuiz || submission.type === 'quiz' || submission.exam?.isQuiz ? (
                    <>
                      <div style={styles.infoItem}>
                        <CheckCircle size={16} color="#10b981" />
                        <span>{t('quizResult')}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <Calendar size={16} color="#10b981" />
                        <span>{formatDateTime(submission.submittedAt)}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <Award size={16} color="#8b5cf6" />
                        <span>
                          {(submission.grade === null || submission.grade === undefined) ? '-' : submission.earnedPoints} / {(submission.grade === null || submission.grade === undefined) ? '-' : submission.totalPoints} {t('score')}
                        </span>
                      </div>
                      <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                        <button
                          onClick={() => {
                            setSelectedSubmissionForOptic(submission);
                            setOpticalFormOpen(true);
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', backgroundColor: 'var(--color-background-secondary)', color: '#0d9488',
                            border: '1px solid #ccfbf1', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '13px', fontWeight: '600', transition: 'all 0.2s'
                          }}
                        >
                          <FileText size={16} />
                          {t('viewMyExamOptic')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Dosya Listesi - Birden fazla dosya varsa hepsini göster */}
                      {submission.files && submission.files.length > 1 ? (
                        <>
                          <div style={{ ...styles.infoItem, gridColumn: '1 / -1', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                            <FileText size={16} color="#3b82f6" />
                            <span>{submission.files.length} {t('filesUploaded')}</span>
                          </div>
                          {submission.files.map((file, idx) => (
                            <div key={idx} style={{ ...styles.infoItem, gridColumn: '1 / -1', paddingLeft: '32px', fontSize: '14px' }}>
                              <span style={{ color: 'var(--color-text-muted)' }}>📄 {file.fileName} ({formatFileSize(file.fileSize)})</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div style={styles.infoItem}>
                          <FileText size={16} color="#3b82f6" />
                          <span>{submission.fileName}</span>
                        </div>
                      )}
                      <div style={styles.infoItem}>
                        <Calendar size={16} color="#10b981" />
                        <span>{formatDateTime(submission.submittedAt)}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <Eye size={16} color="#8b5cf6" />
                        <span>{submission.files ? formatFileSize(submission.files.reduce((acc, f) => acc + (f.fileSize || 0), 0)) : formatFileSize(submission.fileSize)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Grade Section */}
                {submission.grade !== null && submission.grade !== undefined && (
                  <div style={styles.gradeSection}>
                    <div style={styles.gradeDisplay}>
                      <Award size={24} color={submission.grade === 'K' ? '#ef4444' : '#f59e0b'} />
                      <span style={styles.gradeNumber(submission.grade)}>{submission.grade}</span>
                      {submission.grade !== 'K' && <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>/ 100</span>}
                    </div>
                    {submission.feedback && (
                      <div style={styles.feedback}>
                        <strong>{t('feedback')}:</strong> {submission.feedback}
                      </div>
                    )}
                  </div>
                )}

                {/* Pending Message */}
                {(submission.grade === null || submission.grade === undefined) && (
                  <div style={{ ...styles.gradeSection, backgroundColor: 'var(--color-background-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AlertCircle size={20} color="#f59e0b" />
                      <span style={{ color: '#92400e', fontSize: '14px' }}>
                        {t('waitingForGrade')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Optical Form Modal */}
      <OpticalFormModal
        isOpen={opticalFormOpen}
        onClose={() => {
          setOpticalFormOpen(false);
          setSelectedSubmissionForOptic(null);
        }}
        submission={selectedSubmissionForOptic}
      />
    </StudentLayout>
  );
};

export default Grades;

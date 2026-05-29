import React, { useEffect, useState } from 'react';
import { TeacherLayout } from '../../components/layouts';
import { ConfirmModal } from '../../components/ui';
import { useExamStore } from '../../store/examStore';
import { useLiveSessionStore } from '../../store/liveSessionStore';
import { useAuthStore } from '../../store/authStore';
import { Activity, AlertTriangle, MonitorPlay, Users, Clock, ShieldAlert, XCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/dateHelpers';

const styles = {
    container: {
        padding: '32px',
        backgroundColor: 'var(--color-background)',
        minHeight: '100vh',
    },
    header: {
        marginBottom: '32px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: 'var(--color-text-primary)',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    subtitle: {
        fontSize: '14px',
        color: 'var(--color-text-muted)',
        marginTop: '8px'
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '24px',
        alignItems: 'start'
    },
    examListCard: {
        backgroundColor: 'var(--color-surface)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    examItem: (isActive) => ({
        padding: '16px',
        borderRadius: '12px',
        border: `2px solid ${isActive ? '#3b82f6' : 'transparent'}`,
        backgroundColor: isActive ? 'var(--color-background-secondary)' : 'var(--color-background)',
        cursor: 'pointer',
        marginBottom: '12px',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    }),
    monitorCard: {
        backgroundColor: 'var(--color-surface)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        minHeight: '500px'
    },
    studentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
        marginTop: '24px'
    },
    studentCard: (isOffline, hasWarnings) => ({
        padding: '16px',
        borderRadius: '12px',
        border: `1px solid ${hasWarnings ? '#fecaca' : (isOffline ? 'var(--color-border)' : '#bbf7d0')}`,
        backgroundColor: hasWarnings ? 'var(--color-background-secondary)' : (isOffline ? 'var(--color-background)' : 'var(--color-background-secondary)'),
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    }),
    statusIndicator: (status) => ({
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: status === 'online' ? '#10b981' : '#94a3b8',
        boxShadow: status === 'online' ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
    }),
    warningBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: '#fee2e2',
        color: '#ef4444',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        color: 'var(--color-text-muted)'
    }
};

const LiveExams = () => {
    const { user } = useAuthStore();
    const { getActiveExams, loadExams } = useExamStore();
    const { loadExamSessions, sessions, cancelSession } = useLiveSessionStore();
    const [activeExamsList, setActiveExamsList] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Tamam',
        onConfirm: () => {},
        type: 'warning'
    });

    useEffect(() => {
        const fetchInitial = async () => {
            await loadExams(user?.id);
            const active = getActiveExams();
            setActiveExamsList(active);
            if (active.length > 0) {
                setSelectedExamId(active[0].id);
            }
        };
        fetchInitial();
    }, []);

    useEffect(() => {
        let interval;
        if (selectedExamId) {
            loadExamSessions(selectedExamId); // Load immediately
            interval = setInterval(() => {
                loadExamSessions(selectedExamId);
            }, 5000); // Check every 5 seconds
        }
        return () => clearInterval(interval);
    }, [selectedExamId]);

    const handleExamSelect = (id) => {
        setSelectedExamId(id);
    };

    return (
        <TeacherLayout>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>
                        <MonitorPlay size={32} color="#3b82f6" />
                        Canlı Sınav Gözetmen Radarı
                    </h1>
                    <p style={styles.subtitle}>Sınav sırasında öğrencileri canlı izleyin ve güvenlik uyarılarını takip edin</p>
                </div>

                <div style={styles.contentGrid}>
                    {/* Sol Taraf: Aktif Sınavlar Listesi */}
                    <div style={styles.examListCard}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={20} color="#10b981" />
                            Aktif Sınavlar
                        </h3>
                        
                        {activeExamsList.length === 0 ? (
                            <div style={styles.emptyState}>
                                <MonitorPlay size={48} color='var(--color-border-dark)' style={{ margin: '0 auto 16px' }} />
                                <p>Şu anda canlı sınav bulunmamaktadır.</p>
                            </div>
                        ) : (
                            activeExamsList.map(exam => (
                                <div 
                                    key={exam.id} 
                                    style={styles.examItem(selectedExamId === exam.id)}
                                    onClick={() => handleExamSelect(exam.id)}
                                >
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{exam.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                        <Clock size={14} />
                                        Bitiş: {formatDateTime(exam.endDate)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Sağ Taraf: Gözetmen Radarı Ekranı */}
                    <div style={styles.monitorCard}>
                        {selectedExamId ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Users size={24} color="#3b82f6" />
                                        Canlı Öğrenci Monitörü ({sessions.length})
                                    </h3>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '500' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={styles.statusIndicator('online')} /> Aktif
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={styles.statusIndicator('offline')} /> Bağlantı Koptu
                                        </span>
                                    </div>
                                </div>

                                {sessions.length === 0 ? (
                                    <div style={styles.emptyState}>
                                        <p>Henüz kimse sınava giriş yapmadı veya bağlantı bekleniyor...</p>
                                    </div>
                                ) : (
                                    <div style={styles.studentGrid}>
                                        {sessions.map(student => (
                                            <div key={student.studentId} style={styles.studentCard(student.status === 'offline', student.warnings?.length > 0)}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {student.studentName}
                                                            <div style={styles.statusIndicator(student.status)} title={student.status} />
                                                        </h4>
                                                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{student.studentNumber} • {student.className}</span>
                                                        {student.currentQuestion !== undefined && (
                                                            <span style={{ fontSize: '12px', fontWeight: '500', color: '#3b82f6', backgroundColor: 'var(--color-background-secondary)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' }}>
                                                                Soru: {student.currentQuestion + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {student.status !== 'cancelled' ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmModal({
                                                                    isOpen: true,
                                                                    title: 'Sınavı İptal Et',
                                                                    message: `${student.studentName} isimli öğrencinin sınavını iptal etmek istediğinize emin misiniz? Öğrenci sınavdan atılacaktır.`,
                                                                    confirmText: 'Sınavı İptal Et',
                                                                    type: 'danger',
                                                                    onConfirm: () => {
                                                                        cancelSession(selectedExamId, student.studentId);
                                                                        // Update local state temporarily to show feedback
                                                                        student.status = 'cancelled';
                                                                    }
                                                                });
                                                            }}
                                                            style={{
                                                                padding: '6px 10px',
                                                                backgroundColor: '#fee2e2',
                                                                color: '#ef4444',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            title="Sınavı İptal Et"
                                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fca5a5'}
                                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                                        >
                                                            <XCircle size={14} /> İptal Et
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '6px' }}>
                                                            İPTAL EDİLDİ
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Uyarılar */}
                                                {student.warnings && student.warnings.length > 0 && (
                                                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <ShieldAlert size={14} /> KURAL İHLALLERİ ({student.warnings.length})
                                                        </div>
                                                        <div 
                                                            style={{ maxHeight: '80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}
                                                            ref={(el) => { if(el) el.scrollTop = el.scrollHeight; }}
                                                        >
                                                            {student.warnings.map(w => (
                                                                <div key={w.id} style={styles.warningBadge}>
                                                                    <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                                                                    <span>{w.message}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {student.warnings?.length === 0 && (
                                                    <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                                                        <Activity size={14} /> Sorunsuz ilerliyor
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={styles.emptyState}>
                                <p>İzlemek için sol taraftan aktif bir sınav seçin.</p>
                            </div>
                        )}
                    </div>
                </div>
                <ConfirmModal
                    {...confirmModal}
                    onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                />
            </div>
        </TeacherLayout>
    );
};

export default LiveExams;

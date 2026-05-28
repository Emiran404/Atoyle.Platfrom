import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  ClipboardCheck,
  TrendingUp,
  PlusCircle,
  Clock,
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  HelpCircle,
  Database
} from 'lucide-react';
import { TeacherLayout } from '../../components/layouts';
import { useAuthStore } from '../../store/authStore';
import { useExamStore } from '../../store/examStore';
import { useSubmissionStore } from '../../store/submissionStore';
import { formatDateTime, getRelativeTime } from '../../utils/dateHelpers';
import NotificationPermissionPopup from '../../components/NotificationPermissionPopup';
import { OnboardingTour, Modal, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { t } from '../../utils/i18n';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loadStudents, students } = useAuthStore();
  const { loadExams, getActiveExams, getPastExams } = useExamStore();
  const { loadSubmissions, submissions } = useSubmissionStore();

  const [stats, setStats] = useState({
    totalStudents: 0,
    activeExams: 0,
    pendingEvaluations: 0,
    avgParticipation: 0
  });
  const [activeExams, setActiveExams] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startTour, setStartTour] = useState(0); // Trigger tour re-run

  // Telemetri izin modalı
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);

  // Otomatik yedekleme sihirbazı state'leri
  const [settings, setSettings] = useState(null);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardData, setWizardData] = useState({
    autoBackupEnabled: true,
    autoBackupInterval: 24,
    autoBackupIncludePhotos: false
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Backend'den verileri yükle
        const [studentsData, examsData, submissionsData] = await Promise.all([
          loadStudents(),
          loadExams(),
          loadSubmissions()
        ]);

        try {
          const settingsRes = await fetch('/api/settings');
          const settingsData = await settingsRes.json();
          if (settingsData?.success) {
            setSettings(settingsData.settings);
            setWizardData({
              autoBackupEnabled: settingsData.settings.autoBackupEnabled !== false, // Sihirbazda varsayılan açık gelsin
              autoBackupInterval: settingsData.settings.autoBackupInterval || 24,
              autoBackupIncludePhotos: settingsData.settings.autoBackupIncludePhotos || false
            });
            
            // Eğer telemetri izni hiç sorulmadıysa sor
            if (settingsData.settings.telemetryPromptAnswered === false) {
              setShowTelemetryModal(true);
            }
          }
        } catch (settingsErr) {
          console.error('Ayarlar yüklenemedi:', settingsErr);
        }

        const now = new Date();
        const active = (examsData || []).filter(exam => {
          const start = new Date(exam.startDate);
          const end = new Date(exam.endDate);
          return start <= now && end >= now && (exam.status === 'active' || exam.isActive);
        });

        // edit_granted durumundaki kayıtları filtrele ve sadece mevcut sınavlarda olanları al
        const examIds = new Set((examsData || []).map(e => e.id));
        const activeSubmissions = submissionsData.filter(s => s.status !== 'edit_granted' && examIds.has(s.examId));

        // Unique submission sayısını hesapla (öğrenci-sınav bazında, grade'i olanı seç)
        const uniqueSubmissions = {};
        activeSubmissions.forEach(s => {
          const key = `${s.studentId}-${s.examId}`;
          // Grade'i olan submission'ı önceliklendir
          if (!uniqueSubmissions[key] || (s.grade !== null && s.grade !== undefined)) {
            uniqueSubmissions[key] = s;
          }
        });
        const uniqueSubmissionCount = Object.keys(uniqueSubmissions).length;

        // Bekleyen değerlendirme sayısı (unique submissions içinden)
        const pending = Object.values(uniqueSubmissions).filter(s => s.grade === null || s.grade === undefined).length;

        setStats({
          totalStudents: studentsData.length,
          activeExams: active.length,
          pendingEvaluations: pending,
          avgParticipation: studentsData.length > 0 && active.length > 0
            ? Math.round((uniqueSubmissionCount / (studentsData.length * active.length)) * 100)
            : 0
        });

        setActiveExams(active.slice(0, 4));

        // Aktiviteleri grupla - aynı öğrenci + sınav için birden fazla dosya varsa grupla
        const groupedActivities = {};
        const teacherExamIds = new Set((examsData || []).map(e => e.id));

        submissionsData
          .filter(s => s.status !== 'edit_granted' && teacherExamIds.has(s.examId)) // Sadece öğretmenin sınavları
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
          .forEach(s => {
            const key = `${s.studentId}-${s.examId}`;
            if (!groupedActivities[key]) {
              groupedActivities[key] = {
                id: s.id,
                studentName: s.studentName,
                examId: s.examId,
                files: [],
                time: s.submittedAt
              };
            }
            groupedActivities[key].files.push(s.fileName);
            // En son gönderim zamanını tut
            if (new Date(s.submittedAt) > new Date(groupedActivities[key].time)) {
              groupedActivities[key].time = s.submittedAt;
            }
          });

        const activities = Object.values(groupedActivities)
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 6)
          .map(g => {
            const exam = (examsData || []).find(e => e.id === g.examId);
            return {
              id: g.id,
              type: 'submission',
              message: `${g.studentName || 'Öğrenci'} dosya teslim etti`,
              detail: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontWeight: '600', color: '#0d9488', fontSize: '13px' }}>
                    {exam?.title || 'Bilinmeyen Sınav'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {g.files.length > 1 ? `${g.files.length} Dosya` : g.files[0]}
                  </div>
                </div>
              ),
              time: g.time
            };
          });

        setRecentActivities(activities);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      }
      setLoading(false);
    };

    fetchData();

    // Otomatik yenileme - Her 10 saniyede bir
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handleTelemetryConsent = async (consent) => {
    try {
      // Backend'e güncelleme yolla
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        },
        body: JSON.stringify({
          telemetryEnabled: consent,
          telemetryPromptAnswered: true
        })
      });

      if (res.ok) {
        setShowTelemetryModal(false);
        if (consent) {
          toast.success("Teşekkür ederiz! Telemetri gönderimi başarıyla aktif edildi.", { duration: 4000 });
        } else {
          toast.info("Telemetri gönderimi kapatıldı. Ayarı dilediğiniz zaman Platform Yönetimi sayfasından değiştirebilirsiniz.", { duration: 5000 });
        }
      } else {
        throw new Error('Kayıt başarısız');
      }
    } catch (error) {
      toast.error('Ayarlar kaydedilirken bir hata oluştu.');
      setShowTelemetryModal(false);
    }
  };

  const statCards = [
    {
      label: t('totalStudents'),
      value: stats.totalStudents,
      icon: Users,
      color: '#3b82f6',
      bgColor: 'var(--color-background-secondary)',
      detail: t('registeredStudents')
    },
    {
      label: t('activeExamsLabel'),
      value: stats.activeExams,
      icon: FileText,
      color: '#10b981',
      bgColor: 'var(--color-background-secondary)',
      detail: t('ongoing')
    },
    {
      label: t('pendingEvaluation'),
      value: stats.pendingEvaluations,
      icon: ClipboardCheck,
      color: '#f59e0b',
      bgColor: 'var(--color-background-secondary)',
      detail: t('ungraded')
    },
    {
      label: t('participationRate'),
      value: `${stats.avgParticipation}%`,
      icon: TrendingUp,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      detail: t('submissionRate')
    }
  ];

  const quickActions = [
    { icon: PlusCircle, label: 'Yeni Sınav Oluştur', path: '/ogretmen/sinav-olustur', color: '#0d9488' },
    { icon: ClipboardCheck, label: 'Değerlendirme Yap', path: '/ogretmen/degerlendirme', color: '#f59e0b' },
    { icon: Users, label: 'Öğrenci Listesi', path: '/ogretmen/ogrenci-listesi', color: '#3b82f6' },
    { icon: Clock, label: 'Düzenleme Talepleri', path: '/ogretmen/duzenleme-talepleri', color: '#8b5cf6' }
  ];

  const tourSteps = [
    {
      targetId: 'welcome-header',
      title: 'Hoş Geldiniz! 👋',
      content: 'PolyOS Öğretmen Paneline hoş geldiniz. Bu kısa tur ile platformu keşfedin.',
    },
    {
      targetId: 'new-exam-btn',
      title: 'Sınav Oluşturun 📝',
      content: 'Bu butonu kullanarak yeni bir sınav veya ödev oluşturabilir, öğrencilerinize atayabilirsiniz.',
    },
    {
      targetId: 'stats-grid',
      title: 'Genel İstatistikler 📊',
      content: 'Öğrenci sayısı, aktif sınavlar ve katılım oranlarını buradan takip edebilirsiniz.',
    },
    {
      targetId: 'quick-actions',
      title: 'Hızlı İşlemler ⚡',
      content: 'Sık kullanılan işlemlere buradan anında ulaşabilirsiniz.',
    },
    {
      targetId: 'active-exams',
      title: 'Aktif Sınavlar 🟢',
      content: 'Şu an devam eden sınavlarınızı ve gönderim durumlarını buradan izleyebilirsiniz.',
    },
    {
      targetId: 'recent-activities',
      title: 'Son Aktiviteler 🔔',
      content: 'Öğrencilerinizden gelen son dosya gönderimlerini ve sistem aktivitelerini buradan görebilirsiniz.',
    },
    {
      targetId: 'nav-sinav-olustur',
      title: 'Sınav Oluştur 📋',
      content: 'Sol menüden Sınav Oluştur sayfasına giderek klasik veya quiz türünde yeni sınavlar hazırlayabilirsiniz.',
    },
    {
      targetId: 'nav-aktif-sinavlar',
      title: 'Aktif Sınavlar 📂',
      content: 'Devam eden tüm sınavlarınızı, gönderim sayılarını ve durumlarını bu sayfadan yönetebilirsiniz.',
    },
    {
      targetId: 'nav-canli-sinav',
      title: 'Canlı Sınav 🎯',
      content: 'Öğrencilerin gerçek zamanlı olarak katıldığı canlı sınavları bu sayfadan başlatıp yönetebilirsiniz.',
    },
    {
      targetId: 'nav-ogrenci-listesi',
      title: 'Öğrenci Listesi 👥',
      content: 'Tüm öğrencilerinizi görüntüleyebilir, sınıf/şube filtresi uygulayabilir ve detaylı bilgilerine ulaşabilirsiniz.',
    },
    {
      targetId: 'nav-degerlendirme',
      title: 'Değerlendirme ✅',
      content: 'Öğrencilerin gönderdiği ödev ve sınav cevaplarını buradan inceleyip notlandırabilirsiniz.',
    },
    {
      targetId: 'nav-arsiv',
      title: 'Arşiv 📁',
      content: 'Tamamlanmış sınavların sonuçlarını, istatistiklerini ve raporlarını buradan indirebilirsiniz.',
    },
    {
      targetId: 'nav-istatistikler',
      title: 'İstatistikler 📈',
      content: 'Sınıf bazında başarı oranları, katılım grafikleri ve genel performans raporlarına buradan ulaşabilirsiniz.',
    },
    {
      targetId: 'nav-platform-yonetimi',
      title: 'Platform Yönetimi 🛡️',
      content: 'Sistem ayarlarını yönetebilir, kullanıcı verilerini düzenleyebilir ve platform genelindeki konfigürasyonları buradan yapabilirsiniz.',
    },
    {
      targetId: 'nav-entegre-sistemler',
      title: 'Entegre Sistemler 🖥️',
      content: 'Harici sistemler ve araçlarla entegrasyon ayarlarını bu özel sayfadan yönetebilirsiniz.',
    },
    {
      targetId: 'nav-bildirimler',
      title: 'Bildirimler 🔔',
      content: 'Öğrenci gönderimleri, sistem uyarıları ve önemli olaylar hakkındaki bildirimlerinizi buradan takip edebilirsiniz.',
    },
    {
      targetId: 'nav-ayarlar',
      title: 'Ayarlar ⚙️',
      content: 'Profil bilgilerinizi, şifrenizi ve bildirim tercihlerinizi Ayarlar sayfasından düzenleyebilirsiniz.',
    },
  ];

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '32px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    greeting: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'var(--color-text-primary)',
      marginBottom: '4px'
    },
    subGreeting: {
      fontSize: '14px',
      color: 'var(--color-text-muted)'
    },
    newExamBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      backgroundColor: '#0d9488',
      color: 'var(--color-text-inverse, #fff)',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '20px',
      marginBottom: '32px'
    },
    statCard: {
      backgroundColor: 'var(--color-surface)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid var(--color-border)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    },
    statIcon: (bgColor) => ({
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      backgroundColor: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px'
    }),
    statValue: {
      fontSize: '32px',
      fontWeight: '700',
      color: 'var(--color-text-primary)',
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: '14px',
      color: 'var(--color-text-muted)',
      marginBottom: '2px'
    },
    statDetail: {
      fontSize: '12px',
      color: '#94a3b8'
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      marginBottom: '24px'
    },
    card: {
      backgroundColor: 'var(--color-surface)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid var(--color-border)'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: 'var(--color-text-primary)'
    },
    viewAllBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 12px',
      backgroundColor: 'transparent',
      color: '#0d9488',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    quickActionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px'
    },
    quickActionBtn: (color) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      backgroundColor: 'var(--color-background)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'left'
    }),
    quickActionIcon: (color) => ({
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      backgroundColor: color + '15',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color
    }),
    quickActionLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--color-text-primary)'
    },
    examItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      backgroundColor: 'var(--color-background)',
      borderRadius: '12px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid transparent'
    },
    examInfo: {
      flex: 1
    },
    examTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: 'var(--color-text-primary)',
      marginBottom: '4px'
    },
    examMeta: {
      fontSize: '13px',
      color: 'var(--color-text-muted)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    examBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      backgroundColor: 'var(--color-background-secondary)',
      color: '#059669',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500'
    },
    activityItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px',
      borderRadius: '10px',
      marginBottom: '8px',
      transition: 'background-color 0.2s'
    },
    activityDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#3b82f6',
      marginTop: '6px',
      flexShrink: 0
    },
    activityContent: {
      flex: 1
    },
    activityMessage: {
      fontSize: '14px',
      color: 'var(--color-text-primary)',
      marginBottom: '2px'
    },
    activityDetail: {
      fontSize: '12px',
      color: 'var(--color-text-muted)'
    },
    activityTime: {
      fontSize: '12px',
      color: '#94a3b8',
      whiteSpace: 'nowrap'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: 'var(--color-text-muted)'
    },
    emptyIcon: {
      marginBottom: '12px',
      color: 'var(--color-border-dark)'
    }
  };

  return (
    <TeacherLayout>
      <style>{`
        @media (max-width: 1024px) {
          .teacher-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .teacher-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .teacher-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .teacher-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .teacher-quick-actions-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={styles.container}>
        {/* Telemetri İzni Bannerı */}
        {showTelemetryModal && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            animation: 'in-expo 0.5s ease-out'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1, minWidth: '300px' }}>
              <div style={{
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Activity size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  Platformu Geliştirmemize Yardımcı Olun
                </h4>
                <p style={{ margin: '0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                  Sistemin kullanım durumları, aktif öğrenci sayıları ve hata raporları arka planda otomatik olarak toplanmaktadır. Kişisel veriler <strong>kesinlikle</strong> gönderilmez. Bu özelliği açarak platformun gelişimine destek olabilirsiniz.
                </p>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginTop: '8px' }}>* Bu kararı daha sonra Platform Yönetimi'nden değiştirebilirsiniz.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                onClick={() => handleTelemetryConsent(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
              >
                Hayır, Kapat
              </button>
              <button 
                onClick={() => handleTelemetryConsent(true)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#0284c7',
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#0369a1'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0284c7'; }}
              >
                Evet, İzin Veriyorum
              </button>
            </div>
          </div>
        )}

        {/* Otomatik Yedekleme Sihirbazı Bildirim Bannerı */}
        {settings && !settings.autoBackupWizardConfigured && (
          <div style={{
            backgroundColor: 'var(--color-background-secondary)',
            border: '2px solid #bbf7d0',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
            animation: 'in-expo 0.5s ease-out'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Database size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#14532d' }}>
                  Otomatik Veri Yedekleme Sihirbazı
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: '1.5' }}>
                  Sisteminizin veri güvenliği için otomatik yedeklemeyi ayarlayın. Bu ayara daha sonra <strong>Platform Yönetimi ➔ Veri Yedekleme</strong> menüsünden ulaşabilirsiniz.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWizardModal(true)}
              style={{
                backgroundColor: '#16a34a',
                color: 'var(--color-text-inverse, #fff)',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
              }}
            >
              Şimdi Yapılandır
            </button>
          </div>
        )}

        {/* Header */}
        <div className="teacher-header" style={styles.header}>
          <div id="welcome-header">
            <h1 style={styles.greeting}>Hoş Geldiniz, {user?.fullName} 👋</h1>
            <p style={styles.subGreeting}>{user?.department || 'Öğretmen'} • {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{
                ...styles.newExamBtn,
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                boxShadow: 'none'
              }}
              onClick={() => setStartTour(prev => prev + 1)}
            >
              <HelpCircle size={18} />
              Yardım
            </button>
            <button
              id="new-exam-btn"
              style={styles.newExamBtn}
              onClick={() => navigate('/ogretmen/sinav-olustur')}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <PlusCircle size={18} />
              Yeni Sınav Oluştur
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div id="stats-grid" className="teacher-stats-grid" style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <div
              key={index}
              style={styles.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
              }}
            >
              <div style={styles.statIcon(stat.bgColor)}>
                <stat.icon size={24} color={stat.color} />
              </div>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
              <div style={styles.statDetail}>{stat.detail}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="teacher-main-grid" style={styles.mainGrid}>
          {/* Quick Actions */}
          <div id="quick-actions" style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Hızlı İşlemler</h2>
            </div>
            <div className="teacher-quick-actions-grid" style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  style={styles.quickActionBtn(action.color)}
                  onClick={() => navigate(action.path)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = action.color;
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                >
                  <div style={styles.quickActionIcon(action.color)}>
                    <action.icon size={20} />
                  </div>
                  <span style={styles.quickActionLabel}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Exams */}
          <div id="active-exams" style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Aktif Sınavlar</h2>
              <button
                style={styles.viewAllBtn}
                onClick={() => navigate('/ogretmen/aktif-sinavlar')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Tümünü Gör
                <ChevronRight size={16} />
              </button>
            </div>

            {activeExams.length === 0 ? (
              <div style={styles.emptyState}>
                <Activity size={48} style={styles.emptyIcon} />
                <p>Aktif sınav bulunmuyor</p>
              </div>
            ) : (
              <div>
                {activeExams.map((exam) => (
                  <div
                    key={exam.id}
                    style={styles.examItem}
                    onClick={() => navigate(`/ogretmen/aktif-sinavlar?exam=${exam.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0d9488';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.backgroundColor = 'var(--color-background)';
                    }}
                  >
                    <div style={styles.examInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ ...styles.examTitle, marginBottom: 0 }}>{exam.title}</div>
                        {exam.isQuiz && (
                          <span style={{
                            fontSize: '9px',
                            backgroundColor: 'var(--color-background-secondary)',
                            color: '#0d9488',
                            padding: '1px 6px',
                            border: '1px solid #0d9488',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            borderRadius: '4px'
                          }}>
                            Quiz
                          </span>
                        )}
                      </div>
                      <div style={styles.examMeta}>
                        <Calendar size={14} />
                        {exam.department || 'Genel'}
                      </div>
                    </div>
                    <div style={styles.examBadge}>
                      <CheckCircle size={12} />
                      Aktif
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div id="recent-activities" style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Son Aktiviteler</h2>
          </div>

          {recentActivities.length === 0 ? (
            <div style={styles.emptyState}>
              <Clock size={48} style={styles.emptyIcon} />
              <p>Henüz aktivite bulunmuyor</p>
            </div>
          ) : (
            <div>
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  style={styles.activityItem}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={styles.activityDot} />
                  <div style={styles.activityContent}>
                    <div style={styles.activityMessage}>{activity.message}</div>
                    <div style={styles.activityDetail}>{activity.detail}</div>
                  </div>
                  <div style={styles.activityTime}>{getRelativeTime(activity.time)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <OnboardingTour 
        key={startTour} 
        steps={tourSteps} 
        onComplete={() => setStartTour(0)}
        tourKey={`teacher-onboarding-done-${user?.id || 'unknown'}`}
        forceShow={startTour > 0}
      />
      <NotificationPermissionPopup />

      {/* Otomatik Yedekleme Sihirbazı Modalı */}
      <Modal 
        isOpen={showWizardModal} 
        onClose={() => setShowWizardModal(false)} 
        title="Otomatik Veri Yedekleme Sihirbazı"
      >
        <div style={{ padding: '8px 24px 24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
            Sistem verilerinizin (öğrenciler, sınavlar, gönderimler ve notlar) güvenliğini sağlamak için otomatik yedekleme sistemini yapılandırın.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Otomatik Yedek Aktif mi */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-foreground-secondary)' }}>
                  Otomatik Yedekleme Aktif
                </label>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Belirli aralıklarla arka planda otomatik yedek alınsın mı?
                </p>
              </div>
              <input
                type="checkbox"
                checked={wizardData.autoBackupEnabled}
                onChange={(e) => setWizardData(prev => ({ ...prev, autoBackupEnabled: e.target.checked }))}
                style={{ width: '20px', height: '20px', accentColor: '#16a34a', cursor: 'pointer' }}
              />
            </div>

            {wizardData.autoBackupEnabled && (
              <>
                {/* Yedekleme Sıklığı */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-foreground-secondary)', marginBottom: '8px', display: 'block' }}>
                    Yedekleme Sıklığı (Periyot)
                  </label>
                  <select
                    value={wizardData.autoBackupInterval}
                    onChange={(e) => setWizardData(prev => ({ ...prev, autoBackupInterval: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '2px solid var(--color-border)',
                      borderRadius: '10px',
                      outline: 'none',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-foreground-secondary)'
                    }}
                  >
                    <option value={12}>12 Saatte Bir</option>
                    <option value={24}>Her Gün (24 Saatte Bir)</option>
                    <option value={72}>3 Günde Bir (72 Saatte Bir)</option>
                    <option value={168}>Her Hafta (168 Saatte Bir)</option>
                  </select>
                </div>

                {/* Fotoğraflar dahil edilsin mi */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-foreground-secondary)' }}>
                      Öğrenci Teslim Dosyalarını (uploads) Dahil Et
                    </label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Öğrencilerin gönderdiği resim/ödev dosyaları yedeğe eklensin mi? (Boyutu büyütebilir)
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={wizardData.autoBackupIncludePhotos}
                    onChange={(e) => setWizardData(prev => ({ ...prev, autoBackupIncludePhotos: e.target.checked }))}
                    style={{ width: '20px', height: '20px', accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                </div>
              </>
            )}

            <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
              <Button
                type="button"
                onClick={() => setShowWizardModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '500'
                }}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    const settingsToSave = {
                      ...settings,
                      autoBackupEnabled: wizardData.autoBackupEnabled,
                      autoBackupInterval: wizardData.autoBackupInterval,
                      autoBackupIncludePhotos: wizardData.autoBackupIncludePhotos,
                      autoBackupWizardConfigured: true
                    };

                    const response = await fetch('/api/settings', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${useAuthStore.getState().token}`
                      },
                      body: JSON.stringify(settingsToSave)
                    });
                    const resData = await response.json();

                    if (resData?.success) {
                      setSettings(resData.settings);
                      setShowWizardModal(false);
                      toast.success('Otomatik yedekleme başarıyla yapılandırıldı.');
                    } else {
                      toast.error('Ayarlar kaydedilemedi.');
                    }
                  } catch (err) {
                    console.error('Wizard save error:', err);
                    toast.error('Ayarlar kaydedilirken hata oluştu.');
                  }
                }}
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-inverse, #fff)',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                }}
              >
                Kaydet ve Kapat
              </Button>
            </div>
          </div>
        </div>
      </Modal>

    </TeacherLayout>
  );
};

export default TeacherDashboard;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Upload, Bell, Calendar, CheckCircle, AlertCircle, Info,
  Timer, FileText, Search, FolderOpen, CalendarClock, ArrowRight,
  LogOut, User, GraduationCap, Hash, TrendingUp, ChevronRight
} from 'lucide-react';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { useAuthStore } from '../../store/authStore';
import { useExamStore } from '../../store/examStore';
import { useSubmissionStore } from '../../store/submissionStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDateTime, calculateCountdown, getRelativeTime } from '../../utils/dateHelpers';
import NotificationPermissionPopup from '../../components/NotificationPermissionPopup';
import { OnboardingTour, LanguageSwitcher } from '../../components/ui';
import { t, languages } from '../../utils/i18n';
import { getNotificationTranslation } from '../../utils/notificationHelpers';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, language, setLanguage, theme, setTheme, logout } = useAuthStore();
  const { loadExams, getExamsForStudent } = useExamStore();
  const { loadSubmissions, getStudentSubmissions } = useSubmissionStore();
  const { notifications, loadNotifications, markAsRead, unreadCount } = useNotificationStore();

  const [activeExams, setActiveExams] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [endedExams, setEndedExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [startTour, setStartTour] = useState(0);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const tourSteps = [
    {
      targetId: 'student-welcome-header',
      title: t('tour_welcome_title'),
      content: t('tour_welcome_content'),
    },
    {
      targetId: 'student-stats-grid',
      title: t('tour_stats_title'),
      content: t('tour_stats_content'),
    },
    {
      targetId: 'student-active-exams',
      title: t('tour_active_exams_title'),
      content: t('tour_active_exams_content'),
    },
    {
      targetId: 'student-nav-panel',
      title: t('tour_nav_home_title'),
      content: t('tour_nav_home_content'),
    },
    {
      targetId: 'student-nav-dosya-yukle',
      title: t('tour_nav_upload_title'),
      content: t('tour_nav_upload_content'),
    },
    {
      targetId: 'student-nav-gonderimlerim',
      title: t('tour_nav_submissions_title'),
      content: t('tour_nav_submissions_content'),
    },
    {
      targetId: 'student-nav-notlarim',
      title: t('tour_nav_grades_title'),
      content: t('tour_nav_grades_content'),
    },
    {
      targetId: 'student-nav-optiklerim',
      title: t('tour_nav_optics_title'),
      content: t('tour_nav_optics_content'),
    },
    {
      targetId: 'student-nav-bildirimler',
      title: t('tour_nav_notifications_title'),
      content: t('tour_nav_notifications_content'),
    },
    {
      targetId: 'student-nav-ayarlar',
      title: t('tour_nav_settings_title'),
      content: t('tour_nav_settings_content'),
    },
    {
      targetId: 'student-language-switcher',
      title: t('tour_language_title'),
      content: t('tour_language_content'),
      hideButtonDuration: 20000, // 20s to ensure it stays hidden until auto-finish
      hideBackButton: true,
      zoom: true,
    },
  ];

  const handleLanguageChange = useCallback((lang) => {
    const lowerLang = lang.toLowerCase();
    setLanguage(lowerLang);
  }, [setLanguage]);

  // getNotificationTranslation helper is now imported from utils


  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        await loadExams();
        const now = new Date();

        // Merkezi store fonksiyonunu kullan
        const studentExams = getExamsForStudent(user.id, user.className);

        const active = studentExams.filter(exam => {
          const start = new Date(exam.startDate);
          const end = new Date(exam.endDate);

          // Tarih aralığında ve henüz tamamlanmamışsa aktif say
          const isDateActive = start <= now && end >= now;
          const isStatusNotCompleted = exam.status !== 'completed' && exam.isActive !== false;

          return isDateActive && isStatusNotCompleted;
        });

        const upcoming = studentExams.filter(exam => {
          const start = new Date(exam.startDate);
          return start > now && exam.status !== 'completed' && exam.isActive !== false;
        }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 3);

        const ended = studentExams.filter(exam => {
          const end = new Date(exam.endDate);
          return end < now;
        }).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

        setActiveExams(active);
        setUpcomingExams(upcoming);
        setEndedExams(ended);

        await loadSubmissions();
        const userSubmissions = getStudentSubmissions(user.id);
        setSubmissions(userSubmissions);
      } catch (error) {
        console.error('Error loading data:', error);
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
  }, [user, language]);

  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns = {};
      activeExams.forEach(exam => {
        newCountdowns[exam.id] = calculateCountdown(exam.endDate);
      });
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [activeExams]);

  const hasSubmitted = (examId) => {
    return submissions.some(s => s.examId === examId && s.status !== 'edit_granted');
  };

  const formatCountdown = (countdown) => {
    if (!countdown) return '--:--:--';
    if (countdown.isExpired) return '00:00:00';

    const { days, hours, minutes, seconds } = countdown;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCountdownColor = (countdown) => {
    if (!countdown || countdown.isExpired) return '#dc2626';
    const totalMinutes = countdown.days * 24 * 60 + countdown.hours * 60 + countdown.minutes;
    if (totalMinutes <= 5) return '#dc2626';
    if (totalMinutes <= 30) return '#d97706';
    return 'var(--color-text-primary)';
  };

  // Son 3 bildirimi göster (okunmuş veya okunmamış fark etmeksizin)
  const recentNotifications = notifications.slice(0, 3);
  const activeSubmissions = submissions.filter(s => s.status !== 'edit_granted');

  // Ortalama not hesaplama
  const averageGrade = submissions.length > 0
    ? (() => {
      const gradedItems = submissions.filter(s => s.grade !== null && s.grade !== undefined && typeof s.grade === 'number');
      if (gradedItems.length === 0) return 0;
      const sum = gradedItems.reduce((acc, curr) => acc + curr.grade, 0);
      return Math.round(sum / gradedItems.length);
    })()
    : 0;

  // Dışarı tıklayınca profil menüsünü kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <>
      <NotificationPermissionPopup />

      {/* Sidebar */}
      <StudentSidebar />

      {/* Main Content Area */}
      <div style={{
        marginLeft: '288px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-background)'
      }}>
        {/* Top Navbar - HTML'deki header kısmı */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0
        }}>
          <div id="student-welcome-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              lineHeight: '1.2'
            }}>
              {t('welcomeBack')}, {user?.fullName}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              {t('examStatusToday')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Help / Tour button */}
            <button
              onClick={() => setStartTour(prev => prev + 1)}
              title="Tanıtım turunu başlat"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2463eb'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#2463eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-background)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              ❓ {t('help')}
            </button>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                height: '40px',
                width: '256px',
                background: 'var(--color-background)',
                borderRadius: '12px',
                padding: '0 12px',
                border: searchQuery ? '1px solid #2463eb' : '1px solid transparent',
                transition: 'all 0.2s'
              }}>
                <Search size={20} style={{ color: searchQuery ? '#2463eb' : '#94a3b8' }} />
                <input
                  type="text"
                  placeholder={t('searchExams')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(e.target.value.length > 0);
                  }}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    width: '100%',
                    paddingLeft: '8px',
                    outline: 'none',
                    color: 'var(--color-text-secondary)'
                  }}
                />
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery && (
                <div style={{
                  position: 'absolute',
                  top: '48px',
                  left: 0,
                  right: 0,
                  background: 'var(--color-surface)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                  border: '1px solid var(--color-border)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  zIndex: 1000
                }}>
                  {(() => {
                    const allExams = [...activeExams, ...upcomingExams, ...endedExams];
                    const searchResults = allExams.filter(exam =>
                      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (searchResults.length === 0) {
                      return (
                        <div style={{
                          padding: '24px',
                          textAlign: 'center',
                          color: '#94a3b8',
                          fontSize: '14px'
                        }}>
                          {t('noSearchResults')}
                        </div>
                      );
                    }

                    return searchResults.map((exam, index) => {
                      const now = new Date();
                      const startDate = new Date(exam.startDate);
                      const endDate = new Date(exam.endDate);
                      const isActive = startDate <= now && endDate >= now;
                      const isUpcoming = startDate > now;
                      const isEnded = endDate < now;

                      return (
                        <div
                          key={exam.id}
                          onClick={() => navigate(`/ogrenci/dosya-yukle?examId=${exam.id}`)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: index < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: isActive
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : isUpcoming
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '700',
                            flexShrink: 0
                          }}>
                            {exam.title?.charAt(0).toUpperCase()}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '4px'
                            }}>
                              <h6 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: 'var(--color-text-primary)',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                              }}>
                                {exam.title}
                              </h6>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                background: isActive
                                  ? '#d1fae5'
                                  : isUpcoming
                                    ? '#fef3c7'
                                    : 'var(--color-background-secondary)',
                                color: isActive
                                  ? '#065f46'
                                  : isUpcoming
                                    ? '#92400e'
                                    : 'var(--color-text-secondary)'
                              }}>
                                {isActive ? t('active') : isUpcoming ? t('upcoming') : t('ended')}
                              </span>
                            </div>
                            {(exam.description || exam.className) && (
                              <p style={{
                                fontSize: '12px',
                                color: 'var(--color-text-muted)',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {exam.description || exam.className}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div id="student-language-switcher">
              <LanguageSwitcher 
                currentLanguage={language} 
                onLanguageChange={handleLanguageChange} 
                isTourStepActive={currentTourStep === (tourSteps.length - 1)}
              />
            </div>

            {/* Profile */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isProfileOpen ? '#2463eb' : 'var(--color-border-dark)',
                  border: '2px solid white',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: isProfileOpen ? 'white' : 'var(--color-text-secondary)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                {user?.fullName?.charAt(0).toUpperCase()}
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div style={{
                  position: 'absolute',
                  top: '52px',
                  right: 0,
                  width: '280px',
                  background: 'var(--color-surface)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                  border: '1px solid var(--color-border)',
                  padding: '16px',
                  zIndex: 1000,
                  animation: 'in-expo 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2463eb 0%, #1d4ed8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: '700'
                    }}>
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.fullName}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {t('studentAccount')}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ color: '#94a3b8' }}><GraduationCap size={16} /></div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        <span style={{ color: '#94a3b8', marginRight: '4px' }}>{t('className')}:</span>
                        <span style={{ fontWeight: '600' }}>{user?.className || t('notSpecified')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ color: '#94a3b8' }}><Hash size={16} /></div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        <span style={{ color: '#94a3b8', marginRight: '4px' }}>{t('studentNumber')}:</span>
                        <span style={{ fontWeight: '600' }}>{user?.studentNumber || t('notSpecified')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ color: '#94a3b8' }}><TrendingUp size={16} /></div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        <span style={{ color: '#94a3b8', marginRight: '4px' }}>{t('averageGrade')}:</span>
                        <span style={{ 
                          fontWeight: '700', 
                          color: averageGrade >= 70 ? '#10b981' : averageGrade >= 50 ? '#f59e0b' : '#ef4444' 
                        }}>
                          {averageGrade}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Theme Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                      {theme === 'dark' ? t('darkTheme', 'Koyu Tema') : t('lightTheme', 'Açık Tema')}
                    </span>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      style={{
                        width: '40px', height: '22px', borderRadius: '12px',
                        background: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)',
                        position: 'relative', cursor: 'pointer', border: 'none', transition: 'background 0.3s'
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', background: 'var(--color-surface)',
                        position: 'absolute', top: '2px', left: theme === 'dark' ? '20px' : '2px',
                        transition: 'left 0.3s'
                      }} />
                    </button>
                  </div>

                  {/* Logout Button */}
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-background-secondary)';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--color-background)';
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      color: 'var(--color-text-muted)',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <LogOut size={16} />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          padding: '32px',
          paddingBottom: '80px',
          fontFamily: 'Lexend, sans-serif',
          background: 'var(--color-background)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Stats Grid */}
            <section id="student-stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}>
              {/* Active Exams */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                background: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
                onClick={() => navigate('/ogrenci/dosya-yukle')}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    padding: '12px',
                    background: 'var(--color-background-secondary)',
                    color: '#3b82f6',
                    borderRadius: '8px'
                  }}>
                    <FileText size={24} />
                  </div>
                  {activeExams.length > 0 && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#16a34a',
                      background: 'var(--color-background-secondary)',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      {t('live')}
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  {t('activeExams')}
                </p>
                <h3 style={{ fontSize: '30px', fontWeight: '700', color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  {activeExams.length}
                </h3>
              </div>

              {/* Total Submissions */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                background: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
                onClick={() => navigate('/ogrenci/notlarim')}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    padding: '12px',
                    background: 'var(--color-background-secondary)',
                    color: '#a855f7',
                    borderRadius: '8px'
                  }}>
                    <Upload size={24} />
                  </div>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  {t('totalSubmissions')}
                </p>
                <h3 style={{ fontSize: '30px', fontWeight: '700', color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  {activeSubmissions.length}
                </h3>
              </div>

              {/* Upcoming Exams */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                background: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
                onClick={() => navigate('/ogrenci/yaklasan-sinavlar')}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    padding: '12px',
                    background: 'var(--color-background-secondary)',
                    color: '#f97316',
                    borderRadius: '8px'
                  }}>
                    <CalendarClock size={24} />
                  </div>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  {t('upcomingExams')}
                </p>
                <h3 style={{ fontSize: '30px', fontWeight: '700', color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  {upcomingExams.length}
                </h3>
              </div>

              {/* Unread Notifications */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                background: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
                onClick={() => navigate('/ogrenci/bildirimler')}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    padding: '12px',
                    background: 'var(--color-background-secondary)',
                    color: '#ef4444',
                    borderRadius: '8px'
                  }}>
                    <Bell size={24} />
                  </div>
                  {unreadCount > 0 && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '700',
                      borderRadius: '50%'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  {t('unreadNotifications')}
                </p>
                <h3 style={{ fontSize: '30px', fontWeight: '700', color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  {unreadCount}
                </h3>
              </div>
            </section>

            {/* Active Exams List */}
            <section id="student-active-exams" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {t('activeExams')}
                </h3>
                <a
                  onClick={() => navigate('/ogrenci/dosya-yukle')}
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#2463eb',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#2463eb'}
                >
                  {t('viewAll')}
                </a>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(540px, 1fr))',
                gap: '24px'
              }}>
                {activeExams.length === 0 ? (
                  <div style={{
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    padding: '48px',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gridColumn: '1 / -1',
                    minHeight: '200px'
                  }}>
                    <FileText size={48} color='var(--color-border-dark)' style={{ marginBottom: '16px' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>
                      {t('noActiveExams')}
                    </p>
                  </div>
                ) : (
                  activeExams
                    .filter(exam => exam.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((exam, idx) => (
                      <div key={exam.id} style={{
                        background: 'var(--color-surface)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '24px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* Background Watermark Icon */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          padding: '16px',
                          opacity: 0.05,
                          pointerEvents: 'none'
                        }}>
                          <FileText size={120} />
                        </div>

                        {/* Image Placeholder (resim yerine gradient) */}
                        <div style={{
                          width: '192px',
                          height: '160px',
                          flexShrink: 0,
                          borderRadius: '12px',
                          background: idx === 0
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '48px',
                          fontWeight: '700',
                          opacity: 0.9
                        }}>
                          {exam.title?.charAt(0).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '16px'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--color-text-muted)'
                              }}>
                                {exam.className || 'All Classes'}
                              </span>
                              {countdowns[exam.id] && !countdowns[exam.id].isExpired &&
                                (countdowns[exam.id].days * 24 * 60 + countdowns[exam.id].hours * 60 + countdowns[exam.id].minutes <= 30) && (
                                  <>
                                    <span style={{ width: '4px', height: '4px', background: 'var(--color-border-dark)', borderRadius: '50%' }}></span>
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      color: '#ef4444'
                                    }}>
                                      Urgent
                                    </span>
                                  </>
                                )}
                            </div>

                            <h4 style={{
                              fontSize: '18px',
                              fontWeight: '700',
                              color: 'var(--color-text-primary)',
                              marginBottom: '12px',
                              lineHeight: '1.3'
                            }}>
                              {exam.title}
                            </h4>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
                              <Timer size={18} />
                              <span style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '18px',
                                fontWeight: '500',
                                color: getCountdownColor(countdowns[exam.id])
                              }}>
                                {formatCountdown(countdowns[exam.id])}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'var(--color-background)',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: 'var(--color-text-secondary)'
                              }}>
                                {exam.fileTypes?.join(' / ').toUpperCase() || 'PDF Only'}
                              </span>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'var(--color-background)',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: 'var(--color-text-secondary)'
                              }}>
                                Max {exam.maxFileSize ? Math.round(exam.maxFileSize / (1024 * 1024)) : 10}MB
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                if (exam.isQuiz) {
                                  navigate(`/ogrenci/quiz/${exam.id}`);
                                } else {
                                  navigate(`/ogrenci/dosya-yukle?exam=${exam.id}`);
                                }
                              }}
                              disabled={hasSubmitted(exam.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                width: '100%',
                                height: '44px',
                                background: hasSubmitted(exam.id)
                                  ? 'var(--color-background-secondary)'
                                  : (idx === 0 ? '#2463eb' : 'var(--color-background-secondary)'),
                                color: hasSubmitted(exam.id)
                                  ? 'var(--color-text-muted)'
                                  : (idx === 0 ? 'white' : 'var(--color-text-secondary)'),
                                border: hasSubmitted(exam.id)
                                  ? '2px solid var(--color-border)'
                                  : (idx === 0 ? 'none' : '2px solid var(--color-border)'),
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: hasSubmitted(exam.id) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: idx === 0 && !hasSubmitted(exam.id)
                                  ? '0 8px 16px rgba(36, 99, 235, 0.2)'
                                  : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (!hasSubmitted(exam.id)) {
                                  if (idx === 0) {
                                    e.currentTarget.style.background = '#1d4ed8';
                                  } else {
                                    e.currentTarget.style.borderColor = '#2463eb';
                                  }
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!hasSubmitted(exam.id)) {
                                  if (idx === 0) {
                                    e.currentTarget.style.background = '#2463eb';
                                  } else {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                  }
                                }
                              }}
                            >
                              <ArrowRight size={20} />
                              {t('enterExam')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </section>

            {/* Bottom Section Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '32px'
            }}>
              {/* Notifications - 2/3 width */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {t('recentNotifications')}
                </h3>
                <div style={{
                  background: 'var(--color-surface)',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden'
                }}>
                  {recentNotifications.length === 0 ? (
                    <div style={{
                      padding: '48px 32px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}>
                      <Info size={40} color='var(--color-border-dark)' style={{ marginBottom: '12px' }} />
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        {t('noNotifications')}
                      </p>
                    </div>
                  ) : (
                    recentNotifications.map((notif, index) => {
                      const translatedNotif = getNotificationTranslation(notif);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => !notif.isRead && markAsRead(notif.id)}
                          style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '16px',
                            borderBottom: index < recentNotifications.length - 1 ? '1px solid #f8fafc' : 'none',
                            borderLeft: `4px solid ${notif.isRead ? 'var(--color-border)' : (
                              notif.type === 'success' ? '#10b981' :
                                notif.type === 'warning' ? '#f59e0b' :
                                  notif.type === 'error' ? '#ef4444' : '#2463eb'
                            )}`,
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            backgroundColor: notif.isRead ? 'transparent' : 'rgba(36, 99, 235, 0.02)',
                            opacity: notif.isRead ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(36, 99, 235, 0.02)'}
                        >
                          <div style={{
                            marginTop: '4px',
                            color: notif.type === 'success' ? '#10b981' :
                              notif.type === 'warning' ? '#f59e0b' :
                                notif.type === 'error' ? '#ef4444' : '#2463eb'
                          }}>
                            {notif.type === 'success' ? <CheckCircle size={20} /> :
                              notif.type === 'warning' ? <AlertCircle size={20} /> :
                                <Info size={20} />}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <h5 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                              {translatedNotif.title}
                            </h5>
                            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                              {translatedNotif.message}
                            </p>
                            <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                              {getRelativeTime(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Upcoming Schedule - 1/3 width */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {t('upcomingExams')}
                </h3>
                <div style={{
                  background: 'var(--color-surface)',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid var(--color-border)',
                  padding: '16px'
                }}>
                  {(() => {
                    const filteredUpcomingExams = upcomingExams.filter(exam =>
                      exam.title.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (upcomingExams.length === 0) {
                      return (
                        <div style={{
                          padding: '32px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center'
                        }}>
                          <Calendar size={32} color='var(--color-border-dark)' style={{ marginBottom: '12px' }} />
                          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                            {t('noUpcomingExams')}
                          </p>
                        </div>
                      );
                    }

                    if (filteredUpcomingExams.length === 0) {
                      return (
                        <div style={{
                          padding: '32px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center'
                        }}>
                          <Info size={32} color='var(--color-border-dark)' style={{ marginBottom: '12px' }} />
                          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                            {t('noSearchResults')}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredUpcomingExams.map((exam, index) => {
                          const startDate = new Date(exam.startDate);
                          const monthNames = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

                          return (
                            <React.Fragment key={exam.id}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '48px',
                                  height: '56px',
                                  background: 'var(--color-background)',
                                  borderRadius: '8px',
                                  flexShrink: 0
                                }}>
                                  <span style={{
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: '#94a3b8',
                                    textTransform: 'uppercase'
                                  }}>
                                    {monthNames[startDate.getMonth()]}
                                  </span>
                                  <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                                    {startDate.getDate()}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                  <h6 style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: 'var(--color-text-primary)',
                                    marginBottom: '4px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {exam.title}
                                  </h6>
                                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                    {startDate.toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </p>
                                </div>
                              </div>
                              {index < upcomingExams.length - 1 && (
                                <div style={{ height: '1px', background: 'var(--color-background)', width: '100%' }}></div>
                              )}
                            </React.Fragment>
                          );
                        })}

                        <button
                          onClick={() => navigate('/ogrenci/program')}
                          style={{
                            width: '100%',
                            marginTop: '16px',
                            padding: '8px',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#2463eb',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {t('viewFullCalendar')}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Ended Exams Section */}
            {(() => {
              const filteredEndedExams = endedExams.filter(exam =>
                exam.title.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (endedExams.length === 0) return null;

              return (
                <div style={{ marginTop: '48px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '24px'
                  }}>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      color: 'var(--color-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {t('endedExams')}
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#94a3b8',
                        background: 'var(--color-background)',
                        padding: '4px 12px',
                        borderRadius: '12px'
                      }}>
                        {filteredEndedExams.length}
                      </span>
                    </h2>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(540px, 1fr))',
                    gap: '24px'
                  }}>
                    {filteredEndedExams.length === 0 ? (
                      <div style={{
                        background: 'var(--color-surface)',
                        borderRadius: '16px',
                        padding: '48px',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center',
                        gridColumn: '1 / -1'
                      }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>
                          {t('noSearchResults')}
                        </p>
                      </div>
                    ) : (
                      filteredEndedExams.slice(0, 4).map((exam, idx) => {
                        const endDate = new Date(exam.endDate);
                        const startDate = new Date(exam.startDate);

                        return (
                          <div key={exam.id} style={{
                            background: 'var(--color-surface)',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '24px',
                            position: 'relative',
                            overflow: 'hidden',
                            opacity: 0.7
                          }}>
                            {/* Background Watermark Icon */}
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              padding: '16px',
                              opacity: 0.05,
                              pointerEvents: 'none'
                            }}>
                              <FileText size={120} />
                            </div>

                            {/* Image Placeholder */}
                            <div style={{
                              width: '192px',
                              height: '160px',
                              flexShrink: 0,
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '48px',
                              fontWeight: '700',
                              opacity: 0.9
                            }}>
                              {exam.title?.charAt(0).toUpperCase()}
                            </div>

                            {/* Content */}
                            <div style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '16px'
                            }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    color: 'var(--color-text-muted)'
                                  }}>
                                    {exam.className || 'All Classes'}
                                  </span>
                                  <span style={{ width: '4px', height: '4px', background: 'var(--color-border-dark)', borderRadius: '50%' }}></span>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#94a3b8',
                                    background: 'var(--color-background)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                  }}>
                                    {t('ended')}
                                  </span>
                                </div>

                                <h4 style={{
                                  fontSize: '18px',
                                  fontWeight: '800',
                                  color: 'var(--color-text-primary)',
                                  marginBottom: '8px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}>
                                  {exam.title}
                                </h4>

                                {exam.description && (
                                  <p style={{
                                    fontSize: '14px',
                                    color: 'var(--color-text-muted)',
                                    lineHeight: '1.5',
                                    margin: '0',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {exam.description}
                                  </p>
                                )}
                                {exam.teacherName && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                    <span style={{ fontWeight: '600', color: '#2463eb' }}>👨‍🏫 {exam.teacherName}</span>
                                  </div>
                                )}
                              </div>

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '16px'
                              }}>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} />
                                    <span>
                                      {startDate.toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  <span>-</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>
                                      {endDate.toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Folder Path Banner */}
            <div style={{ marginTop: '48px' }}>
              <div style={{
                width: '100%',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-text-muted)'
              }}>
                <FolderOpen size={16} />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  letterSpacing: '-0.02em'
                }}>
                  ~/Documents/Atolye/Submissions/2023-Fall/
                </span>
              </div>
            </div>

          </div>
        </div>
        <OnboardingTour 
          key={startTour} 
          steps={tourSteps} 
          onStepChange={setCurrentTourStep} 
          onComplete={() => setStartTour(0)}
          tourKey={`student-onboarding-done-${user?.id || 'unknown'}`} 
          forceShow={startTour > 0}
        />
      </div>
      <NotificationPermissionPopup />
    </>
  );
};

export default StudentDashboard;
import React, { useState } from 'react';
import { User, Lock, Globe, Copy, Eye, EyeOff, BadgeCheck, School, Home, ArrowRight, Sun, Moon } from 'lucide-react';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Bell, Key } from 'lucide-react';
import { checkPasswordStrength } from '../../utils/crypto';
import { t, languages } from '../../utils/i18n';

const Settings = () => {
  const { user, changePassword: updatePassword, language, setLanguage, updateNotificationSettings, theme, setTheme } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(user?.notificationSettings?.loginAlerts ?? true);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
  };

  const getPasswordStrength = () => {
    if (!passwordData.newPassword) return { level: 0, text: '', color: '' };
    const strength = checkPasswordStrength(passwordData.newPassword);

    if (strength.score < 2) return { level: 1, text: t('weak'), color: '#ef4444' };
    if (strength.score < 4) return { level: 2, text: t('medium'), color: '#f59e0b' };
    return { level: 3, text: t('strong'), color: '#10b981' };
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(t('passwordMismatch'));
      return;
    }

    const strength = checkPasswordStrength(passwordData.newPassword);
    if (!strength.isValid) {
      alert(t('passwordWeak'));
      return;
    }

    try {
      await updatePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
      alert(t('passwordChanged'));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert(error.message);
    }
  };
  
  const handleSaveNotifications = () => {
    setSaving(true);
    updateNotificationSettings({ loginAlerts });
    setTimeout(() => {
      alert(t('success'));
      setSaving(false);
    }, 500);
  };

  const copyFolderPath = () => {
    const path = `~/Documents/Atolye/Submissions/${user.className}/${user.fullName}`;
    navigator.clipboard.writeText(path);
    alert(t('copiedToClipboard') || 'Copied to clipboard!');
  };

  const strength = getPasswordStrength();
  const languageFlags = {
    tr: '🇹🇷',
    en: '🇬🇧',
    de: '🇩🇪',
    ru: '🇷🇺'
  };

  return (
    <>
      <StudentSidebar />

      {/* Main Content */}
      <div style={{
        marginLeft: '288px',
        minHeight: '100vh',
        background: 'var(--color-background)'
      }}>
        {/* Header */}
        <header style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '20px 48px'
        }}>
          {/* Breadcrumbs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#94a3b8',
            marginBottom: '16px'
          }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#2463eb'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>
              {t('home')}
            </span>
            <span>/</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#2463eb'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>
              {t('profile')}
            </span>
            <span>/</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>{t('settings')}</span>
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--color-text-primary)'
          }}>
            {t('settings')}
          </h1>
        </header>

        {/* Content */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px'
        }}>
          {/* Profile Card (Read Only) */}
          <section style={{
            background: 'var(--color-surface)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid var(--color-border)',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background */}
            <div style={{
              position: 'absolute',
              right: '-40px',
              top: '-40px',
              width: '256px',
              height: '256px',
              background: 'rgba(36, 99, 235, 0.05)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              pointerEvents: 'none'
            }}></div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              position: 'relative'
            }}>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '112px',
                  height: '112px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2463eb 0%, #1e40af 100%)',
                  border: '4px solid white',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  fontWeight: '700',
                  color: 'white'
                }}>
                  {user?.fullName?.charAt(0)}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  width: '16px',
                  height: '16px',
                  background: '#10b981',
                  borderRadius: '50%',
                  border: '2px solid white'
                }} title="Online"></div>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'var(--color-text-primary)',
                  marginBottom: '8px'
                }}>
                  {user?.fullName}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--color-text-muted)',
                    fontSize: '14px'
                  }}>
                    <BadgeCheck size={18} />
                    <span>{t('studentNumber')}: </span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>{user?.studentNumber}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--color-text-muted)',
                    fontSize: '14px'
                  }}>
                    <School size={18} />
                    <span>{t('className')}: </span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>{user?.className}</span>
                  </div>
                </div>
              </div>

              {/* Read Only Badge */}
              <div style={{
                padding: '6px 16px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.05em',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                {t('readOnly')}
              </div>
            </div>
          </section>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '32px'
          }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Language Preference */}
              <section style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'var(--color-text-primary)',
                      marginBottom: '4px'
                    }}>
                      {t('languagePreference')}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {t('selectPreferredLanguage')}
                    </p>
                  </div>
                  <Globe size={32} style={{ color: 'var(--color-border-dark)' }} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px'
                }}>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: language === lang.code ? '2px solid #2463eb' : '2px solid #e2e8f0',
                        background: language === lang.code ? '#eef5ff' : 'var(--color-background)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: language === lang.code ? '0 2px 4px rgba(36, 99, 235, 0.1)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (language !== lang.code) {
                          e.currentTarget.style.borderColor = 'rgba(36, 99, 235, 0.5)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (language !== lang.code) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }
                      }}
                    >
                      {language === lang.code && (
                        <>
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '8px',
                            height: '8px',
                            background: '#2463eb',
                            borderRadius: '50%',
                            animation: 'pulse 2s infinite'
                          }}></div>
                          <span style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '2px 8px',
                            background: '#2463eb',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            borderRadius: '999px',
                            boxShadow: '0 2px 4px rgba(36, 99, 235, 0.3)'
                          }}>
                            {t('active')}
                          </span>
                        </>
                      )}
                      <div style={{
                        fontSize: '40px',
                        lineHeight: 1
                      }}>
                        {languageFlags[lang.code]}
                      </div>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: language === lang.code ? '700' : '600',
                        color: language === lang.code ? '#2463eb' : 'var(--color-text-muted)'
                      }}>
                        {lang.nativeName}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Local Data Folder */}
              <section style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--color-text-primary)',
                    marginBottom: '4px'
                  }}>
                    {t('localDataFolder')}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    {t('assignmentsSyncedHere')}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '12px 16px'
                }}>
                  <code style={{
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: 'var(--color-text-muted)'
                  }}>
                    ~/Documents/Atolye/Submissions/{user?.className}/
                  </code>
                  <button
                    onClick={copyFolderPath}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#2463eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                    }}
                    title={t('copyPath')}
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </section>

              {/* Notification Preferences */}
              <section style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    padding: '8px',
                    background: 'var(--color-background-secondary)',
                    borderRadius: '12px',
                    color: '#10b981'
                  }}>
                    <Bell size={24} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'var(--color-text-primary)',
                      marginBottom: '2px'
                    }}>
                      {t('notificationPreferences')}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {t('manageHowYouGetNotified')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'var(--color-background)',
                    borderRadius: '12px'
                  }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{t('loginAlerts')}</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('loginAlertsDesc')}</p>
                    </div>
                    <div 
                      onClick={() => setLoginAlerts(!loginAlerts)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: loginAlerts ? '#2463eb' : 'var(--color-border-dark)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-surface)',
                        position: 'absolute',
                        top: '2px',
                        left: loginAlerts ? '22px' : '2px',
                        transition: 'all 0.2s'
                      }} />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#2463eb',
                      color: 'white',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {saving ? t('loading') : t('savePreferences')}
                  </button>
                </div>
              </section>
            </div>

            {/* Right Column - Security */}
            <div>
              <section style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                height: 'fit-content'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <div style={{
                    padding: '8px',
                    background: 'var(--color-background-secondary)',
                    borderRadius: '12px',
                    color: '#ef4444'
                  }}>
                    <Lock size={24} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'var(--color-text-primary)',
                      marginBottom: '2px'
                    }}>
                      {t('security')}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {t('updateYourPassword')}
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  {/* Current Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-muted)',
                      marginBottom: '6px'
                    }}>
                      {t('currentPassword')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        style={{
                          width: '100%',
                          background: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '12px',
                          padding: '10px 40px 10px 16px',
                          fontSize: '14px',
                          color: 'var(--color-text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#2463eb';
                          e.target.style.boxShadow = '0 0 0 3px rgba(36, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-border)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-muted)',
                      marginBottom: '6px'
                    }}>
                      {t('newPassword')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          background: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '12px',
                          padding: '10px 40px 10px 16px',
                          fontSize: '14px',
                          color: 'var(--color-text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#2463eb';
                          e.target.style.boxShadow = '0 0 0 3px rgba(36, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-border)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Strength Meter */}
                    {passwordData.newPassword && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '10px',
                          color: '#94a3b8',
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}>
                          <span>{t('strength')}</span>
                          <span style={{ color: strength.color }}>{strength.text}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          height: '6px'
                        }}>
                          <div style={{
                            flex: 1,
                            background: strength.level >= 1 ? strength.color : 'var(--color-border)',
                            borderRadius: '999px',
                            transition: 'background 0.3s'
                          }}></div>
                          <div style={{
                            flex: 1,
                            background: strength.level >= 2 ? strength.color : 'var(--color-border)',
                            borderRadius: '999px',
                            transition: 'background 0.3s'
                          }}></div>
                          <div style={{
                            flex: 1,
                            background: strength.level >= 3 ? strength.color : 'var(--color-border)',
                            borderRadius: '999px',
                            transition: 'background 0.3s'
                          }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-muted)',
                      marginBottom: '6px'
                    }}>
                      {t('confirmPassword')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          background: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '12px',
                          padding: '10px 16px',
                          fontSize: '14px',
                          color: 'var(--color-text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#2463eb';
                          e.target.style.boxShadow = '0 0 0 3px rgba(36, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-border)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: '#2463eb',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '8px',
                      boxShadow: '0 4px 12px rgba(36, 99, 235, 0.3)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1e40af';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#2463eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>{t('saveChanges')}</span>
                    <ArrowRight size={18} />
                  </button>
                </form>
              </section>

              {/* Theme Settings */}
              <section style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                height: 'fit-content',
                marginTop: '32px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <div style={{
                    padding: '8px',
                    background: 'var(--color-background-secondary)',
                    borderRadius: '12px',
                    color: 'var(--color-text-primary)'
                  }}>
                    {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'var(--color-text-primary)',
                      marginBottom: '2px'
                    }}>
                      {t('theme')}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {t('themeDesc')}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--color-background)',
                  borderRadius: '12px'
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      {theme === 'dark' ? t('darkTheme') : t('lightTheme')}
                    </p>
                  </div>
                  <div 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border-dark)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-surface)',
                      position: 'absolute',
                      top: '2px',
                      left: theme === 'dark' ? '22px' : '2px',
                      transition: 'all 0.2s'
                    }} />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </>
  );
};

export default Settings;

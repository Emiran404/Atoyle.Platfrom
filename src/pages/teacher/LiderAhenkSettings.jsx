import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Terminal, 
  Save, 
  RefreshCcw, 
  ShieldCheck, 
  AlertTriangle, 
  Network, 
  Server, 
  Key, 
  Search,
  CheckCircle2,
  Info as InfoIcon,
  Users,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';
import { TeacherLayout } from '../../components/layouts';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui';
import { liderAhenkApi } from '../../services/api';

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '32px'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    marginTop: '8px'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px'
  },
  cardHeader: {
    padding: '24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafbfc'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  cardContent: {
    padding: '24px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none',
    backgroundColor: '#fff'
  },
  helperText: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '6px'
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  switchLabel: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b'
  },
  switchToggle: (enabled) => ({
    width: '48px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: enabled ? '#10b981' : '#cbd5e1',
    position: 'relative',
    transition: 'all 0.3s'
  }),
  switchCircle: (enabled) => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    position: 'absolute',
    top: '2px',
    left: enabled ? '26px' : '2px',
    transition: 'all 0.3s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  }),
  alert: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '14px'
  },
  infoAlert: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  }
};

const LiderAhenkSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    url: 'ldap://localhost:389',
    baseDN: 'dc=liderahenk,dc=org',
    bindDN: 'cn=admin,dc=liderahenk,dc=org',
    bindPassword: '',
    userDNPattern: 'uid={{username}},ou=users,dc=liderahenk,dc=org',
    searchFilter: '(uid={{username}})',
    syncInterval: 0
  });

  const [ldapUsers, setLdapUsers] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedLocalUsers, setSelectedLocalUsers] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLocalUsers, setLoadingLocalUsers] = useState(false);
  const [targetRole, setTargetRole] = useState('student'); // 'student' or 'teacher'
  const [activeTab, setActiveTab] = useState('import'); // 'import' or 'export'

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await liderAhenkApi.getSettings();
      if (!res) return;
      if (res.success) {
        setSettings(res.settings);
      } else {
        toast.error(res.error || 'Ayarlar yüklenemedi.');
      }
    } catch (error) {
      toast.error('Ayarlar yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await liderAhenkApi.saveSettings(settings);
      if (!res) return;
      if (res.success) {
        toast.success('LiderAhenk ayarları güncellendi.');
      } else {
        toast.error(res.error || 'Ayarlar kaydedilemedi.');
      }
    } catch (error) {
      toast.error(error.message || 'Ayarlar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const res = await liderAhenkApi.testConnection(settings);
      if (!res) return;
      if (res.success) {
        toast.success('LiderAhenk sunucusu ile iletişim kuruldu.');
      } else {
        toast.error(res.error || 'LDAP sunucusuna erişilemedi.');
      }
    } catch (error) {
      toast.error(error.message || 'LDAP sunucusuna erişilemedi.');
    } finally {
      setTesting(false);
    }
  };

  const fetchLDAPUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await liderAhenkApi.getUsers();
      if (res && res.success) {
        setLdapUsers(res.users);
        toast.success(`LDAP'ta ${res.users.length} kullanıcı bulundu.`);
      } else {
        toast.error(res?.error || 'Kullanıcılar listelenemedi.');
      }
    } catch (error) {
      toast.error('LDAP listeleme hatası: ' + error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLocalUsers = async () => {
    try {
      setLoadingLocalUsers(true);
      const res = await liderAhenkApi.getLocalUsers();
      if (res && res.success) {
        setLocalUsers(res.users);
        toast.success(`Platformda ${res.users.length} kayıtlı kullanıcı bulundu.`);
      } else {
        toast.error(res?.error || 'Yerel kullanıcılar listelenemedi.');
      }
    } catch (error) {
      toast.error('Platform listeleme hatası: ' + error.message);
    } finally {
      setLoadingLocalUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'import' && settings.enabled) fetchLDAPUsers();
    if (activeTab === 'export' && settings.enabled) fetchLocalUsers();
  }, [activeTab]);

  const handleSync = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('Lütfen içe aktarılacak kullanıcıları seçin.');
      return;
    }

    try {
      setSyncing(true);
      const usersToSync = ldapUsers.filter(u => selectedUsers.includes(u.uid));
      const res = await liderAhenkApi.syncUsers(usersToSync, targetRole);
      
      if (res && res.success) {
        toast.success(res.message);
        setSelectedUsers([]);
        fetchLDAPUsers(); // Yenile
      } else {
        toast.error(res?.error || 'İçe aktarım başarısız.');
      }
    } catch (error) {
      toast.error('İçe aktarım hatası: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    if (selectedLocalUsers.length === 0) {
      toast.warning('Lütfen dışa aktarılacak kullanıcıları seçin.');
      return;
    }

    try {
      setSyncing(true);
      const usersToExport = localUsers.filter(u => selectedLocalUsers.includes(u.uid));
      const res = await liderAhenkApi.exportUsers(usersToExport);
      
      if (res && res.success) {
        toast.success(res.message);
        setSelectedLocalUsers([]);
        fetchLocalUsers(); // Yenile
      } else {
        toast.error(res?.error || 'Dışa aktarım başarısız.');
      }
    } catch (error) {
      toast.error('Dışa aktarım hatası: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const toggleUserSelection = (uid) => {
    setSelectedUsers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const toggleLocalUserSelection = (uid) => {
    setSelectedLocalUsers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const toggleSelectAll = () => {
    const availableUsers = ldapUsers.filter(u => u.syncStatus === 'not_synced');
    if (selectedUsers.length === availableUsers.length && availableUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(availableUsers.map(u => u.uid));
    }
  };

  const toggleSelectAllLocal = () => {
    if (selectedLocalUsers.length === localUsers.length && localUsers.length > 0) {
      setSelectedLocalUsers([]);
    } else {
      setSelectedLocalUsers(localUsers.map(u => u.uid));
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCcw className="animate-spin text-blue-500" size={32} />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <Shield className="text-blue-600" size={32} />
            LiderAhenk SSO Entegrasyonu
          </h1>
          <p style={styles.subtitle}>
            Merkezi kimlik doğrulama sistemini yapılandırarak kullanıcılarınızın LiderAhenk hesaplarıyla giriş yapmasını sağlayın.
          </p>
        </div>

        {/* Master Switch */}
        <div 
          style={{
            ...styles.switchContainer,
            borderColor: settings.enabled ? '#10b981' : '#e2e8f0',
            backgroundColor: settings.enabled ? '#f0fdf4' : '#f8fafc',
            marginBottom: '32px'
          }}
          onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
        >
          <div style={styles.switchLabel}>
            LiderAhenk Kimlik Doğrulama Servisi
            <p style={{ fontWeight: '400', fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              {settings.enabled ? 'Aktif - Kullanıcılar LDAP üzerinden giriş yapabilir.' : 'Devre Dışı - Sadece yerel hesaplar kullanılabilir.'}
            </p>
          </div>
          <div style={styles.switchToggle(settings.enabled)}>
            <div style={styles.switchCircle(settings.enabled)} />
          </div>
        </div>

        {settings.enabled && (
          <div style={{ ...styles.alert, ...styles.infoAlert }}>
            <InfoIcon size={20} />
            <div>
              <strong>Bilgi:</strong> LDAP entegrasyonu aktifken, sistem kullanıcıyı önce yerel veritabanında, 
              bulamazsa veya şifre yanlışsa LDAP sunucusunda doğrular.
            </div>
          </div>
        )}

        <div style={styles.grid}>
          {/* Connection Settings */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <Server size={20} className="text-blue-500" />
                Sunucu Bağlantısı
              </div>
              {settings.enabled && (
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>HAZIR</span>
              )}
            </div>
            <div style={styles.cardContent}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Sunucu URL</label>
                <input 
                  type="text" 
                  placeholder="ldap://192.168.1.5:389"
                  style={styles.input}
                  value={settings.url}
                  onChange={(e) => setSettings({ ...settings, url: e.target.value })}
                />
                <p style={styles.helperText}>Lider sunucusunun LDAP protokolü adresi.</p>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Bind DN (Yönetici)</label>
                <input 
                  type="text" 
                  placeholder="cn=admin,dc=liderahenk,dc=org"
                  style={styles.input}
                  value={settings.bindDN}
                  onChange={(e) => setSettings({ ...settings, bindDN: e.target.value })}
                />
                <p style={styles.helperText}>Sistem aramaları için yetkili kullanıcı DN'i.</p>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Bind Şifresi</label>
                <input 
                  type="password" 
                  placeholder="********"
                  style={styles.input}
                  value={settings.bindPassword}
                  onChange={(e) => setSettings({ ...settings, bindPassword: e.target.value })}
                />
              </div>

              <Button 
                variant="secondary" 
                className="w-full"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? <RefreshCcw className="animate-spin mr-2" size={16} /> : <Terminal className="mr-2" size={16} />}
                Bağlantıyı Test Et
              </Button>
            </div>
          </div>

          {/* Directory Settings */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <Network size={20} className="text-purple-500" />
                Dizin Yapılandırması
              </div>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Base DN</label>
                <input 
                  type="text" 
                  placeholder="dc=liderahenk,dc=org"
                  style={styles.input}
                  value={settings.baseDN}
                  onChange={(e) => setSettings({ ...settings, baseDN: e.target.value })}
                />
                <p style={styles.helperText}>Aramaların başlayacağı kök dizin.</p>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>User DN Şablonu</label>
                <input 
                  type="text" 
                  placeholder="uid={{username}},ou=users,dc=liderahenk..."
                  style={styles.input}
                  value={settings.userDNPattern}
                  onChange={(e) => setSettings({ ...settings, userDNPattern: e.target.value })}
                />
                <p style={styles.helperText}>{`{{username}}`} alanı dinamik olarak dolar.</p>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Arama Filtresi</label>
                <input 
                  type="text" 
                  placeholder="(uid={{username}})"
                  style={styles.input}
                  value={settings.searchFilter}
                  onChange={(e) => setSettings({ ...settings, searchFilter: e.target.value })}
                />
                <p style={styles.helperText}>Kullanıcı sorgulama filtresi.</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button 
            variant="ghost" 
            onClick={fetchSettings}
          >
            Sıfırla
          </Button>
          <Button 
            variant="primary" 
            size="lg"
            className="px-8"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <RefreshCcw className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
            Ayarları Uygula
          </Button>
        </div>

        {/* Synchronization Section */}
        {settings.enabled && (
          <div style={{ marginTop: '48px' }}>
            <div style={{ ...styles.header, marginBottom: '24px' }}>
              <h2 style={{ ...styles.title, fontSize: '22px' }}>
                <ArrowRightLeft size={24} className="text-blue-600" />
                Çift Yönlü Senkronizasyon Merkezi
              </h2>
              <p style={styles.subtitle}>
                LiderAhenk ve Platform arasındaki kullanıcı veri akışını yönetin.
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setActiveTab('import')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: activeTab === 'import' ? '#fff' : 'transparent',
                  border: activeTab === 'import' ? '1px solid #e2e8f0' : '1px solid transparent',
                  borderBottom: activeTab === 'import' ? '1px solid #fff' : '1px solid transparent',
                  marginBottom: '-1px',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: '600',
                  color: activeTab === 'import' ? '#2563eb' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <DownloadCloud size={18} />
                LDAP'tan İçe Aktar
              </button>
              <button
                onClick={() => setActiveTab('export')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: activeTab === 'export' ? '#fff' : 'transparent',
                  border: activeTab === 'export' ? '1px solid #e2e8f0' : '1px solid transparent',
                  borderBottom: activeTab === 'export' ? '1px solid #fff' : '1px solid transparent',
                  marginBottom: '-1px',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: '600',
                  color: activeTab === 'export' ? '#059669' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <UploadCloud size={18} />
                LiderAhenk'e Gönder (Dışa Aktar)
              </button>
            </div>

            {/* IMPORT TAB */}
            {activeTab === 'import' && (
              <div style={styles.card}>
                <div style={{ ...styles.cardHeader, padding: '20px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={styles.cardTitle}>
                    <Search size={18} className="text-slate-500" />
                    LiderAhenk Kullanıcıları ({ldapUsers.length})
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchLDAPUsers} disabled={loadingUsers}>
                    {loadingUsers ? <RefreshCcw className="animate-spin mr-2" size={14} /> : <RefreshCcw className="mr-2" size={14} />}
                    Listeyi Yenile
                  </Button>
                </div>

                <div style={{ ...styles.cardContent, padding: 0 }}>
                  {ldapUsers.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                          <tr>
                            <th style={{ padding: '12px 24px', width: '40px' }}>
                              <input 
                                type="checkbox" 
                                checked={
                                  ldapUsers.filter(u => u.syncStatus === 'not_synced').length > 0 && 
                                  selectedUsers.length === ldapUsers.filter(u => u.syncStatus === 'not_synced').length
                                }
                                onChange={toggleSelectAll}
                                disabled={ldapUsers.filter(u => u.syncStatus === 'not_synced').length === 0}
                              />
                            </th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Kullanıcı Adı / UID</th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Ad Soyad</th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>E-posta</th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Sınıf / Birim</th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ldapUsers.map((user) => {
                            const isSynced = user.syncStatus !== 'not_synced';
                            return (
                              <tr key={user.uid} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: selectedUsers.includes(user.uid) ? '#f0f9ff' : 'transparent', opacity: isSynced ? 0.6 : 1 }}>
                                <td style={{ padding: '12px 24px' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedUsers.includes(user.uid)}
                                    onChange={() => toggleUserSelection(user.uid)}
                                    disabled={isSynced}
                                  />
                                </td>
                                <td style={{ padding: '12px 24px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{user.uid}</td>
                                <td style={{ padding: '12px 24px', fontSize: '14px', color: '#475569' }}>{user.fullName}</td>
                                <td style={{ padding: '12px 24px', fontSize: '14px', color: '#64748b' }}>{user.email || '-'}</td>
                                <td style={{ padding: '12px 24px', fontSize: '14px', color: '#64748b' }}>{user.ou || '-'}</td>
                                <td style={{ padding: '12px 24px', fontSize: '14px' }}>
                                  {isSynced ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                                      <CheckCircle2 size={14} />
                                      {user.syncStatus === 'student' ? 'Öğrenci' : 'Öğretmen'}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Platformda Yok</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                      <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                      <p>Arama motoru LiderAhenk sunucusunda kullanıcı bulamadı.</p>
                    </div>
                  )}
                </div>

                {ldapUsers.length > 0 && (
                  <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Hedef Rol:</label>
                      <select 
                        value={targetRole} 
                        onChange={(e) => setTargetRole(e.target.value)}
                        style={{ ...styles.input, width: '160px', padding: '6px 12px' }}
                      >
                        <option value="student">Öğrenci Ekle</option>
                        <option value="teacher">Öğretmen Ekle</option>
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        {selectedUsers.length} kullanıcı seçildi
                      </span>
                      <Button 
                        variant="primary" 
                        onClick={handleSync}
                        disabled={syncing || selectedUsers.length === 0}
                      >
                        {syncing ? <RefreshCcw className="animate-spin mr-2" size={16} /> : <DownloadCloud className="mr-2" size={16} />}
                        Platforma İçe Aktar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EXPORT TAB */}
            {activeTab === 'export' && (
              <div style={styles.card}>
                <div style={{ ...styles.cardHeader, padding: '20px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={styles.cardTitle}>
                    <Users size={18} className="text-slate-500" />
                    Platform Kullanıcıları ({localUsers.length})
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchLocalUsers} disabled={loadingLocalUsers}>
                    {loadingLocalUsers ? <RefreshCcw className="animate-spin mr-2" size={14} /> : <RefreshCcw className="mr-2" size={14} />}
                    Listeyi Yenile
                  </Button>
                </div>

                <div style={{ ...styles.cardContent, padding: 0 }}>
                  {localUsers.length > 0 ? (
                    <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ padding: '12px 24px', width: '40px' }}>
                              <input 
                                type="checkbox" 
                                checked={
                                  localUsers.length > 0 && 
                                  selectedLocalUsers.length === localUsers.length
                                }
                                onChange={toggleSelectAllLocal}
                                disabled={localUsers.length === 0}
                              />
                            </th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Kullanıcı Adı / No</th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Ad Soyad</th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Sistem Rolü</th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Sınıf / Birim</th>
                            <th style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>LDAP Durumu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {localUsers.map((user) => {
                            const isSynced = user.syncStatus !== 'not_synced';
                            return (
                              <tr key={user.uid} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: selectedLocalUsers.includes(user.uid) ? '#ecfdf5' : 'transparent', opacity: isSynced ? 0.8 : 1 }}>
                                <td style={{ padding: '12px 24px' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedLocalUsers.includes(user.uid)}
                                    onChange={() => toggleLocalUserSelection(user.uid)}
                                  />
                                </td>
                                <td style={{ padding: '12px 24px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{user.uid}</td>
                                <td style={{ padding: '12px 24px', fontSize: '14px', color: '#475569' }}>{user.fullName}</td>
                                <td style={{ padding: '12px 24px', fontSize: '14px', color: '#64748b' }}>{user.role}</td>
                                <td style={{ padding: '12px 24px', fontSize: '14px', color: '#64748b' }}>{user.orgUnit || '-'}</td>
                                <td style={{ padding: '12px 24px', fontSize: '14px' }}>
                                  {isSynced ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#e2e8f0', color: '#334155', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                                      <RefreshCcw size={14} />
                                      LDAP'ta Kayıtlı (Güncelle)
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      Henüz Gönderilmedi
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                      <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                      <p>Platformda kayıtlı kullanıcı bulunamadı.</p>
                    </div>
                  )}
                </div>

                {localUsers.length > 0 && (
                  <div style={{ padding: '24px', backgroundColor: '#ecfdf5', borderTop: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#065f46' }}>
                      <InfoIcon size={18} />
                      <span style={{ fontSize: '14px' }}>Seçilen platform kullanıcıları otomatik olarak LDAP dizinine <strong>inetOrgPerson</strong> sınıfıyla eklenir.</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#065f46' }}>
                        {selectedLocalUsers.length} kullanıcı seçildi
                      </span>
                      <Button 
                        variant="primary" 
                        onClick={handleExport}
                        disabled={syncing || selectedLocalUsers.length === 0}
                      >
                        {syncing ? <RefreshCcw className="animate-spin mr-2" size={16} /> : <UploadCloud className="mr-2" size={16} />}
                        LiderAhenk'e Gönder
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default LiderAhenkSettings;

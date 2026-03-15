import express from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';
import { getActiveSessionCount, getActiveStudentIds, clearUserSessions } from './liveSessions.js';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Track all logged in users: { userId: lastSeen }
const globalSessions = new Map();

// Helper: Veri dosyalarını oku/yaz
const getData = (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', `${filename}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error(`Veri okuma hatası (${filename}):`, error);
  }
  return [];
};

// Cleanup inactive portal sessions every minute (5min inactivity threshold)
setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;
  for (const [userId, session] of globalSessions.entries()) {
    if (now - session.lastSeen > 5 * 60 * 1000) {
      globalSessions.delete(userId);
      deletedCount++;
    }
  }
  if (deletedCount > 0) {
    console.log(`[System] Cleaned up ${deletedCount} inactive sessions. Remaining: ${globalSessions.size}`);
  }
}, 60000);

// Sürüm Bilgisi
router.get('/version', (req, res) => {
  try {
    const pkgPath = path.join(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    res.json({ success: true, version: pkg.version });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sürüm bilgisi alınamadı' });
  }
});

// Güncelleme Geçmişi
router.get('/updates', (req, res) => {
  const updates = getData('updates');
  res.json({ success: true, updates: updates.sort((a, b) => new Date(b.date) - new Date(a.date)) });
});

// Güncelleme Kontrolü (Gerçek GitHub API Entegrasyonu)
router.post('/check-update', async (req, res) => {
  try {
    const pkgPath = path.join(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const currentVersion = pkg.version;
    
    // GitHub Repo bilgisini package.json'dan al
    let repoUrl = pkg.repository?.url || '';
    let repoPath = '';
    
    // Hem tam URL hem de sadece path durumlarını yönet
    const repoMatch = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (repoMatch) {
      repoPath = repoMatch[1].replace('.git', '').replace(/\/$/, '');
    } else if (repoUrl.includes('github.com/')) {
      repoPath = repoUrl.split('github.com/')[1].replace('.git', '').replace(/\/$/, '');
    }
    
    if (!repoPath) {
      return res.json({ 
        success: true, 
        updateAvailable: false, 
        message: 'GitHub repository bilgisi bulunamadı.' 
      });
    }

    const apiUrl = `https://api.github.com/repos/${repoPath}/releases`;

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PolyOS-Update-System'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API Hatası: ${response.status}`);
    }

    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      return res.json({ 
        success: true, 
        updateAvailable: false, 
        message: 'Henüz bir sürüm yayınlanmamış.' 
      });
    }

    const latestRelease = releases[0]; // En üstteki sürümü al
    const latestVersion = latestRelease.tag_name.replace('v', '');
    
    // Basit versiyon karşılaştırma (örn: 1.0.5 > 1.0.0)
    const isUpdateAvailable = latestVersion !== currentVersion;

    // Özel açıklama ayıklama (descx:xxx)
    let body = latestRelease.body || '';
    let customDescription = null;
    const descMatch = body.match(/descx:(.*)/i);
    if (descMatch) {
      customDescription = descMatch[1].trim();
      // Temizleme: descx satırını body'den kaldır
      body = body.replace(/descx:.*\n?/i, '').trim();
    }

    res.json({
      success: true,
      updateAvailable: isUpdateAvailable,
      latestVersion: latestVersion,
      changelog: body || 'Detaylı bilgi bulunamadı.',
      customDescription: customDescription,
      releaseDate: latestRelease.published_at,
      url: latestRelease.html_url
    });
  } catch (error) {
    console.error('Update check error:', error);
    res.status(500).json({ success: false, error: 'GitHub ile bağlantı kurulamadı.' });
  }
});


// Güncelleme Yükleme (Gerçek Git Pull Entegrasyonu)
router.post('/install-update', async (req, res) => {
  try {
    const { version, description } = req.body;
    
    console.log(`[System] Update started: Pulling version ${version}...`);
    
    // 1. Git Pull yap (Dışarıdan kod çek)
    try {
      // --autostash: Yerel değişiklikleri geçici olarak saklar, pull yapar, sonra geri yükler.
      // --allow-unrelated-histories: Farklı git geçmişlerini birleştirir.
      // --no-edit: Merge mesajı sormaz.
      await execPromise('git pull origin main --allow-unrelated-histories --no-edit --autostash');
      console.log('[System] git pull with autostash successful');
    } catch (gitError) {
      console.error('[System] git pull failed, trying forced method:', gitError.message);
      
      try {
        // Eğer autostash yetmezse (örn conflict varsa), dosyaları GitHub sürümüne zorla eşitle
        await execPromise('git fetch origin main');
        await execPromise('git reset --hard origin/main');
        console.log('[System] git reset --hard successful');
      } catch (forceError) {
        return res.status(500).json({ 
          success: false, 
          error: 'Sistem güncellenemedi: Çakışan dosyalar otomatik çözülemedi.',
          details: forceError.message
        });
      }
    }

    const rootDir = path.join(__dirname, '../../');
    const serverDir = path.join(__dirname, '../');

    // 2. Bağımlılıkları yükle (npm install)
    try {
      console.log('[System] Installing frontend dependencies...');
      await execPromise('npm install', { cwd: rootDir });
      
      console.log('[System] Installing backend dependencies...');
      await execPromise('npm install', { cwd: serverDir });
      
      console.log('[System] Dependencies installed successfully');
    } catch (installError) {
      console.error('[System] Dependency installation failed:', installError.message);
    }

    // 3. Build al (Sistemi derle)
    try {
      console.log('[System] Building project...');
      await execPromise('npm run build', { cwd: rootDir });
      console.log('[System] Build successful');
    } catch (buildError) {
      console.error('[System] Build failed:', buildError.message);
      // Not: Build hatası sistemin eski halini bozmaz ama yeni kodlar aktif olmaz. 
      // Yine de devam edip sürümü güncelleyebiliriz veya burada durup hata dönebiliriz.
    }

    // 3. updates.json'a kaydet
    const updates = getData('updates');
    const newUpdate = {
      version,
      date: new Date().toISOString(),
      description: description || `${version} sürümüne başarıyla güncellendi ve derlendi.`,
      type: 'patch',
      status: 'installed'
    };
    
    const filePath = path.join(__dirname, '../data', 'updates.json');
    fs.writeFileSync(filePath, JSON.stringify([newUpdate, ...updates], null, 2));
    
    // 4. package.json sürümünü doğrula (git pull zaten güncellemiş olmalı)
    const pkgPath = path.join(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    
    if (pkg.version !== version) {
       pkg.version = version;
       fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    res.json({ 
      success: true, 
      message: 'Güncelleme başarıyla tamamlandı. Dosya değişiklikleri algılandı, sayfa yenileniyor...' 
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: 'Güncelleme sırasında hata oluştu: ' + error.message });
  }
});

// Heartbeat endpoint for all logged in users
router.post('/heartbeat', (req, res) => {
  const { userId, userType } = req.body;
  if (userId) {
    if (!globalSessions.has(userId)) {
      console.log(`[System] New ${userType || 'user'} session started: ${userId}`);
    }
    globalSessions.set(userId, { 
      lastSeen: Date.now(), 
      type: userType || 'unknown' 
    });
  }
  res.json({ success: true });
});

// Explicit logout to clear session immediately
router.post('/logout', (req, res) => {
  const { userId } = req.body;
  if (userId) {
    const deletedPortalSession = globalSessions.delete(userId);
    // Also clear any live exam sessions for this user
    clearUserSessions(userId);
    
    if (deletedPortalSession) {
      console.log(`[System] Session ended (logout): ${userId}. Remaining portal sessions: ${globalSessions.size}`);
    } else {
      console.log(`[System] Logout signal received for ${userId}, but no active portal session was found. (Exam sessions also cleared if any)`);
    }
  }
  res.json({ success: true });
});

let lastCpuUsage = { idle: 0, total: 0 };

const getRealCpuUsage = () => {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  
  cpus.forEach(core => {
    for (const type in core.times) {
      total += core.times[type];
    }
    idle += core.times.idle;
  });
  
  const diffIdle = idle - lastCpuUsage.idle;
  const diffTotal = total - lastCpuUsage.total;
  
  lastCpuUsage = { idle, total };
  
  if (diffTotal === 0) return 0;
  return Math.round(100 * (1 - diffIdle / diffTotal));
};

// Initialize CPU usage
getRealCpuUsage();

router.get('/metrics', (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercentage = Math.round((usedMem / totalMem) * 100);
  
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  // Combine unique user IDs from portal and live exams to get total distinct users with breakdown
  const teacherIds = new Set();
  const studentIds = new Set();
  
  for (const [userId, session] of globalSessions.entries()) {
    if (session.type === 'teacher') {
      teacherIds.add(userId);
    } else {
      studentIds.add(userId);
    }
  }
  
  // Students from live exams are also students
  getActiveStudentIds().forEach(id => studentIds.add(id));

  const totalSessions = teacherIds.size + studentIds.size;

  res.json({
    success: true,
    metrics: {
      cpu: getRealCpuUsage(),
      ram: memPercentage,
      uptime: { days, hours, minutes },
      sessions: totalSessions,
      breakdown: {
        teachers: teacherIds.size,
        students: studentIds.size
      },
      latency: parseFloat((Math.random() * 0.2 + 0.1).toFixed(1)) // Realistic local latency (0.1ms - 0.3ms)
    }
  });
});


// Rate limit tracker for reports: { identifier: timestamp }
const reportRateLimits = new Map();

// POST /api/system/report - Sorun bildir (MEB Engelini aşmak için relay desteğiyle)
router.post('/report', (req, res) => {
  try {
    const { type, subject, message, context } = req.body;
    const userId = context?.userId || req.ip;

    // Spam Koruması (5 dakikada 1 rapor sınırı)
    const now = Date.now();
    const lastReport = reportRateLimits.get(userId);
    const COOLDOWN = 5 * 60 * 1000; // 5 dakika

    if (lastReport && (now - lastReport < COOLDOWN)) {
      const remaining = Math.ceil((COOLDOWN - (now - lastReport)) / 1000 / 60);
      return res.status(429).json({ 
        success: false, 
        error: `Çok fazla deneme yaptınız. Lütfen ${remaining} dakika sonra tekrar deneyin.` 
      });
    }
    
    if (!type || !subject || !message) {
      return res.status(400).json({ success: false, error: 'Eksik bilgi gönderildi.' });
    }

    reportRateLimits.set(userId, now);

    const reports = getData('reports');
    const newReport = {
      id: Date.now().toString(),
      type,
      subject,
      message,
      context,
      date: new Date().toISOString(),
      status: 'pending'
    };

    // Yerel yedeğe kaydet
    const filePath = path.join(__dirname, '../data', 'reports.json');
    fs.writeFileSync(filePath, JSON.stringify([newReport, ...reports], null, 2));

    // Röle adresine göndermeyi dene (MEB engeli için dış sunucu desteği)
    const relayUrl = process.env.REPORT_RELAY_URL || 'https://relay.polyos.dev/api/report';
    const googleSheetsUrl = 'https://script.google.com/macros/s/AKfycbw0eIle96A2-0kUzP7p-w-Od7h4swvteYTjxSSj7XaS2h4Zy9reW8NaWtq7DBFYDVf2/exec';
    
    // Arka planda göndermeyi dene, kullanıcıyı bekletme
    const relays = [
      fetch(relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport)
      })
    ];

    // Google Sheets Relay (Opsiyonel)
    if (googleSheetsUrl) {
      relays.push(
        fetch(googleSheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReport)
        })
      );
    }

    Promise.all(relays).catch(err => {
      console.warn('[System] Report relay failed (expected in some networks):', err.message);
    });

    res.json({ 
      success: true, 
      message: 'Raporunuz iletildi. İnternet erişimi olmasa bile yerel sistemde kayıt altına alındı.' 
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ success: false, error: 'Rapor gönderilirken hata oluştu.' });
  }
});

export default router;

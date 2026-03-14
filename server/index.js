/**
 * Sınav Gönderme Platformu - Backend Server
 * 
 * Copyright (c) 2026-2027 Emirhan Gök (@Emiran404)
 * Alanya Mesleki ve Teknik Anadolu Lisesi
 * 
 * Licensed under the MIT License
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import http from 'http';
import os from 'os';

// Routes
import authRoutes from './routes/auth.js';
import examRoutes from './routes/exams.js';
import submissionRoutes from './routes/submissions.js';
import uploadRoutes from './routes/uploads.js';
import notificationRoutes from './routes/notifications.js';
import scheduleRoutes from './routes/schedules.js';
import fileManagerRoutes from './routes/fileManager.js';
import settingsRoutes from './routes/settings.js';
import usersRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import backupRoutes from './routes/backup.js';
import liveSessionsRoutes from './routes/liveSessions.js';
import systemRoutes from './routes/system.js';
import { startNotificationWorker } from './workers/notificationWorker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Uploads klasörü için static serve
const uploadsPath = join(__dirname, '../src/uploads_student');

// uploads klasörünü oluştur
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Static file serving with proper URL decoding for Turkish characters
app.use('/uploads', (req, res, next) => {
  try {
    // URL decode the path to handle Turkish characters and spaces
    const decodedPath = decodeURIComponent(req.path);
    const filePath = join(uploadsPath, decodedPath);

    // Check if file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }

    // If not found, let next middleware handle it
    next();
  } catch (error) {
    console.error('Static file error:', error);
    next();
  }
});

// Fallback to express.static for non-problematic files
app.use('/uploads', express.static(uploadsPath));

console.log('📁 Uploads dizini:', uploadsPath);

// Data klasörü oluştur
const dataPath = join(__dirname, 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Veri dosyalarını başlat (yoksa boş array ile oluştur)
const initializeDataFiles = () => {
  const dataFiles = [
    'students.json',
    'teachers.json',
    'exams.json',
    'submissions.json',
    'notifications.json',
    'schedules.json'
  ];

  dataFiles.forEach(file => {
    const filePath = join(dataPath, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
      console.log(`📄 ${file} oluşturuldu`);
    }
  });
};

initializeDataFiles();

// Bildirim servisini baslat
startNotificationWorker();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/file-manager', fileManagerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/live-sessions', liveSessionsRoutes);
app.use('/api/system', systemRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Reset all data endpoint
app.post('/api/reset-all-data', (req, res) => {
  try {
    const dataFiles = [
      'students.json',
      'teachers.json',
      'exams.json',
      'submissions.json',
      'notifications.json',
      'schedules.json'
    ];

    // Tüm data dosyalarını boş array ile yeniden oluştur
    dataFiles.forEach(file => {
      const filePath = join(dataPath, file);
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
    });

    // ayarları da sıfırla
    const defaultSettings = {
      registrationEnabled: true,
      teacherRegistrationEnabled: true,
      allowedClasses: [
        '9-A', '9-B', '9-C', '9-D', '9-E', '9-F',
        '10-A', '10-B', '10-C', '10-D', '10-E', '10-F',
        '11-A', '11-B', '11-C', '11-D', '11-E', '11-F',
        '12-A', '12-B', '12-C', '12-D', '12-E', '12-F'
      ]
    };
    const settingsPath = join(dataPath, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf-8');

    // uploads klasörlerini temizle - Klasörü silmek yerine içini boşalt (EBUSY hatasını önlemek için)
    const emptyDir = (dirPath) => {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const curPath = join(dirPath, file);
          try {
            if (fs.lstatSync(curPath).isDirectory()) {
              fs.rmSync(curPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(curPath);
            }
          } catch (e) {
            console.warn(`Silinemedi: ${curPath}`, e.message);
          }
        }
      }
    };

    const uploadsDir = join(__dirname, 'uploads');
    const uploadsStudentDir = join(__dirname, '../src/uploads_student');

    emptyDir(uploadsDir);
    emptyDir(uploadsStudentDir);

    console.log('✅ Tüm veriler sıfırlandı');
    res.json({ success: true, message: 'Tüm veriler başarıyla sıfırlandı' });
  } catch (error) {
    console.error('Veri sıfırlama hatası:', error);
    res.status(500).json({ success: false, error: 'Veri sıfırlama sırasında hata oluştu' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Sunucu hatası oluştu'
  });
});

// Sunucuyu başlat
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend sunucusu http://0.0.0.0:${PORT} adresinde çalışıyor`);

  // Yerel IP'yi göster
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`🌐 Ağ IP adresi: http://${net.address}:${PORT}`);
      }
    }
  }
});

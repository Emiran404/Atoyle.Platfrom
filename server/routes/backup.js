import express from 'express';
import { getData, setData } from '../utils/storage.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Multer yapılandırması - geçici dosya yükleme
const upload = multer({ 
  dest: path.join(__dirname, '..', 'temp'),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// GET /api/backup - Tüm verileri JSON olarak döndür
router.get('/', (req, res) => {
  try {
    // Backend'deki gerçek verileri oku
    const students = getData('students') || [];
    const teachers = getData('teachers') || [];
    const exams = getData('exams') || [];
    const submissions = getData('submissions') || [];
    const notifications = getData('notifications') || [];
    const schedules = getData('schedules') || [];

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        students,
        teachers,
        exams,
        submissions,
        notifications,
        schedules
      }
    };

    res.json({ success: true, backup: backupData });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ success: false, error: 'Yedekleme sırasında hata oluştu' });
  }
});

// GET /api/backup/with-photos - ZIP olarak tüm veriler + fotoğraflar
router.get('/with-photos', async (req, res) => {
  try {
    // Verileri al
    const students = getData('students') || [];
    const teachers = getData('teachers') || [];
    const exams = getData('exams') || [];
    const submissions = getData('submissions') || [];
    const notifications = getData('notifications') || [];
    const schedules = getData('schedules') || [];

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      includesPhotos: true,
      data: {
        students,
        teachers,
        exams,
        submissions,
        notifications,
        schedules
      }
    };

    // ZIP arşivi oluştur
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maksimum sıkıştırma
    });

    // Response headers
    const timestamp = new Date().toISOString().split('T')[0];
    res.attachment(`platform-backup-with-photos-${timestamp}.zip`);
    res.setHeader('Content-Type', 'application/zip');

    // Hata yönetimi
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ success: false, error: 'ZIP oluşturma hatası' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // JSON verisini ekle
    archive.append(JSON.stringify(backupData, null, 2), { name: 'backup.json' });

    // uploads_student klasörünü ekle (varsa)
    const uploadsStudentPath = path.join(__dirname, '..', '..', 'src', 'uploads_student');
    if (fs.existsSync(uploadsStudentPath)) {
      archive.directory(uploadsStudentPath, 'uploads_student');
    }

    // uploads klasörünü ekle (varsa)
    const uploadsPath = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsPath)) {
      archive.directory(uploadsPath, 'uploads');
    }

    // ZIP'i tamamla
    await archive.finalize();
    
    console.log('✅ ZIP yedek başarıyla oluşturuldu');
  } catch (error) {
    console.error('Backup with photos error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Yedekleme sırasında hata oluştu' });
    }
  }
});

// POST /api/backup/restore - Yedekten geri yükle
router.post('/restore', (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, error: 'Geçersiz yedek dosyası' });
    }

    // Veritabanını/dosyaları güncelle
    if (data.students) {
      setData('students', data.students);
    }
    if (data.teachers) {
      setData('teachers', data.teachers);
    }
    if (data.exams) {
      setData('exams', data.exams);
    }
    if (data.submissions) {
      setData('submissions', data.submissions);
    }
    if (data.notifications) {
      setData('notifications', data.notifications);
    }
    if (data.schedules) {
      setData('schedules', data.schedules);
    }

    res.json({ success: true, message: 'Veriler başarıyla geri yüklendi' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ success: false, error: 'Geri yükleme sırasında hata oluştu' });
  }
});

// POST /api/backup/restore-zip - ZIP dosyasından geri yükle
router.post('/restore-zip', upload.single('backup'), async (req, res) => {
  const tempDir = path.join(__dirname, '..', 'temp');
  const extractDir = path.join(tempDir, `extract-${Date.now()}`);
  
  try {
    console.log('📦 ZIP restore başladı');
    console.log('📁 Dosya bilgisi:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Dosya yüklenmedi' });
    }

    // Temp klasörünü oluştur (yoksa)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('✅ Temp klasörü oluşturuldu');
    }

    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
      console.log('✅ Extract klasörü oluşturuldu');
    }

    console.log('📂 ZIP açılıyor:', req.file.path);
    // ZIP dosyasını adm-zip ile aç - Kilitlenmeyi önlemek için buffer olarak oku
    const zipBuffer = fs.readFileSync(req.file.path);
    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(extractDir, true);
    console.log('✅ ZIP dosyası açıldı:', extractDir);

    // backup.json dosyasını oku
    const backupJsonPath = path.join(extractDir, 'backup.json');
    if (!fs.existsSync(backupJsonPath)) {
      throw new Error('backup.json bulunamadı');
    }

    const backupContent = fs.readFileSync(backupJsonPath, 'utf-8');
    const backupData = JSON.parse(backupContent);

    if (!backupData.data) {
      throw new Error('Geçersiz yedek dosyası');
    }

    // Veritabanını/dosyaları güncelle
    if (backupData.data.students) {
      setData('students', backupData.data.students);
    }
    if (backupData.data.teachers) {
      setData('teachers', backupData.data.teachers);
    }
    if (backupData.data.exams) {
      setData('exams', backupData.data.exams);
    }
    if (backupData.data.submissions) {
      setData('submissions', backupData.data.submissions);
    }
    if (backupData.data.notifications) {
      setData('notifications', backupData.data.notifications);
    }
    if (backupData.data.schedules) {
      setData('schedules', backupData.data.schedules);
    }

    // Fotoğrafları geri yükle (varsa)
    const uploadsStudentSrc = path.join(extractDir, 'uploads_student');
    const uploadsSrc = path.join(extractDir, 'uploads');
    
    const uploadsStudentDest = path.join(__dirname, '..', '..', 'src', 'uploads_student');
    const uploadsDest = path.join(__dirname, '..', 'uploads');

    // Mevcut klasörleri temizle ve yenileri kopyala
    if (fs.existsSync(uploadsStudentSrc)) {
      console.log('🔄 uploads_student kopyalanıyor...');
      if (fs.existsSync(uploadsStudentDest)) {
        await fsPromises.rm(uploadsStudentDest, { recursive: true, force: true });
        console.log('🗑️ Eski uploads_student silindi');
      }
      await fsPromises.cp(uploadsStudentSrc, uploadsStudentDest, { recursive: true });
      console.log('✅ uploads_student geri yüklendi');
    }

    if (fs.existsSync(uploadsSrc)) {
      console.log('🔄 uploads kopyalanıyor...');
      if (fs.existsSync(uploadsDest)) {
        await fsPromises.rm(uploadsDest, { recursive: true, force: true });
        console.log('🗑️ Eski uploads silindi');
      }
      await fsPromises.cp(uploadsSrc, uploadsDest, { recursive: true });
      console.log('✅ uploads geri yüklendi');
    }

    // Temizlik
    console.log('🧹 Temizlik yapılıyor...');
    await fsPromises.unlink(req.file.path); // Yüklenen ZIP dosyasını sil
    await fsPromises.rm(extractDir, { recursive: true, force: true }); // Açılan klasörü sil

    console.log('✅ ZIP yedeği başarıyla geri yüklendi');
    res.json({ success: true, message: 'Veriler ve fotoğraflar başarıyla geri yüklendi' });
  } catch (error) {
    console.error('❌ ZIP restore error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Temizlik (hata durumunda)
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        await fsPromises.unlink(req.file.path);
        console.log('🗑️ Temp ZIP silindi');
      }
      if (fs.existsSync(extractDir)) {
        await fsPromises.rm(extractDir, { recursive: true, force: true });
        console.log('🗑️ Extract klasörü silindi');
      }
    } catch (cleanupError) {
      console.error('❌ Cleanup error:', cleanupError);
    }
    
    res.status(500).json({ success: false, error: 'ZIP geri yükleme sırasında hata oluştu: ' + error.message });
  }
});

export default router;

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, '../data');

let db = null;
let useFallback = false;

// SQLite veritabanı başlatmayı dene
try {
  const { DatabaseSync } = await import('node:sqlite');
  const dbPath = join(dataPath, 'atolye.db');
  db = new DatabaseSync(dbPath);
  
  // Performans için WAL (Write-Ahead Logging) modunu aktif et
  db.exec('PRAGMA journal_mode = WAL');
  
  // Ana depolama tablosunu oluştur
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  
  console.log('💾 SQLite veritabanı aktif edildi: atolye.db');
  
  // Göç daha önce yapılmışsa kalan JSON dosyalarını temizle
  try {
    const row = db.prepare("SELECT value FROM collections WHERE key = 'settings'").get();
    if (row && row.value) {
      const settings = JSON.parse(row.value);
      if (settings.dbMigrated === true) {
        const keys = ['classes', 'exams', 'notifications', 'reports', 'schedules', 'settings', 'students', 'submissions', 'teachers', 'updates'];
        keys.forEach(key => {
          const jsonFilePath = join(dataPath, `${key}.json`);
          if (fs.existsSync(jsonFilePath)) {
            fs.unlinkSync(jsonFilePath);
            console.log(`🗑️ [Başlangıç Temizliği] Silindi: ${key}.json`);
          }
        });
      }
    }
  } catch (cleanErr) {
    // sessiz geç
  }
} catch (error) {
  console.warn('⚠️ [Veritabanı Uyarısı] SQLite native modülü yüklenemedi. JSON depolama moduna geri dönülüyor.');
  console.warn('Detay:', error.message);
  useFallback = true;
}

// JSON dosyalarından veri oku (Fallback için)
const getJsonData = (key) => {
  const filePath = join(dataPath, `${key}.json`);
  try {
    if (fs.existsSync(filePath)) {
      let data = fs.readFileSync(filePath, 'utf8');
      if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1);
      }
      return JSON.parse(data.trim());
    }
    return null;
  } catch (error) {
    console.error(`Error reading JSON ${key}:`, error);
    return null;
  }
};

// JSON dosyalarına atomik veri yaz (Sadece fallback durumunda kullanılır)
const setJsonData = (key, data) => {
  const filePath = join(dataPath, `${key}.json`);
  const tmpPath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch (error) {
    console.error(`Error writing JSON ${key}:`, error);
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
    return false;
  }
};

// Veritabanı Okuma API'si
export const getData = (key) => {
  if (useFallback || !db) {
    return getJsonData(key);
  }
  
  try {
    const row = db.prepare('SELECT value FROM collections WHERE key = ?').get(key);
    if (row && row.value) {
      return JSON.parse(row.value);
    }
    
    // Veritabanında bulunamadıysa JSON dosyasından oku
    const fallbackData = getJsonData(key);
    if (fallbackData) {
      // Veritabanını güncelle
      db.prepare('INSERT OR REPLACE INTO collections (key, value) VALUES (?, ?)')
        .run(key, JSON.stringify(fallbackData));
      return fallbackData;
    }
    return null;
  } catch (error) {
    console.error(`SQLite read error for ${key}, falling back to JSON:`, error);
    return getJsonData(key);
  }
};

// Veritabanı Yazma API'si
export const setData = (key, data) => {
  if (useFallback || !db) {
    return setJsonData(key, data);
  }
  
  try {
    db.prepare('INSERT OR REPLACE INTO collections (key, value) VALUES (?, ?)')
      .run(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`SQLite write error for ${key}, using JSON fallback:`, error);
    return setJsonData(key, data);
  }
};

// Benzersiz ID oluştur
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Veritabanı durumunu ve göç durumunu döner
export const getDbStatus = () => {
  const settings = getData('settings') || {};
  const isMigrated = settings.dbMigrated === true;
  return {
    dbType: db ? 'sqlite' : 'json',
    isMigrated
  };
};

// JSON verilerini SQLite veritabanına aktarma sihirbazı tetikleyicisi
export const runMigration = () => {
  if (!db) {
    throw new Error('SQLite sürücüsü (node:sqlite) başlatılamadı.');
  }

  const keys = ['classes', 'exams', 'notifications', 'reports', 'schedules', 'settings', 'students', 'submissions', 'teachers', 'updates'];
  let migratedAny = false;

  keys.forEach(key => {
    const jsonFilePath = join(dataPath, `${key}.json`);
    if (fs.existsSync(jsonFilePath)) {
      try {
        let fileData = fs.readFileSync(jsonFilePath, 'utf8');
        if (fileData.charCodeAt(0) === 0xFEFF) {
          fileData = fileData.slice(1);
        }
        const parsed = JSON.parse(fileData.trim());
        db.prepare('INSERT OR REPLACE INTO collections (key, value) VALUES (?, ?)')
          .run(key, JSON.stringify(parsed));
        migratedAny = true;
        
        // Göç tamamlandıktan sonra JSON dosyasını sistemden sil
        fs.unlinkSync(jsonFilePath);
        console.log(`🗑️ [Göç] Silindi: ${key}.json`);
      } catch (err) {
        console.error(`Migration error for ${key}:`, err.message);
      }
    }
  });

  // Göçün tamamlandığını settings dosyasına yaz
  const settings = getData('settings') || {};
  settings.dbMigrated = true;

  // SQLite veritabanına kaydet
  db.prepare('INSERT OR REPLACE INTO collections (key, value) VALUES (?, ?)')
    .run('settings', JSON.stringify(settings));

  console.log('✅ [Göç Sihirbazı] JSON verileri SQLite veritabanına aktarıldı ve JSON dosyaları temizlendi.');
  return true;
};

// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getData, setData } from './storage.js';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPDATES_DIR = path.join(__dirname, '../../server/updates');

export class UpdateManager {
  constructor() {
    this.intervalId = null;
    this.isChecking = false;
    
    // Klasörün var olduğundan emin ol
    if (!fs.existsSync(UPDATES_DIR)) {
      fs.mkdirSync(UPDATES_DIR, { recursive: true });
    }
  }

  getSettings() {
    return getData('settings') || {};
  }

  start() {
    // 12 saatte bir kontrol et
    this.intervalId = setInterval(() => this.checkAndDownload(), 12 * 60 * 60 * 1000);
    // İlk çalıştırmada da kontrol et
    setTimeout(() => this.checkAndDownload(), 10000); // Sunucu başladıktan 10 sn sonra
    console.log('[UpdateManager] Otomatik güncelleme yöneticisi başlatıldı.');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async fetchWithRedirects(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Redirect
          resolve(this.fetchWithRedirects(res.headers.location));
        } else if (res.statusCode === 200) {
          resolve(res);
        } else {
          reject(new Error(`Failed to fetch ${url}, status code: ${res.statusCode}`));
        }
      });
      req.on('error', reject);
    });
  }

  async downloadFile(url, destPath) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.fetchWithRedirects(url);
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async downloadUpdateFile(baseUrl, ymlFileName) {
    const tempYmlPath = path.join(UPDATES_DIR, `${ymlFileName}.temp`);
    try {
      await this.downloadFile(`${baseUrl}/${ymlFileName}`, tempYmlPath);
    } catch (err) {
      console.log(`[UpdateManager] Hedefte ${ymlFileName} bulunamadı.`);
      return false;
    }

    const localYmlPath = path.join(UPDATES_DIR, ymlFileName);
    let shouldUpdate = true;

    const newYmlContent = fs.readFileSync(tempYmlPath, 'utf8');
    
    if (fs.existsSync(localYmlPath)) {
      const localYmlContent = fs.readFileSync(localYmlPath, 'utf8');
      
      const newVersionMatch = newYmlContent.match(/version: (.*)/);
      const localVersionMatch = localYmlContent.match(/version: (.*)/);

      if (newVersionMatch && localVersionMatch && newVersionMatch[1] === localVersionMatch[1]) {
        shouldUpdate = false;
      }
    }

    if (!shouldUpdate) {
      console.log(`[UpdateManager] Sistemdeki ${ymlFileName} versiyonu zaten en günceli.`);
      fs.unlinkSync(tempYmlPath);
      return false;
    }

    const pathMatch = newYmlContent.match(/path: (.*)/);
    if (pathMatch && pathMatch[1]) {
      const fileName = pathMatch[1].trim();
      const fileUrl = `${baseUrl}/${fileName}`;
      const destFilePath = path.join(UPDATES_DIR, fileName);

      console.log(`[UpdateManager] Yeni versiyon indiriliyor: ${fileName}`);
      
      try {
        // İlk olarak yml dosyasındaki orijinal path ile dene
        await this.downloadFile(`${baseUrl}/${fileName}`, destFilePath);
      } catch (err) {
        if (err.message.includes('404')) {
          // GitHub Actions 'softprops/action-gh-release' boşlukları noktaya çevirir. 
          // Orijinalinde boşluk varsa noktalı halini dene.
          const dotFileName = fileName.replace(/ /g, '.');
          if (dotFileName !== fileName) {
            console.log(`[UpdateManager] 404 alındı, noktalı isimle deneniyor: ${dotFileName}`);
            try {
              await this.downloadFile(`${baseUrl}/${dotFileName}`, destFilePath);
            } catch (fallbackErr) {
              console.error(`[UpdateManager] Noktalı sürüm de indirilemedi: ${fallbackErr.message}`);
              fs.unlinkSync(tempYmlPath);
              return false;
            }
          } else {
            console.error(`[UpdateManager] İndirme başarısız: ${err.message}`);
            fs.unlinkSync(tempYmlPath);
            return false;
          }
        } else {
          console.error(`[UpdateManager] İndirme başarısız: ${err.message}`);
          fs.unlinkSync(tempYmlPath);
          return false;
        }
      }
      
      fs.renameSync(tempYmlPath, localYmlPath);
      
      // Eski kurulum dosyalarını temizle (sadece yeni indirilen hariç)
      try {
        const files = fs.readdirSync(UPDATES_DIR);
        for (const file of files) {
          if (file !== fileName) {
            // Sadece aynı platformun eski dosyalarını sil
            if (ymlFileName === 'latest.yml' && file.endsWith('.exe')) {
              fs.unlinkSync(path.join(UPDATES_DIR, file));
            } else if (ymlFileName === 'latest-linux.yml' && file.endsWith('.deb')) {
              fs.unlinkSync(path.join(UPDATES_DIR, file));
            }
          }
        }
      } catch (cleanupErr) {
        console.error(`[UpdateManager] Temizlik sırasında hata: ${cleanupErr.message}`);
      }

      console.log(`[UpdateManager] ${fileName} indirme tamamlandı ve yayına alındı.`);
      
      // Güncelleme geçmişine kaydet
      try {
        const ymlContentStr = fs.readFileSync(localYmlPath, 'utf-8');
        const versionMatch = ymlContentStr.match(/version:\s*([^\s]+)/);
        const version = versionMatch ? versionMatch[1] : 'Bilinmeyen';
        
        const currentUpdates = getData('updates') || [];
        // Eğer aynı versiyon daha önce aynı isimle kaydedildiyse tekrar eklemeyelim
        const alreadyExists = currentUpdates.find(u => u.version === version && u.details.includes(fileName));
        if (!alreadyExists) {
          const newUpdate = {
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            version: version,
            type: 'client',
            status: 'success',
            date: new Date().toISOString(),
            details: `${fileName} (İstemci Güncellemesi) başarıyla indirildi ve ağa sunuldu.`
          };
          setData('updates', [...currentUpdates, newUpdate]);
        }
      } catch (historyErr) {
        console.error(`[UpdateManager] Güncelleme geçmişi kaydedilemedi:`, historyErr);
      }

      return true;
    } else {
      fs.unlinkSync(tempYmlPath);
      console.log(`[UpdateManager] ${ymlFileName} okunamadı (path bulunamadı).`);
      return false;
    }
  }

  async checkAndDownload() {
    if (this.isChecking) return { success: false, message: 'Zaten kontrol ediliyor.' };
    this.isChecking = true;

    try {
      const settings = this.getSettings();
      if (settings.autoDownloadClientUpdates === false) {
        this.isChecking = false;
        return { success: false, message: 'Otomatik güncelleme indirme kapalı.' };
      }

      const baseUrl = settings.clientUpdatesUrl || 'https://github.com/Emiran404/Atolye.Platform/releases/latest/download';
      
      console.log(`[UpdateManager] Yeni güncellemeler kontrol ediliyor... (${baseUrl})`);

      const winUpdated = await this.downloadUpdateFile(baseUrl, 'latest.yml');
      const linuxUpdated = await this.downloadUpdateFile(baseUrl, 'latest-linux.yml');

      this.isChecking = false;

      if (winUpdated || linuxUpdated) {
        return { success: true, message: `Yeni sürüm indirildi!`, updated: true };
      } else {
        return { success: false, message: 'Yeni sürüm bulunamadı veya sisteminiz zaten güncel.', updated: false };
      }

    } catch (err) {
      console.error('[UpdateManager] Hata:', err);
      this.isChecking = false;
      return { success: false, message: 'İndirme sırasında hata oluştu: ' + err.message };
    }
  }
}

export const updateManager = new UpdateManager();

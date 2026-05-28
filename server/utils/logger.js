import { getData, setData } from './storage.js';
import { v4 as uuidv4 } from 'uuid';

const MAX_LOGS = 5000; // Son 5000 log tutulsun
const LOGS_COLLECTION = 'logs';

/**
 * Log veritabanına yeni bir işlem kaydı (audit) ekler.
 * @param {Object} data 
 * @param {string} data.type 'login' | 'submission' | 'focus_loss' | 'kiosk_violation' | 'teacher_action' | 'system'
 * @param {string} data.userId 
 * @param {string} data.userName 
 * @param {string} data.role 'student' | 'teacher' | 'system'
 * @param {string} data.action // Kısa açıklama (örn: "Sisteme giriş yaptı")
 * @param {Object} [data.details] // Ekstra detaylar (örn: { ip: "192.168.1.5", examId: "xyz" })
 */
export const addLog = (data) => {
  try {
    const currentLogs = getData(LOGS_COLLECTION) || [];
    
    const newLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: data.type || 'system',
      userId: data.userId || 'system',
      userName: data.userName || 'System',
      role: data.role || 'system',
      action: data.action || 'Bilinmeyen İşlem',
      details: data.details || {}
    };

    currentLogs.unshift(newLog); // En başa ekle (yeni loglar üstte)

    // Sınırı aşan eski logları temizle
    if (currentLogs.length > MAX_LOGS) {
      currentLogs.length = MAX_LOGS;
    }

    setData(LOGS_COLLECTION, currentLogs);
    return newLog;
  } catch (error) {
    console.error('Logger hatası:', error);
    return null;
  }
};

export const getLogs = () => {
  return getData(LOGS_COLLECTION) || [];
};

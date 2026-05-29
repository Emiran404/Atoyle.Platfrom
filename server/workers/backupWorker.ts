// @ts-nocheck
import { getData, setData } from '../utils/storage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backupsDir = path.join(__dirname, '../backups');

// Ensure backups directory exists
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Function to run the backup
export const runAutoBackup = async () => {
  try {
    const settings = getData('settings') || {};
    const includePhotos = settings.autoBackupIncludePhotos === true;

    console.log(`[AutoBackup] Starting automatic backup (Photos: ${includePhotos})...`);

    const students = getData('students') || [];
    const teachers = getData('teachers') || [];
    const exams = getData('exams') || [];
    const submissions = getData('submissions') || [];
    const notifications = getData('notifications') || [];
    const schedules = getData('schedules') || [];
    const classes = getData('classes') || [];
    const reports = getData('reports') || [];
    const settingsData = getData('settings') || {};

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      includesPhotos: includePhotos,
      data: {
        students,
        teachers,
        exams,
        submissions,
        notifications,
        schedules,
        classes,
        reports,
        settings: settingsData
      }
    };

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `auto-backup-${timestampStr}.zip`;
    const filePath = path.join(backupsDir, fileName);

    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      // Append backup JSON
      archive.append(JSON.stringify(backupData, null, 2), { name: 'backup.json' });

      // Append directories if photos included
      if (includePhotos) {
        const uploadsStudentPath = path.join(__dirname, '../../src/uploads_student');
        if (fs.existsSync(uploadsStudentPath)) {
          archive.directory(uploadsStudentPath, 'uploads_student');
        }

        const uploadsPath = path.join(__dirname, '../uploads');
        if (fs.existsSync(uploadsPath)) {
          archive.directory(uploadsPath, 'uploads');
        }
      }

      archive.finalize();
    });

    console.log(`[AutoBackup] Backup saved to ${filePath}`);

    // Update settings with last backup time
    settings.lastAutoBackupTime = new Date().toISOString();
    setData('settings', settings);

    // Keep only the last 10 backups to prevent disk overflow
    cleanOldBackups();

  } catch (error) {
    console.error('[AutoBackup] Error during auto-backup:', error);
  }
};

// Keep last 10 backups
const cleanOldBackups = () => {
  try {
    const files = fs.readdirSync(backupsDir)
      .filter(file => file.startsWith('auto-backup-') && file.endsWith('.zip'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(backupsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Newest first

    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      filesToDelete.forEach(f => {
        const fileToDeletePath = path.join(backupsDir, f.name);
        if (fs.existsSync(fileToDeletePath)) {
          fs.unlinkSync(fileToDeletePath);
          console.log(`[AutoBackup] Cleaned old backup file: ${f.name}`);
        }
      });
    }
  } catch (err) {
    console.error('[AutoBackup] Error cleaning old backups:', err);
  }
};

const checkAndRunBackup = () => {
  try {
    const settings = getData('settings') || {};
    if (settings.autoBackupEnabled !== true) {
      return;
    }

    const intervalHours = settings.autoBackupInterval || 24;
    const lastBackup = settings.lastAutoBackupTime;

    if (!lastBackup) {
      // Run immediately if never run
      runAutoBackup();
    } else {
      const timeDiffMs = Date.now() - new Date(lastBackup).getTime();
      const thresholdMs = intervalHours * 60 * 60 * 1000;

      if (timeDiffMs >= thresholdMs) {
        runAutoBackup();
      }
    }
  } catch (err) {
    console.error('[AutoBackup] Error checking auto-backup:', err);
  }
};

// Worker loop
export const startBackupWorker = () => {
  console.log('[AutoBackup] Worker loop started.');

  // Check once shortly after startup
  setTimeout(checkAndRunBackup, 5000);

  // Check every 5 minutes
  setInterval(checkAndRunBackup, 5 * 60 * 1000);
};

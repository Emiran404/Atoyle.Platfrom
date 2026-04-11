import { app, BrowserWindow, ipcMain } from 'electron';
import { Bonjour } from 'bonjour-service';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let splashWindow;
let currentServerUrl = null;
let isDiscoveryFound = false;
const bonjour = new Bonjour();

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 500,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  splashWindow.loadFile('splash.html');
}

function createMainWindow(url) {
  if (mainWindow) {
    mainWindow.loadURL(url);
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    title: "Atolye Platform",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(url);

  // Sayfa yükleme hatası (Sunucu kapalıyken reload veya drop)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log(`⚠️ Yükleme Hatası (${errorCode}): ${errorDescription}`);
    if (errorCode !== -3) {
      mainWindow.loadFile('error.html');
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Yerel alt ağdaki sunucuyu HTTP ile taramayı dener (mDNS'e ihtiyaç duymaz)
function getLocalSubnets() {
  const subnets = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const parts = iface.address.split('.');
        subnets.push(parts.slice(0, 3).join('.'));
      }
    }
  }
  return [...new Set(subnets)];
}

// mDNS Taraması Başlat (Sürekli Çalışır)
function startDiscovery() {
  console.log('🔍 [Discovery] mDNS taraması başlatılıyor...');
  const browser = bonjour.find({ type: 'atolye' });

  browser.on('up', (service) => {
    const addresses = service.addresses || [service.referer?.address].filter(Boolean);
    console.log(`🔍 [Discovery] mDNS Servis Bulundu (${service.name}), adresler: ${addresses.join(', ')}`);

    for (const ip of addresses) {
      if (ip.includes(':')) continue;
      
      const url = `http://${ip}:${service.port}`;
      
      if (!isDiscoveryFound || (mainWindow && mainWindow.webContents.getURL().includes('error.html'))) {
        console.log(`✅ [Discovery] Sunucu Bulundu: ${url}`);
        currentServerUrl = url;
        isDiscoveryFound = true;
        connectToServer(url);
        break;
      }
    }
  });

  // FALLBACK 1: Periyodik localhost + bilinen IP kontrolü
  setInterval(async () => {
    if (!isDiscoveryFound || (mainWindow && mainWindow.webContents.getURL().includes('error.html'))) {
      const targets = ['http://localhost:3001', currentServerUrl].filter(Boolean);
      
      for (const target of targets) {
        if (await tryConnect(target)) return;
      }
    }
  }, 5000);

  // FALLBACK 2: Alt ağ taraması (mDNS çalışmazsa ağdaki sunucuyu HTTP ile bul)
  setTimeout(() => {
    if (!isDiscoveryFound) {
      console.log('🔎 [Discovery] mDNS 8sn içinde bulamadı, alt ağ taraması başlatılıyor...');
      scanSubnet();
    }
  }, 8000);
}

async function tryConnect(url) {
  try {
    const response = await fetch(`${url}/api/system/status`, { signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      console.log(`🚀 [Discovery] Sunucu aktif: ${url}`);
      currentServerUrl = url;
      isDiscoveryFound = true;
      connectToServer(url);
      return true;
    }
  } catch (e) { /* sessizce geç */ }
  return false;
}

async function scanSubnet() {
  const subnets = getLocalSubnets();
  console.log(`🔎 [Discovery] Taranan alt ağlar: ${subnets.join(', ')}`);
  
  for (const subnet of subnets) {
    // Yaygın sunucu IP'lerini önce dene
    const priorityHosts = [1, 2, 10, 20, 50, 100, 150, 200, 254];
    
    for (const host of priorityHosts) {
      if (isDiscoveryFound) return;
      const url = `http://${subnet}.${host}:3001`;
      if (await tryConnect(url)) return;
    }
    
    // Kalanları 10'ar 10'ar batch halinde tara
    const remaining = [];
    for (let i = 1; i <= 254; i++) {
      if (priorityHosts.includes(i) || isDiscoveryFound) continue;
      remaining.push(`http://${subnet}.${i}:3001`);
    }
    
    for (let i = 0; i < remaining.length; i += 10) {
      if (isDiscoveryFound) return;
      const batch = remaining.slice(i, i + 10);
      const results = await Promise.all(batch.map(url => tryConnect(url)));
      if (results.some(r => r)) return;
    }
  }
  
  console.log('⚠️ [Discovery] Alt ağ taraması tamamlandı, sunucu bulunamadı.');
}

function connectToServer(url) {
  if (!mainWindow) {
    createMainWindow(url);
  } else {
    mainWindow.loadURL(url);
  }
  
  // Splash'i kapat
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.maximize();
    }
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
  }, 500);
}

app.whenReady().then(() => {
  createSplash();
  startDiscovery();

  // MANUEL BAĞLANTI IPC (Her zaman aktif, splash açıldığı anda hazır)
  ipcMain.on('manual-connect', (event, host) => {
    const url = host.startsWith('http') ? host : `http://${host}:3001`;
    console.log(`🔌 Manuel bağlantı isteği: ${url}`);
    currentServerUrl = url;
    isDiscoveryFound = true;
    connectToServer(url);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (isDiscoveryFound && currentServerUrl) {
      createMainWindow(currentServerUrl);
    } else {
      createSplash();
    }
  }
});

import { app, BrowserWindow, ipcMain } from 'electron';
import { Bonjour } from 'bonjour-service';
import dgram from 'dgram';
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
const BROADCAST_PORT = 41234;

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

// ═══════════════════════════════════════════════════════════════
// BİRLEŞİK BAĞLANTI FONKSİYONU
// ═══════════════════════════════════════════════════════════════
function connectToServer(url) {
  if (isDiscoveryFound && mainWindow && !mainWindow.webContents.getURL().includes('error.html')) {
    return; // Zaten bağlıyız, tekrar bağlanma
  }

  console.log(`🚀 [Connect] Sunucuya bağlanılıyor: ${url}`);
  currentServerUrl = url;
  isDiscoveryFound = true;

  if (!mainWindow) {
    createMainWindow(url);
  } else {
    mainWindow.loadURL(url);
  }

  // Splash'i zorla kapat
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

// ═══════════════════════════════════════════════════════════════
// 1. mDNS KEŞİF (Bonjour)
// ═══════════════════════════════════════════════════════════════
function startMDNS() {
  console.log('🔍 [mDNS] Tarama başlatılıyor...');
  const browser = bonjour.find({ type: 'atolye' });

  browser.on('up', (service) => {
    const addresses = service.addresses || [service.referer?.address].filter(Boolean);
    console.log(`🔍 [mDNS] Servis: ${service.name}, adresler: ${addresses.join(', ')}`);

    for (const ip of addresses) {
      if (ip.includes(':')) continue;
      connectToServer(`http://${ip}:${service.port}`);
      return;
    }

    // TXT kaydındaki IP'leri de dene
    if (service.txt?.ips) {
      const txtIps = service.txt.ips.split(',');
      for (const ip of txtIps) {
        if (!ip.includes(':')) {
          connectToServer(`http://${ip}:${service.port}`);
          return;
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// 2. UDP BROADCAST DİNLEYİCİ (En hızlı ve güvenilir yöntem)
// ═══════════════════════════════════════════════════════════════
function startUDPListener() {
  try {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    socket.on('message', (msg, rinfo) => {
      if (isDiscoveryFound) return;
      
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'atolye-server-beacon') {
          // Gönderenin IP'sini veya birincil IP'yi kullan
          const serverIp = data.primary || rinfo.address;
          const serverPort = data.port || 3001;
          console.log(`📡 [UDP] Beacon yakalandı! IP: ${serverIp}:${serverPort} (from ${rinfo.address})`);
          connectToServer(`http://${serverIp}:${serverPort}`);
        }
      } catch (e) { /* JSON parse hatası, sessizce geç */ }
    });

    socket.on('error', (err) => {
      console.log(`⚠️ [UDP] Dinleyici hatası: ${err.message}`);
      socket.close();
    });

    socket.bind(BROADCAST_PORT, () => {
      console.log(`📡 [UDP] Broadcast dinleyici aktif (port ${BROADCAST_PORT})`);
    });
  } catch (e) {
    console.log(`⚠️ [UDP] Başlatılamadı: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════  
// 3. ALT AĞ HTTP TARAMASI (Son çare fallback)
// ═══════════════════════════════════════════════════════════════
function getLocalSubnets() {
  const subnets = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        subnets.push(iface.address.split('.').slice(0, 3).join('.'));
      }
    }
  }
  return [...new Set(subnets)];
}

async function tryHTTP(url) {
  try {
    const response = await fetch(`${url}/api/system/status`, { signal: AbortSignal.timeout(800) });
    if (response.ok) {
      console.log(`✅ [HTTP] Sunucu bulundu: ${url}`);
      connectToServer(url);
      return true;
    }
  } catch (e) { /* timeout veya bağlantı hatası */ }
  return false;
}

async function scanSubnet() {
  if (isDiscoveryFound) return;
  const subnets = getLocalSubnets();
  console.log(`🔎 [Subnet] Taranıyor: ${subnets.join(', ')}`);
  
  // Splash'e durum bildir
  if (splashWindow) {
    splashWindow.webContents.send('discovery-status', 'AĞ TARANIYOR...');
  }

  for (const subnet of subnets) {
    if (isDiscoveryFound) return;
    
    // Yaygın sunucu IP'leri önce
    const priority = [1, 2, 5, 10, 15, 20, 25, 30, 50, 100, 150, 200, 254];
    for (const host of priority) {
      if (isDiscoveryFound) return;
      if (await tryHTTP(`http://${subnet}.${host}:3001`)) return;
    }

    // Kalanları 15'erli gruplar halinde tara
    const rest = [];
    for (let i = 1; i <= 254; i++) {
      if (!priority.includes(i)) rest.push(i);
    }
    
    for (let i = 0; i < rest.length; i += 15) {
      if (isDiscoveryFound) return;
      const batch = rest.slice(i, i + 15);
      await Promise.all(batch.map(h => tryHTTP(`http://${subnet}.${h}:3001`)));
    }
  }

  if (!isDiscoveryFound) {
    console.log('⚠️ [Subnet] Tarama tamamlandı, sunucu bulunamadı.');
  }
}

// ═══════════════════════════════════════════════════════════════
// BAŞLATMA
// ═══════════════════════════════════════════════════════════════
function startDiscovery() {
  // Katman 1: mDNS (anında)
  startMDNS();
  
  // Katman 2: UDP Broadcast Dinleyici (anında, en güvenilir)
  startUDPListener();
  
  // Katman 3: Periyodik localhost kontrolü (her 3 saniyede)
  setInterval(async () => {
    if (!isDiscoveryFound || (mainWindow && mainWindow.webContents.getURL().includes('error.html'))) {
      const targets = ['http://localhost:3001', currentServerUrl].filter(Boolean);
      for (const t of targets) {
        if (await tryHTTP(t)) return;
      }
    }
  }, 3000);

  // Katman 4: Alt ağ taraması (5 saniye sonra, mDNS/UDP bulamazsa)
  setTimeout(() => {
    if (!isDiscoveryFound) {
      scanSubnet();
    }
  }, 5000);
}

app.whenReady().then(() => {
  createSplash();
  startDiscovery();

  // MANUEL BAĞLANTI IPC (Her zaman aktif)
  ipcMain.on('manual-connect', (event, host) => {
    const url = host.startsWith('http') ? host : `http://${host}:3001`;
    console.log(`🔌 Manuel bağlantı: ${url}`);
    connectToServer(url);
  });

  // Splash'e 5 saniye sonra manuel butonu göster sinyali
  setTimeout(() => {
    if (splashWindow && !isDiscoveryFound) {
      splashWindow.webContents.send('show-manual');
    }
  }, 5000);
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

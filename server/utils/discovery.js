import { Bonjour } from 'bonjour-service';
import dgram from 'dgram';
import os from 'os';

const instance = new Bonjour();
let service = null;
let broadcastInterval = null;

const BROADCAST_PORT = 41234; // UDP Broadcast için özel port

// Fiziksel ağ arayüzlerini ve IP'lerini bul (Yalnızca IPv4)
const getNetworkAddresses = () => {
  const addresses = [];
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ ip: iface.address, broadcast: calculateBroadcast(iface.address, iface.netmask) });
      }
    }
  }
  return addresses;
};

// Alt ağ broadcast adresini hesapla (192.168.1.0/24 -> 192.168.1.255)
function calculateBroadcast(ip, netmask) {
  const ipParts = ip.split('.').map(Number);
  const maskParts = netmask.split('.').map(Number);
  return ipParts.map((p, i) => (p | (~maskParts[i] & 255))).join('.');
}

// ═══════════════════════════════════════════════════════════════
// UDP BROADCAST BEACON - mDNS'ten çok daha güvenilir, her ağda çalışır
// ═══════════════════════════════════════════════════════════════
function startUDPBroadcast(port) {
  const interfaces = getNetworkAddresses();
  const allIps = interfaces.map(i => i.ip);
  const mainIp = allIps.find(ip => ip.startsWith('192.168.')) || allIps[0] || '0.0.0.0';

  const beacon = JSON.stringify({
    type: 'atolye-server-beacon',
    port: port,
    ips: allIps,
    primary: mainIp,
    hostname: os.hostname(),
    version: '2.5.5',
    ts: Date.now()
  });

  broadcastInterval = setInterval(() => {
    for (const iface of interfaces) {
      try {
        const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        sock.bind(() => {
          sock.setBroadcast(true);
          const buf = Buffer.from(beacon);
          sock.send(buf, 0, buf.length, BROADCAST_PORT, iface.broadcast, () => {
            sock.close();
          });
        });
      } catch (e) { /* sessizce geç */ }
    }
  }, 2000); // Her 2 saniyede bir yayınla

  console.log(`[Discovery] UDP Broadcast başlatıldı (port ${BROADCAST_PORT}), hedefler: ${interfaces.map(i => i.broadcast).join(', ')}`);
}

// ═══════════════════════════════════════════════════════════════
// mDNS YAYIN - Ek olarak Bonjour ile yayın
// ═══════════════════════════════════════════════════════════════
export const startDiscovery = (port = 3001) => {
  try {
    const interfaces = getNetworkAddresses();
    const allIps = interfaces.map(i => i.ip);
    const mainIp = allIps.find(ip => ip.startsWith('192.168.')) || allIps[0];
    const hostname = os.hostname().toLowerCase();
    const uniqueId = Math.floor(Math.random() * 10000);

    // 1) mDNS Yayını
    service = instance.publish({
      name: `Atolye Platform Server (${hostname}-${uniqueId})`,
      type: 'atolye',
      protocol: 'tcp',
      port: port,
      host: `${hostname}.local`,
      txt: {
        version: '2.5.5',
        id: 'atolye-master',
        ips: allIps.join(','),
        primary: mainIp,
        timestamp: Date.now().toString()
      }
    });

    console.log(`[Discovery] mDNS yayını v2.5.5 başlatıldı (${hostname}.local)`);
    console.log(`[Discovery] Birincil IP: ${mainIp} | Tüm IP'ler: ${allIps.join(', ')}`);

    service.on('up', () => {
      console.log('[Discovery] mDNS sinyali yayılıyor...');
    });

    service.on('error', (err) => {
      console.error('[Discovery] mDNS hatası:', err.message);
    });

    // 2) UDP Broadcast Beacon (mDNS'e güvenilmeyen ağlarda bu devreye girer)
    startUDPBroadcast(port);

  } catch (err) {
    console.error('[Discovery] Başlatılamadı:', err);
  }
};

export const stopDiscovery = () => {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
  if (service) {
    service.stop(() => {
      console.log('[Discovery] mDNS yayını durduruldu.');
      instance.destroy();
    });
  }
};

process.on('SIGINT', stopDiscovery);
process.on('SIGTERM', stopDiscovery);

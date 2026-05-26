#!/bin/bash
echo "======================================================"
echo "  Atolye.Platform - Cevrimdisi Baslatiliyor (PROD)"
echo "======================================================"
echo ""

# Node.js Kontrolü
if ! command -v node &> /dev/null; then
    echo "❌ Hata: Node.js sisteminizde kurulu degil!"
    echo "Lutfen Node.js yukleyin (Pardus icin: sudo apt install nodejs)"
    exit 1
fi

echo "🟢 Sunucu baslatiliyor..."
echo "Ağdaki diger bilgisayarlardan baglanmak icin sunucunun IP adresini kullanabilirsiniz."
echo ""

# Sunucuyu çalıştır
export NODE_ENV=production
node server/index.js

#!/bin/bash

echo "======================================================"
echo "  PolyOS Sinav Platformu - Kurulum (Linux/Pardus)"
echo "======================================================"

# Node.js kontrolü
if ! command -v node &> /dev/null
then
    echo "Hata: Node.js kurulu degil. Lutfen yukleyip tekrar deneyin."
    exit
fi

echo ""
echo "[1/3] Frontend bagimliliklari yukleniyor..."
npm install

echo ""
echo "[2/3] Backend bagimliliklari yukleniyor..."
cd server && npm install
cd ..

echo ""
echo "[3/3] Proje derleniyor (Build) ve Sifreleniyor..."
npm run build

echo ""
echo "======================================================"
echo "  KURULUM TAMAMLANDI!"
echo "======================================================"
echo ""
echo "Uygulamayi baslatmak icin './baslat.sh' komutunu kullanin."
echo ""
chmod +x baslat.sh

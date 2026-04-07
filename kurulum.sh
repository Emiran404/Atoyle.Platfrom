#!/bin/bash

echo "======================================================"
echo "  PolyOS Sinav Platformu - Kurulum (Linux/Pardus)"
echo "======================================================"

# Git Kontrolü
if ! command -v git &> /dev/null; then
    echo "[UYARI] Git sisteminizde kurulu degil!"
    echo "Pardus/Linux icin: sudo apt install git"
    echo ""
else
    echo "[+] Git algilandi."
fi

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo "Hata: Node.js kurulu degil. Lutfen yukleyip tekrar deneyin."
    exit 1
fi

echo ""
echo "[1/4] Proje Klasoru ve Git Kontrolu..."
if [ ! -d ".git" ]; then
    echo "[!] Bu klasor bir Git deposu degil."
    read -p "GitHub'dan en guncel kodlari cekmek ister misiniz? (e/h): " CLONE_CHOICE
    if [[ $CLONE_CHOICE =~ ^[Ee]$ ]]; then
        echo "Repo klonlaniyor..."
        git init
        git remote add origin https://github.com/Emiran404/Atoyle.Platfrom.git
        git fetch
        git checkout -t origin/main -f
    fi
else
    read -p "GitHub'dan guncelleme yapayim mi? (e/h): " PULL_CHOICE
    if [[ $PULL_CHOICE =~ ^[Ee]$ ]]; then
        echo "Kodlar guncelleniyor..."
        git pull origin main --autostash
    fi
fi

echo ""
echo "[2/4] Frontend bagimliliklari yukleniyor..."
npm install

echo ""
echo "[3/4] Backend bagimliliklari yukleniyor..."
cd server && npm install
cd ..

echo ""
echo "[4/4] Proje derleniyor (Build) ve Sifreleniyor..."
npm run build

echo ""
echo "======================================================"
echo "  KURULUM TAMAMLANDI!"
echo "======================================================"
echo ""
echo "Uygulamayi baslatmak icin './baslat.sh' komutunu kullanin."
echo ""
chmod +x baslat.sh

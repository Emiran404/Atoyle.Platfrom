@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo   PolyOS Sinav Platformu - Kurulum ve Hazirlik
echo ======================================================

:: Git Kontrolü
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [UYARI] Git sisteminizde kurulu degil!
    echo Guncellemeleri panel üzerinden yapabilmek icin Git gereklidir.
    echo Lütfen https://git-scm.com/ adresinden Git'i kurun.
    echo.
) else (
    echo [+] Git algilandi.
)

echo.
echo [1/4] Proje Klasoru ve Git Kontrolü...
if not exist ".git" (
    echo [!] Bu klasor bir Git deposu degil. 
    set /p clone_choice="GitHub'dan en güncel kodlari cekmek ister misiniz? (E/H): "
    if /i "!clone_choice!"=="E" (
        echo Repo klonlaniyor...
        git init
        git remote add origin https://github.com/Emiran404/Atoyle.Platfrom.git
        git fetch
        git checkout -t origin/main -f
    )
) else (
    set /p pull_choice="GitHub'dan guncelleme yapayim mi? (E/H): "
    if /i "!pull_choice!"=="E" (
        echo Kodlar guncelleniyor...
        git pull origin main --autostash
    )
)

echo.
echo [2/4] Frontend bagimliliklari yukleniyor...
call npm install

echo.
echo [3/4] Backend bagimliliklari yukleniyor...
cd server
call npm install
cd ..

echo.
echo [4/4] Proje derleniyor (Build) ve Sifreleniyor...
call npm run build

echo.
echo ======================================================
echo   KURULUM TAMAMLANDI!
echo ======================================================
echo.
echo Uygulamayi baslatmak icin 'baslat.bat' dosyasini kullanin.
echo.
pause

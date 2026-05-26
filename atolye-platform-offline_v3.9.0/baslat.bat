@echo off
title Atolye.Platform - Cevrimdisi Baslatici
echo ======================================================
echo   Atolye.Platform - Cevrimdisi Baslatiliyor (PROD)
echo ======================================================
echo.

:: Node.js Kontrolü
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Node.js kurulu degil!
    echo Lutfen Node.js yukleyin (https://nodejs.org/)
    pause
    exit /b 1
)

echo [OK] Node.js algilandi.
echo.
echo Sunucu baslatiliyor...
echo Agdaki diger bilgisayarlardan baglanmak icin bu bilgisayarin IP adresini kullanabilirsiniz.
echo.

set NODE_ENV=production
node server/index.js
pause

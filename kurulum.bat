@echo off
echo ======================================================
echo   PolyOS Sinav Platformu - Kurulum ve Hazirlik
echo ======================================================

echo.
echo [1/3] Frontend bagimliliklari yukleniyor...
call npm install

echo.
echo [2/3] Backend bagimliliklari yukleniyor...
cd server
call npm install
cd ..

echo.
echo [3/3] Proje derleniyor (Build) ve Sifreleniyor...
call npm run build

echo.
echo ======================================================
echo   KURULUM TAMAMLANDI!
echo ======================================================
echo.
echo Uygulamayi baslatmak icin 'baslat.bat' dosyasini kullanin.
echo.
pause

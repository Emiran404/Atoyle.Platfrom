@echo off
:: Set encoding to support special characters in folder names if needed
chcp 65001 >nul

echo.
echo  =========================================
echo  [      SYSTEM RESET CLEANUP TOOL      ]
echo  =========================================
echo  [!] Status: Starting initialization...

:: Directory paths - using %~dp0 (current script folder)
set "ROOT_DIR=%~dp0"
set "STUDENT_DIR=%ROOT_DIR%src\uploads_student"
set "TEMP_DIR=%ROOT_DIR%server\temp"
set "SERVER_UP=%ROOT_DIR%server\uploads"

echo.
echo  -----------------------------------------
echo  PHASE 1: Soft Cleanup (No process kill)
echo  -----------------------------------------

set NEED_HARD_CLEAN=0

:: Check Student Uploads
if not exist "%STUDENT_DIR%" goto :SKIP_SOFT_STUDENT
echo [-] Attempting soft clean: Student Uploads...
rd /s /q "%STUDENT_DIR%" 2>nul
if exist "%STUDENT_DIR%" (
    echo [!] Student Uploads is LOCKED. Hard Cleanup needed.
    set NEED_HARD_CLEAN=1
) else (
    mkdir "%STUDENT_DIR%"
    echo. > "%STUDENT_DIR%\.gitkeep"
    echo [+] Student Uploads cleaned successfully.
)
:SKIP_SOFT_STUDENT

:: Check Server Temp
if not exist "%TEMP_DIR%" goto :SKIP_SOFT_TEMP
echo [-] Attempting soft clean: Server Temp...
rd /s /q "%TEMP_DIR%" 2>nul
if exist "%TEMP_DIR%" (
    echo [!] Server Temp is LOCKED. Hard Cleanup needed.
    set NEED_HARD_CLEAN=1
) else (
    mkdir "%TEMP_DIR%"
    echo [+] Server Temp cleaned successfully.
)
:SKIP_SOFT_TEMP

:: Decide if Hard Cleanup is needed
if "%NEED_HARD_CLEAN%"=="0" goto :END_CLEANUP

echo.
echo  -----------------------------------------
echo  PHASE 2: Hard Cleanup (Killing processes)
echo  -----------------------------------------
echo [!] Soft cleanup failed for some folders. 
echo [!] Stopping Node.js and Vite to release locks...

taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM "Vite" /T >nul 2>&1
timeout /t 2 /nobreak >nul

:: Hard Clean Student Uploads
if not exist "%STUDENT_DIR%" goto :SKIP_HARD_STUDENT
echo [-] Force cleaning: Student Uploads...
rd /s /q "%STUDENT_DIR%" 2>nul
if exist "%STUDENT_DIR%" (
    echo [X] ERROR: Student Uploads STILL LOCKED. 
) else (
    mkdir "%STUDENT_DIR%"
    echo. > "%STUDENT_DIR%\.gitkeep"
    echo [+] Student Uploads cleaned successfully (Hard).
)
:SKIP_HARD_STUDENT

:: Hard Clean Server Temp
if not exist "%TEMP_DIR%" goto :SKIP_HARD_TEMP
echo [-] Force cleaning: Server Temp...
rd /s /q "%TEMP_DIR%" 2>nul
if exist "%TEMP_DIR%" (
    echo [X] ERROR: Server Temp STILL LOCKED. 
) else (
    mkdir "%TEMP_DIR%"
    echo [+] Server Temp cleaned successfully (Hard).
)
:SKIP_HARD_TEMP

:END_CLEANUP
echo.
echo  =========================================
echo  [+] SUCCESS: Cleanup process finished.
echo  [+] Info: You can now run "npm run dev".
echo  =========================================
echo.
pause

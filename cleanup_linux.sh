#!/bin/bash

clear
echo "========================================="
echo "[      SYSTEM RESET CLEANUP TOOL      ]"
echo "========================================="
echo "[!] Status: Starting initialization..."
echo ""

# Directory paths
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STUDENT_DIR="$ROOT_DIR/src/uploads_student"
TEMP_DIR="$ROOT_DIR/server/temp"

echo "-----------------------------------------"
echo "PHASE 1: Soft Cleanup (No process kill)"
echo "-----------------------------------------"

NEED_HARD_CLEAN=0

clean_soft() {
    local path=$1
    local name=$2
    if [ -d "$path" ]; then
        echo "[-] Attempting soft clean: $name..."
        rm -rf "$path" 2>/dev/null
        if [ ! -d "$path" ]; then
            mkdir -p "$path"
            if [ "$name" == "Student Uploads" ]; then touch "$path/.gitkeep"; fi
            echo "[+] $name cleaned successfully (Soft)."
        else
            echo "[!] $name remains. Phase 2 required."
            NEED_HARD_CLEAN=1
        fi
    fi
}

clean_soft "$STUDENT_DIR" "Student Uploads"
clean_soft "$TEMP_DIR" "Server Temp"

if [ $NEED_HARD_CLEAN -eq 1 ]; then
    echo ""
    echo "-----------------------------------------"
    echo "PHASE 2: Hard Cleanup (Killing processes)"
    echo "-----------------------------------------"
    echo "[!] Soft cleanup failed. Stopping Node and Vite..."
    
    pkill -9 node >/dev/null 2>&1
    pkill -9 vite >/dev/null 2>&1
    sleep 2

    clean_hard() {
        local path=$1
        local name=$2
        if [ -d "$path" ]; then
            echo "[-] Force cleaning: $name..."
            rm -rf "$path" 2>/dev/null
            mkdir -p "$path"
            if [ "$name" == "Student Uploads" ]; then touch "$path/.gitkeep"; fi
            echo "[+] $name cleaned successfully (Hard)."
        fi
    }

    clean_hard "$STUDENT_DIR" "Student Uploads"
    clean_hard "$TEMP_DIR" "Server Temp"
fi

echo ""
echo "========================================="
echo "[+] SUCCESS: Cleanup process finished."
echo "[+] Info: You can now run 'npm run dev'."
echo "========================================="
echo ""

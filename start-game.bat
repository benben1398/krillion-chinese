@echo off
title 亿中选一 (Krillion Multiplayer)
cd /d "%~dp0"
echo ========================================================
echo   🌊 正在启动 亿中选一 (Krillion 中文多人版)...
echo ========================================================
echo.

set ELECTRON_RUN_AS_NODE=1
"C:\Users\Benjamin\AppData\Local\Programs\antigravity\Antigravity.exe" server.js

pause

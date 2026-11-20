@echo off
title 亿中选一 (Krillion) — 外网/跨网络联机启动器
cd /d "%~dp0"

echo ===================================================================
echo   🌊 亿中选一 (Krillion Multiplayer) — 外网好友联机
echo ===================================================================
echo.
echo 正在启动本地游戏服务器 (Port 3000)...
set ELECTRON_RUN_AS_NODE=1

:: 在后台新窗口启动游戏服务器
start "Krillion Game Server" cmd /c ""C:\Users\Benjamin\AppData\Local\Programs\antigravity\Antigravity.exe" server.js"

:: 等待 2 秒让服务器就绪
timeout /t 2 /nobreak >nul

echo.
echo ===================================================================
echo   🌐 正在为您生成全球公网 HTTPS 链接 (无需在同一WiFi下)...
echo ===================================================================
echo.
echo [提示] 正在使用 Windows 内置的安全加密隧道通道为你的游戏分配公网网址:
echo 稍后下方会显示一段以 https:// 开头的网址 (例如 https://xxxx.lhr.life 或 pinggy)。
echo 复制该网址发送给好友，好友使用不同网络 (手机流量/自家WiFi) 均可进入！
echo.
echo -------------------------------------------------------------------
echo.

:: 优先使用 localhost.run 安全隧道 (Windows 自带 ssh，免安装任何软件)
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -R 80:localhost:3000 nokey@localhost.run

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 正在尝试备用安全隧道通道 (Pinggy)...
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -p 443 -R0:localhost:3000 a.pinggy.io
)

pause

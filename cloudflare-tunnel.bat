@echo off
title 亿中选一 (Krillion) — Cloudflare 高速外网隧道
cd /d "%~dp0"

echo ===================================================================
echo   🌊 亿中选一 (Krillion) — Cloudflare 全球高速联机隧道
echo ===================================================================
echo.

if not exist "%~dp0cloudflared.exe" (
    echo [提示] 未找到 cloudflared.exe。
    echo 正在从 Cloudflare 官方为您自动下载轻量级穿透程序...
    powershell -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0cloudflared.exe' -UseBasicParsing; Write-Host '下载完成！' } catch { Write-Host '下载遇到问题，可直接运行 share-to-internet.bat 使用免下载通道。' }"
)

echo 正在启动本地服务器...
set ELECTRON_RUN_AS_NODE=1
start "Krillion Game Server" cmd /c ""C:\Users\Benjamin\AppData\Local\Programs\antigravity\Antigravity.exe" server.js"
timeout /t 2 /nobreak >nul

if exist "%~dp0cloudflared.exe" (
    echo.
    echo ===================================================================
    echo   🚀 正在开启 Cloudflare 隧道...
    echo   下方将显示生成的 *.trycloudflare.com 网址，复制给外网好友即可！
    echo ===================================================================
    echo.
    "%~dp0cloudflared.exe" tunnel --url http://localhost:3000
) else (
    echo.
    echo 正在自动转入免安装隧道通道...
    call "%~dp0share-to-internet.bat"
)

pause

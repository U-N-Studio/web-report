@echo off
cd /d "%~dp0app"
echo Starting Web Report...
npm run electron:start
pause

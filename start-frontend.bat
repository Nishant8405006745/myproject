@echo off
echo Starting ACME Accounting Frontend...
cd /d "%~dp0frontend"
npm run dev
pause

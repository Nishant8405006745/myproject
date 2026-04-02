@echo off
echo Starting ACME Accounting Backend...
cd /d "%~dp0backend"
python -m uvicorn main:app --reload --port 8000
pause

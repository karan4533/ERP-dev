@echo off
setlocal
cd /d "%~dp0"
call "%~dp0setup-local.bat"
if errorlevel 1 exit /b 1
if not exist ".env" copy /Y ".env.example" ".env" >nul
python -m uvicorn app.main:app --reload --port 8000

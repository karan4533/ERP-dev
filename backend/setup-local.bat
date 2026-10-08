@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ========================================
echo  QMIS ERP API - One-time Local Setup
echo ========================================
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python was not found on PATH.
  echo Install Python 3.11+ and retry.
  pause
  exit /b 1
)

python --version
echo.

if not exist ".venv\Scripts\python.exe" (
  echo [INFO] Creating virtualenv .venv ...
  python -m venv .venv
  if errorlevel 1 (
    echo [ERROR] Failed to create virtualenv.
    pause
    exit /b 1
  )
) else (
  echo [INFO] Virtualenv already exists.
)

call ".venv\Scripts\activate.bat"
echo [INFO] Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
  echo [ERROR] pip install failed.
  pause
  exit /b 1
)

if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  echo [INFO] Created .env from .env.example
) else (
  echo [INFO] .env already exists - left unchanged
)

echo.
echo ========================================
echo  Setup complete
echo ========================================
echo.
echo Before running:
echo   1. Install / start PostgreSQL locally
echo   2. Create database:  CREATE DATABASE qmis_erp;
echo   3. Default DATABASE_URL uses user=postgres password=root
echo      Edit .env if your user/password/port differ
echo.
echo Then start the API with:  run-local.bat
echo.
pause
endlocal

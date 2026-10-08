@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ========================================
echo  QMIS ERP API - Local Backend
echo ========================================
echo.

if not exist ".venv\Scripts\python.exe" (
  echo [ERROR] Virtualenv not found.
  echo Run setup-local.bat once, then try again.
  echo.
  pause
  exit /b 1
)

if not exist ".env" (
  echo [INFO] .env missing - copying from .env.example
  copy /Y ".env.example" ".env" >nul
  echo [INFO] Edit backend\.env and set DATABASE_URL for PostgreSQL.
  echo.
)

call ".venv\Scripts\activate.bat"
if errorlevel 1 (
  echo [ERROR] Failed to activate virtualenv.
  pause
  exit /b 1
)

echo [INFO] Starting FastAPI on http://127.0.0.1:8000
echo [INFO] Swagger docs:     http://127.0.0.1:8000/docs
echo [INFO] Health check:     http://127.0.0.1:8000/api/v1/health
echo [INFO] PostgreSQL must be running ^(see DATABASE_URL in .env^)
echo [INFO] Press Ctrl+C to stop
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
  echo [ERROR] Server exited with code %EXIT_CODE%.
  echo Check PostgreSQL is running and DATABASE_URL in .env is correct.
  pause
)

endlocal & exit /b %EXIT_CODE%

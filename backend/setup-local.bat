@echo off
setlocal
cd /d "%~dp0"

set "PSQL="
for /d %%D in ("C:\Program Files\PostgreSQL\*") do (
  if exist "%%D\bin\psql.exe" set "PSQL=%%D\bin\psql.exe"
)
if "%PSQL%"=="" (
  echo PostgreSQL is not installed. Install PostgreSQL 17 and set the postgres password to root.
  exit /b 1
)

echo Creating database qmis_erp if needed...
set PGPASSWORD=root
"%PSQL%" -U postgres -h localhost -p 5432 -tc "SELECT 1 FROM pg_database WHERE datname = 'qmis_erp'" | findstr 1 >nul
if errorlevel 1 (
  "%PSQL%" -U postgres -h localhost -p 5432 -c "CREATE DATABASE qmis_erp"
)
echo Database qmis_erp is ready.
exit /b 0

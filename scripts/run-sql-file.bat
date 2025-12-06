@echo off
REM Script pour exécuter un fichier SQL via psql et Supabase
REM Usage: run-sql-file.bat <fichier.sql>

if "%1"=="" (
    echo Usage: run-sql-file.bat ^<fichier.sql^>
    echo.
    echo Exemples:
    echo   run-sql-file.bat scripts\analyze-data.sql
    echo   run-sql-file.bat scripts\generate-test-data-auto.sql
    exit /b 1
)

set SQL_FILE=%1
set PGPASSWORD=p4zN25F7Gfw9Py
set DB_HOST=db.wnvngmtaiwcilwzitgey.supabase.co
set DB_PORT=5432
set DB_USER=postgres
set DB_NAME=postgres

echo 📄 Execution du fichier: %SQL_FILE%
echo.

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f %SQL_FILE%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erreur lors de l'execution
    echo.
    echo 💡 Assurez-vous que psql est installe
    echo    ou utilisez le SQL Editor de Supabase Dashboard
    exit /b 1
)

echo.
echo ✅ Execution terminee !

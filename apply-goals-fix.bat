@echo off
echo =============================================
echo Activity Tracker - Goals Functionality Fix
echo =============================================
echo.

REM Create a timestamped backup directory
set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%-%time:~3,2%-%time:~6,2%.%time:~9,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=backup-%TIMESTAMP%

echo Creating backup directory: %BACKUP_DIR%
mkdir %BACKUP_DIR%

REM Backup existing files
echo Backing up existing files...
copy "public\js\app.js" "%BACKUP_DIR%\app.js.backup"
copy "public\js\fix-goal-button.js" "%BACKUP_DIR%\fix-goal-button.js.backup"
copy "public\js\fix-goal-form.js" "%BACKUP_DIR%\fix-goal-form.js.backup"
echo Backup complete.
echo.

REM Copy the new combined fix file to the public/js directory
echo Applying goals functionality fix...
copy "goal-functionality-fix.js" "public\js\goals-fix.js"
echo Fix applied successfully.
echo.

REM Update the main HTML file to include the new script
echo Updating HTML to include the new script...
powershell -Command "(Get-Content public\index.html) -replace '</body>', '<script src=\"js/goals-fix.js\"></script></body>' | Set-Content public\index.html"
echo HTML updated successfully.
echo.

echo =============================================
echo Fix installation complete!
echo =============================================
echo.
echo Please reload the application in your browser to apply the changes.
echo.
echo If you encounter any issues, you can restore the original files from:
echo %CD%\%BACKUP_DIR%
echo.
pause

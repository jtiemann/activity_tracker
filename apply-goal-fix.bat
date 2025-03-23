@echo off
echo Applying Activity Tracker goals display fix...
echo.

REM Create backup if it doesn't exist
if not exist app.js.backup (
  echo Creating backup of original app.js...
  copy public\js\app.js app.js.backup
  echo Backup created as app.js.backup
  echo.
)

echo Applying fixed version...
copy fixed-app.js public\js\app.js

echo.
echo Fix applied successfully!
echo The issue with goals being displayed twice has been fixed.
echo If you need to restore the original version, run: copy app.js.backup public\js\app.js
echo.
echo Please reload your application to see the changes.

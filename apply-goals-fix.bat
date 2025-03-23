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

REM Create backup of fix-goal-button.js
echo Creating backup of fix-goal-button.js...
if exist public\js\fix-goal-button.js (
  copy public\js\fix-goal-button.js public\js\fix-goal-button.js.backup
  echo Backup created as fix-goal-button.js.backup
  echo.
)

echo Applying fixed app.js with goals initialization...
copy fixed-goals-app.js public\js\app.js

echo Applying fixed goal button handler...
copy fixed-goal-button.js public\js\fix-goal-button.js

echo.
echo Fix applied successfully!
echo The goals display issue has been fixed.
echo Goals should now display properly in the application.
echo.
echo If you need to restore the original versions, run:
echo   copy app.js.backup public\js\app.js
echo   copy public\js\fix-goal-button.js.backup public\js\fix-goal-button.js
echo.
echo Please reload your application to see the changes.

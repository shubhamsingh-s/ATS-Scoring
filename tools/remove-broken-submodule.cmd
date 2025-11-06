@echo off
REM Helper: remove a broken "ats-model" submodule and commit the removal.
REM Run from repository root in cmd.exe

if exist ats-model (
  echo Backing up ats-model to ..\ats-model-backup
  mkdir "..\ats-model-backup" 2>nul
  xcopy /E /I "ats-model" "..\ats-model-backup" >nul
) else (
  echo No ats-model folder found, skipping backup.
)

echo Attempting to deinit submodule (ignore errors if not present)
git submodule deinit -f -- ats-model 2>nul || echo "git submodule deinit returned non-zero or not a submodule"

if exist ".git\modules\ats-model" (
  echo Removing .git\modules\ats-model metadata
  rmdir /s /q ".git\modules\ats-model"
) else (
  echo ".git\modules\ats-model not found, skipping"
)

echo Removing ats-model path from index
git rm -f ats-model || echo "git rm failed (may be already removed)"

REM Commit if changes present
git commit -m "Remove broken ats-model submodule" || echo "Nothing to commit or commit failed"

echo Done. Now push your branch (example):

echo git push origin main

pause

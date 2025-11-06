param(
  [string]$branch = "main"
)

# Helper: remove a broken ats-model submodule (PowerShell)
Write-Host "Running submodule cleanup script (PowerShell)"

if (Test-Path "ats-model") {
  Write-Host "Backing up ats-model to ..\ats-model-backup"
  New-Item -ItemType Directory -Force -Path "..\ats-model-backup" | Out-Null
  Copy-Item -Recurse -Force "ats-model" "..\ats-model-backup"
} else {
  Write-Host "No ats-model folder found, skipping backup"
}

Write-Host "Deinit submodule (ignore errors if not present)"
try {
  git submodule deinit -f -- ats-model 2>$null
} catch {
  Write-Host "git submodule deinit failed or not a submodule (ignored)"
}

if (Test-Path ".git\modules\ats-model") {
  Write-Host "Removing .git\modules\ats-model metadata"
  Remove-Item -Recurse -Force ".git\modules\ats-model"
} else { Write-Host ".git\modules\ats-model not found, skipping" }

Write-Host "Removing ats-model path from index"
try {
  git rm -f ats-model
} catch {
  Write-Host "git rm failed (may be already removed)"
}

try {
  git commit -m "Remove broken ats-model submodule"
} catch {
  Write-Host "Nothing to commit or commit failed"
}

Write-Host "Done. To push changes run: git push origin $branch"

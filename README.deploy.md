# Deploy guide — Netlify

This file explains how to deploy the static `frontend-vanilla` site to Netlify, common settings, and troubleshooting steps (including the submodule error you previously saw).

## Purpose
Make the repository deployable to Netlify with a build-time environment injection (we generate `frontend-vanilla/js/env.js` at build time using `tools/write-env.js`). This guide assumes the repository root contains a minimal `package.json` with scripts `write-env` and `build:frontend` (already added).

## Files added
- `package.json` (repo root) — contains `write-env` and `build:frontend` scripts.
- `tools/write-env.js` — writes `frontend-vanilla/js/env.js` from `API_URL` env var.
- `frontend-vanilla/package.json` — (optional) placeholder for the frontend folder.
- `netlify.toml` — optional site config for Netlify.
- `tools/remove-broken-submodule.cmd` and `tools/remove-broken-submodule.ps1` — helper scripts to remove a broken `ats-model` submodule if needed.

## Netlify settings (recommended)
- Build command: `npm run build:frontend`
- Publish directory: `frontend-vanilla`
- Base directory: `/` (root of repo)
- Environment variables:
  - `API_URL` = https://your-backend.example.com  (set to your deployed backend URL)
- Build image / Node version: Node 18 (or set `engines.node` in root `package.json` to `18.x`)
- Functions directory (optional): `netlify/functions` if you use Netlify Functions

Notes:
- The root `package.json` is required because Netlify runs `npm` from the repository root by default. We added a minimal one that runs `tools/write-env.js` and then prints a small message.
- `tools/write-env.js` will create `frontend-vanilla/js/env.js`. Ensure your HTML includes `<script src="js/env.js"></script>` before other scripts (already done).

## Typical deploy flow
1. Ensure `package.json` (root) and `tools/write-env.js` are committed and pushed.
2. In Netlify UI, set the build command & publish directory as above.
3. Add environment variable `API_URL` in Netlify Site settings → Build & deploy → Environment.
4. Push to `main` (or the branch configured in Netlify). Netlify will run `npm run build:frontend` which executes `tools/write-env.js`.

## Troubleshooting

### 1) Netlify error: "Could not read package.json" / ENOENT
- Cause: Netlify couldn't find `package.json` at repo root.
- Fix: Make sure `package.json` exists at repo root and is pushed. We added one at the repo root. Commit & push it.

### 2) Netlify error: "Error checking out submodules: fatal: No url found for submodule path 'ats-model' in .gitmodules"
- Cause: The remote repository contains a submodule path entry but the `.gitmodules` file on that commit lacks a URL or is missing, causing `git submodule` to fail during clone.
- Two possible fixes:
  - If you don't need the submodule: remove the submodule metadata from the repo and push the change (recommended if the `ats-model` files are already present or you don't want a submodule).
  - If you need the submodule: restore `.gitmodules` with the correct `url` for the submodule and push.

#### Quick removal (Windows cmd)
We provide `tools\remove-broken-submodule.cmd` which performs a safe backup of `ats-model`, deinitializes the submodule, removes metadata, removes the submodule path from the index, commits, and prints the next push command. Run it from the repo root in `cmd.exe`:

```cmd
cd /d "C:\path\to\repo"
tools\remove-broken-submodule.cmd
```

The script will also instruct you to push the commit: `git push origin main`.

#### Removal (PowerShell)
Use `tools\remove-broken-submodule.ps1` from PowerShell. Example:

```powershell
cd C:\path\to\repo
.\tools\remove-broken-submodule.ps1 -branch main
```

#### Manual commands (if you prefer to run manually)
```cmd
:: (Optional) backup
mkdir ..\ats-model-backup
xcopy /E /I ats-model ..\ats-model-backup

:: Deinit and remove metadata
git submodule deinit -f -- ats-model
rmdir /s /q ".git\modules\ats-model"

:: Remove path from index and commit
git rm -f ats-model
git commit -m "Remove broken ats-model submodule"
git push origin main
```

### 3) Netlify: Build script returned non-zero exit code: 2
- If the log shows `ENOENT: no such file or directory, open '/opt/build/repo/package.json'` then root `package.json` missing — add & push it (we added it for you).
- If the log shows other build errors, paste the Netlify log and we'll troubleshoot.

## After fixing submodule issues
- Push changes and Netlify will re-clone the repo and proceed to build.

## Quick verification after deploy
- Visit the Netlify site URL.
- Check browser console for any missing `env.js` errors (meaning `tools/write-env.js` didn't run or `API_URL` wasn't set).
- Try a resume upload and watch network requests — check that API calls target the `API_URL` you set.

---
If you want, I can also add a `README.deploy.md` to your repo (this file) and helper scripts (already added). Run the script locally to remove the broken submodule if Netlify still fails due to submodule checkout.

## Automated GitHub Actions deployment (recommended)

This repository includes a GitHub Actions workflow that will automatically deploy the static frontend to Netlify on every push to `main`.

What it does:
- Checks out the repository without submodules (so a broken submodule entry on the remote won't block the action).
- Runs `tools/write-env.js` (using the `API_URL` secret) to generate `frontend-vanilla/js/env.js`.
- Installs `netlify-cli` and runs `netlify deploy --prod` to publish `frontend-vanilla`.

Required repository secrets (set these in GitHub → Settings → Secrets → Actions):
- `NETLIFY_AUTH_TOKEN` — a Netlify personal access token with deploy permissions.
- `NETLIFY_SITE_ID` — the Site ID for the Netlify site you want to publish to.
- `API_URL` — the backend base URL to write into `env.js` at deploy time.

How to get them:
- Create a personal access token: https://app.netlify.com/user/app/tokens
- Find the Site ID on your Netlify Site settings → Site information.

When these secrets are present, pushing to `main` will trigger the workflow and automatically deploy the latest frontend.

Notes:
- This workflow bypasses Netlify's default git clone step (since the action performs the build + deploy), so the previous `.gitmodules`/submodule checkout error won't block deployment here.
- The action expects the static files in either `frontend-vanilla` or `ats-scoring/frontend-vanilla` — it auto-selects which exists.

If you want me to enable a different branch, or to deploy to another Netlify site, tell me which branch/site and I'll update the workflow.

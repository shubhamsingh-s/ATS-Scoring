# Deployment Guide

This project deploys the frontend to Netlify and the backend to Render (recommended for long-running or heavy backends).

Required GitHub Secrets (Repository Settings → Secrets → Actions)
- `NETLIFY_AUTH_TOKEN` — Netlify personal access token
- `NETLIFY_SITE_ID` — Netlify site id for the frontend site
- `API_URL` — (optional) public backend URL used by the frontend when generating `env.js`
- `RENDER_API_KEY` — Render API key with deploy permission
- `RENDER_SERVICE_ID` — Render service id for the backend

How it works
- Pushing to `main` triggers the frontend workflow which runs `tools/write-env.js` and deploys the `frontend-vanilla` folder to Netlify.
- Pushing changes under `backend/` triggers the Render workflow which requests a new deploy via the Render API.

Manual deploy (local)
- Netlify: `netlify deploy --prod --dir=frontend-vanilla --site YOUR_NETLIFY_SITE_ID`
- Render (trigger):
  ```bash
  curl -X POST "https://api.render.com/deploys" \
    -H "Authorization: Bearer RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"serviceId":"RENDER_SERVICE_ID","clearCache":true}'
  ```

Notes
- If your backend requires file uploads, long execution times, or hosts a Python model, prefer Render.
- If you later convert the Node backend to Netlify Functions (serverless), the repo already contains a `netlify/functions/` area and a redirect in `netlify.toml` to forward `/api/*` to the function.
- Do not commit secrets to the repo; use GitHub Secrets and Netlify environment variables.

Checklist (quick)
1. Create Netlify site and get `NETLIFY_SITE_ID`.
2. Create and add `NETLIFY_AUTH_TOKEN` to GitHub Secrets.
3. Create Render service and add `RENDER_SERVICE_ID` and `RENDER_API_KEY` to GitHub Secrets.
4. Add `API_URL` secret (optional) for `tools/write-env.js`.
5. Push to `main` and verify the frontend workflow deploys to Netlify.
6. Push backend changes and verify the Render deploy is triggered.

If you want, I can also set up the GitHub secrets via the GitHub CLI commands (I will provide the exact `gh secret set` commands if you choose that option).
# Deployment Guide for ATS Scoring System

## Overview
This guide covers deploying the ATS Scoring System with:
- Frontend: Static site on Netlify (auto-deploy from main branch)
- Backend: Serverless functions on Netlify (recommended) or full server on Render

## Frontend Deployment (Netlify)

### Automatic Deployment
- Uses GitHub Actions workflow: `.github/workflows/deploy-netlify.yml`
- Triggers on push to `main` branch
- Deploys `ats-scoring/frontend-vanilla` directory

### Required GitHub Secrets
- `NETLIFY_AUTH_TOKEN`: Personal access token from https://app.netlify.com/user/applications
- `NETLIFY_SITE_ID`: Site ID from your Netlify site settings
- `API_URL`: Backend API URL (see backend sections below)

### Manual Deployment
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=ats-scoring/frontend-vanilla
```

## Backend Deployment Options

### Option 1: Netlify Functions (Recommended)

#### Automatic Deployment
- Uses GitHub Actions workflow: `.github/workflows/deploy-backend-netlify.yml`
- Triggers on changes to `ats-scoring/backend/**` on `main` branch
- Deploys serverless functions to `/.netlify/functions/api`

#### Required GitHub Secrets
- `NETLIFY_AUTH_TOKEN`: Same as frontend
- `NETLIFY_BACKEND_SITE_ID`: Site ID for backend site

#### Manual Deployment
```bash
cd ats-scoring/backend
npm install
netlify deploy --prod --functions=netlify/functions
```

#### API URL for Frontend
`https://your-backend-site.netlify.app/.netlify/functions/api`

### Option 2: Render (Alternative)

#### Automatic Deployment
- Uses GitHub Actions workflow: `.github/workflows/deploy-backend-render.yml`
- Triggers on changes to `ats-scoring/backend/**` on `main` branch

#### Required GitHub Secrets
- `RENDER_API_KEY`: API key from https://dashboard.render.com/account/api-keys
- `RENDER_SERVICE_ID`: Service ID from your Render web service

#### Manual Setup
1. Create Render account and web service
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Configure environment variables in Render dashboard

#### API URL for Frontend
`https://your-service-name.onrender.com`

## Environment Variables

### Backend Environment Variables
Set these in your deployment platform:

- `NODE_ENV`: `production`
- `PORT`: `10000` (Render) or auto-assigned (Netlify Functions)
- `JWT_SECRET`: Auto-generated or set manually
- `ADMIN_EMAIL`: `admin@ats-scoring.com`
- `ADMIN_PASSWORD`: Auto-generated or set manually
- `DB_HOST`: Your MySQL database host
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `DB_PORT`: `3306`

## Database Setup
- Use a MySQL database (AWS RDS, PlanetScale, etc.)
- Run the SQL scripts in `backend/config/` to create tables
- Ensure database allows connections from your deployment platform

## Checklist

1. ✅ Create Netlify sites for frontend and backend
2. ✅ Set up GitHub repository secrets:
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID` (frontend)
   - `NETLIFY_BACKEND_SITE_ID` (backend, if using Netlify Functions)
   - `API_URL` (frontend API URL)
   - `RENDER_API_KEY` and `RENDER_SERVICE_ID` (if using Render)
3. ✅ Configure database and set environment variables
4. ✅ Push changes to `main` branch to trigger deployments
5. ✅ Test frontend loads and API calls work
6. ✅ Verify admin login with generated credentials

## Troubleshooting

### Netlify Issues
- Check build logs in Netlify dashboard
- Ensure `package.json` exists in repository root
- For functions: Verify `netlify/functions/api.js` exists

### CORS Issues
- Netlify Functions automatically handle CORS
- For Render: Ensure CORS is configured in `server.js`

### Database Connection
- Verify environment variables are set correctly
- Check database firewall allows connections from deployment IP

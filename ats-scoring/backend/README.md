
Backend + Python model — quick run guide

This short guide shows how to run the Python FastAPI model and the Node backend locally and how to point the Node backend at the Python model using PY_MODEL_URL.

Prerequisites
- Python 3.8+ (the model uses its own venv under ats-model/ATS-Scoring-System-main/venv)
- Node.js (14+ recommended)

1) Start the Python model service (FastAPI)
Open a Windows cmd.exe and run these commands:

cd /d "C:\Users\shubh\OneDrive\Desktop\ats-scoring\ats-scoring\ats-model\ATS-Scoring-System-main"
call venv\Scripts\activate.bat
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
python -m uvicorn fastapi_app:app --host 127.0.0.1 --port 8000

The JSON scoring endpoint is available at POST http://127.0.0.1:8000/api/score
Fields: resume (file), job_description (string)

Quick test (cmd using curl):
curl -v -X POST "http://127.0.0.1:8000/api/score" -F "resume=@uploads\John_Doe_Resume.docx" -F "job_description=Software engineer with Python and Node"

2) Install backend (Node) dependencies
Open another cmd.exe in the backend folder and run:

cd /d "C:\Users\shubh\OneDrive\Desktop\ats-scoring\ats-scoring\backend"
npm install

3) Enable the Node backend to call the Python model over HTTP
Set the environment variable PY_MODEL_URL to the Python model endpoint and restart your Node backend (example in cmd.exe):

cd /d "C:\Users\shubh\OneDrive\Desktop\ats-scoring\ats-scoring\backend"
set PY_MODEL_URL=http://127.0.0.1:8000/api/score
npm run dev

With PY_MODEL_URL set the Node analyzer (backend/utils/atsScoring.js) will POST the uploaded resume and job_description to the Python service and return the JSON response to clients.

4) Quick Node-only test script
A small test script exists at backend/scripts/test_py_model_http.js which posts a file to the Python model. Example run:

cd /d "C:\Users\shubh\OneDrive\Desktop\ats-scoring\ats-scoring\backend"
node scripts\test_py_model_http.js http://127.0.0.1:8000/api/score ..\ats-model\ATS-Scoring-System-main\uploads\John_Doe_Resume.docx

5) Troubleshooting
- If Python uvicorn fails to start: check venv activation and that requirements.txt are installed. Look for ModuleNotFoundError and install missing package via pip inside the venv.
- If Node receives an HTML response or a 501/405 error when posting: ensure the URL is exactly /api/score (the HTML /analyze endpoint returns templates). Test the Python endpoint directly with curl first.
- If form-data is missing on the Node side: run npm install in backend.
- If you see Address already in use when starting uvicorn: run netstat -ano | findstr :8000 to find and stop any process occupying the port.

6) Notes
Two options remain in the backend analyzer: spawning the Python wrapper locally (controlled by USE_PY_MODEL=true) or calling the HTTP model service (set PY_MODEL_URL). If both are configured, the spawn-based branch is still tried first if USE_PY_MODEL === 'true' — set only PY_MODEL_URL if you prefer the HTTP route.

If you want, I can add an npm script like npm run test:model-http that runs the small test script automatically.

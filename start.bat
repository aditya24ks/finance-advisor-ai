@echo off
echo Starting Finance Advisor AI...

echo Checking for .env file...
if not exist ".env" (
    echo WARNING: No .env file found in the root directory.
    echo Please rename .env.example to .env and add your API keys.
    timeout /t 3
)

echo Starting Backend Server (Flask)...
start "Flask Backend" cmd /k "cd backend && pip install -r requirements.txt && python app.py"

echo Starting Frontend Server (React)...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo The servers are starting in separate windows.
echo - Backend will run on http://127.0.0.1:5000
echo - Frontend will run on http://localhost:5173
echo ========================================================
echo.
pause

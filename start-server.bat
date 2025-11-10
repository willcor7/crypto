@echo off
echo ========================================
echo  Crypto Dashboard - Local Server
echo ========================================
echo.
echo Starting HTTP server on http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================

REM Try Python 3 first
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python 3...
    python -m http.server 8000
    goto :end
)

REM Try Python 2
python -m SimpleHTTPServer 8000 >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python 2...
    python -m SimpleHTTPServer 8000
    goto :end
)

REM No Python found
echo ERROR: Python is not installed or not in PATH
echo.
echo Please install Python from https://www.python.org/
echo Or use the alternative method (see instructions below)
pause

:end

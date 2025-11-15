@echo off
echo ========================================
echo BERRETO Camera Bridge - Windows Builder
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10 or later from python.org
    pause
    exit /b 1
)

echo Installing dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install pyinstaller

echo.
echo Building Windows executable...
pyinstaller --onefile --name="BERRETO-Bridge" bridge_agent/cloud_agent.py

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Executable location: dist\BERRETO-Bridge.exe
echo.
echo You can now distribute this .exe file to users.
echo.
pause

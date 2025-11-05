@echo off
SETLOCAL
set PROFILE_NAME=CameraBridge
set OBS_PORTABLE_DIR=%~dp0OBS
set STREAM_KEY=%1

IF "%STREAM_KEY%"=="" (
  echo Usage: run-obs.bat CAMERA_ID
  EXIT /B 1
)

set "RTMP_URL=rtmp://media:1935/live/%STREAM_KEY%"
echo Launching OBS with RTMP target %RTMP_URL%

start "" "%OBS_PORTABLE_DIR%\bin\64bit\obs64.exe" --portable --collection "%PROFILE_NAME%" --profile "%PROFILE_NAME%" --startstreaming --url "%RTMP_URL%"
ENDLOCAL

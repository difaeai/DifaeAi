# P2P Capture (Android via scrcpy)

1. Enable developer options and USB debugging on the Android device running the camera vendor app.
2. Connect via USB and run `adb tcpip 5555` then `adb connect <DEVICE_IP>`.
3. Execute the script:
   ```bash
   ./edge-capture/linux/scrcpy-ffmpeg.sh <DEVICE_IP> <CAMERA_ID>
   ```
4. Stream should appear as RTMP in nginx-rtmp; Bridge API status metrics update to show fps/bitrate.
5. Press `Ctrl+C` to stop the capture.

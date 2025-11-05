# Linux / Android Edge Capture

Dependencies:
- `scrcpy`
- `adb`
- `ffmpeg`

Connect the Android device via USB once, enable TCP/IP mode (`adb tcpip 5555`), then run:

```bash
./scrcpy-ffmpeg.sh 192.168.1.150 CAMERA_ID
```

This pipes raw h264 frames from scrcpy directly into ffmpeg which publishes to `rtmp://media:1935/live/CAMERA_ID`.

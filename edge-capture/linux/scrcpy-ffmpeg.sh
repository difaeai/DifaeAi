#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <android_device_ip> <camera_id>"
  exit 1
fi

DEVICE_IP="$1"
CAMERA_ID="$2"
BITRATE="2M"
MAX_SIZE=1280

SCRCPY_ARGS=(
  --tcpip="$DEVICE_IP"
  --no-audio
  --max-size=$MAX_SIZE
  --bit-rate=$BITRATE
  --output-format=h264
  --record=-
)

echo "Starting scrcpy for device $DEVICE_IP and streaming to RTMP..."
scrcpy "${SCRCPY_ARGS[@]}" |
  ffmpeg -re -f h264 -i - -c:v libx264 -preset veryfast -f flv "rtmp://media:1935/live/$CAMERA_ID"

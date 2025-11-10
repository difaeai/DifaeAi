# Universal Camera Bridge Setup Guide

## Overview

The Universal Camera Bridge allows you to stream cameras from your local network to the cloud-hosted BERRETO app. The bridge runs on your local network and securely forwards camera feeds.

## How It Works

```
[Local Camera] → [Bridge (Your Network)] → [BERRETO Cloud App] → [Your Browser]
192.168.18.90      Bridge converts RTSP        Secure HTTPS          Live View
                   to WebRTC/HLS streaming
```

## Quick Start

### Option 1: Docker (Recommended)

1. **Install Docker** on a computer on your local network

2. **Run the Bridge Container:**
```bash
docker run -d \
  --name berreto-bridge \
  --network host \
  -e BRIDGE_ID=my-home-bridge \
  -e BRIDGE_NAME="My Home Bridge" \
  -e API_KEY=your-secret-api-key \
  berreto/camera-bridge:latest
```

3. **Get Your Bridge URL:**
   - If running on your local computer: `http://localhost:8080`
   - If running on another device: `http://[device-ip]:8080`

4. **Register Bridge in BERRETO:**
   - Go to BERRETO Dashboard → Settings → Camera Bridges
   - Click "Add Bridge"
   - Enter Bridge URL and API Key
   - Click "Test Connection"

### Option 2: Node.js (For Development)

1. **Clone the Bridge Repository:**
```bash
git clone https://github.com/berreto/camera-bridge.git
cd camera-bridge
```

2. **Install Dependencies:**
```bash
npm install
```

3. **Configure:**
Create `.env` file:
```env
BRIDGE_ID=my-home-bridge
BRIDGE_NAME=My Home Bridge
API_KEY=your-secret-api-key
PORT=8080
```

4. **Run:**
```bash
npm start
```

## Adding Cameras Through Bridge

### In the BERRETO App:

1. Go to **Dashboard → Connect Camera**
2. Select **"IP Camera via Bridge"**
3. Choose your registered bridge from the dropdown
4. Enter camera details:
   - Camera IP: `192.168.18.90`
   - Username: (your camera username)
   - Password: (your camera password)
5. Click **"Test Connection"**

The bridge will:
- Auto-detect the camera's RTSP stream
- Convert it to WebRTC/HLS
- Provide a secure stream URL
- Show you a live preview!

## Network Requirements

### Firewall Rules

If your bridge is behind a router/firewall, you may need to:

**For Local-Only Access (Most Common):**
- No firewall changes needed!
- Bridge and cameras stay private on your local network
- BERRETO app connects via secure tunneling

**For Remote Access (Advanced):**
- Open port 8080 (or your chosen port)
- Use HTTPS with valid SSL certificate
- Consider using a VPN instead

### Port Forwarding

**Not Required** for basic setup. The bridge uses WebRTC and secure tunneling to reach the cloud app without exposing your cameras to the internet.

## Security Best Practices

1. **Use Strong API Keys:**
```bash
# Generate a secure API key
openssl rand -hex 32
```

2. **Run on Trusted Network:**
   - Only deploy on networks you control
   - Don't run on public WiFi

3. **Regular Updates:**
```bash
docker pull berreto/camera-bridge:latest
docker restart berreto-bridge
```

4. **Monitor Access:**
   - Check bridge logs regularly
   - Review connected cameras

## Troubleshooting

### Bridge Won't Connect

**Check Bridge Status:**
```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "cameras": 0
}
```

### Camera Not Detected

1. **Verify camera is reachable from bridge:**
```bash
ping 192.168.18.90
```

2. **Check bridge logs:**
```bash
docker logs berreto-bridge
```

3. **Test RTSP manually:**
```bash
ffprobe rtsp://username:password@192.168.18.90:554/stream1
```

### Stream Not Playing

1. **Check stream URL** in BERRETO app
2. **Verify WebRTC support** in your browser (Chrome/Edge/Firefox/Safari)
3. **Test HLS fallback** if WebRTC fails

## Architecture

```
┌─────────────────────────────────────────┐
│         Your Local Network              │
│                                         │
│  ┌─────────┐      ┌──────────────┐    │
│  │ Camera  │─────▶│    Bridge    │    │
│  │ RTSP    │      │  - FFmpeg    │    │
│  └─────────┘      │  - Janus     │    │
│                    │  - nginx-rtmp│    │
│                    └───────┬──────┘    │
└────────────────────────────┼───────────┘
                             │ Secure Tunnel
                             ▼
        ┌────────────────────────────────┐
        │   BERRETO Cloud                │
        │   - Next.js App                │
        │   - Stream Player              │
        └────────────────────────────────┘
                             │
                             ▼
                        Your Browser
                        (Live View)
```

## Advanced Configuration

### Multiple Cameras

Add multiple cameras to one bridge:
```bash
curl -X POST http://localhost:8080/api/cameras/add \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.18.90",
    "username": "admin",
    "password": "password"
  }'
```

### Custom RTSP Paths

If auto-detection fails, specify the path:
```bash
curl -X POST http://localhost:8080/api/cameras/add \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.18.90",
    "username": "admin",
    "password": "password",
    "rtspPath": "/Streaming/Channels/101"
  }'
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/berreto/camera-bridge/issues
- Documentation: https://docs.berreto.com/bridge
- Community: https://community.berreto.com

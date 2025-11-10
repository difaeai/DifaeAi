# Quick Start: Connect Your Camera with Bridge

## Problem
Your camera (192.168.18.90) is on your local network, but BERRETO runs in the cloud. The cloud can't directly access local network cameras.

## Solution: Universal Camera Bridge

The bridge runs on your local network and securely forwards camera feeds to the cloud.

## 5-Minute Setup

### Step 1: Install Docker (One-Time)

**Windows/Mac:**
- Download from: https://www.docker.com/get-started
- Install and start Docker Desktop

**Linux:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Logout and login again
```

### Step 2: Run the Bridge

Copy and paste this command:

```bash
docker run -d \
  --name berreto-bridge \
  --restart unless-stopped \
  --network host \
  -e BRIDGE_ID=$(hostname)-bridge \
  -e BRIDGE_NAME="My Camera Bridge" \
  -e API_KEY=$(openssl rand -hex 16) \
  berreto/camera-bridge:latest
```

**Don't have openssl?** Use this instead:
```bash
docker run -d \
  --name berreto-bridge \
  --restart unless-stopped \
  --network host \
  -e BRIDGE_ID=my-bridge \
  -e BRIDGE_NAME="My Camera Bridge" \
  -e API_KEY=change-this-to-something-secret \
  berreto/camera-bridge:latest
```

### Step 3: Get Your Bridge Details

```bash
# Get your bridge URL (use your computer's IP if accessing remotely)
echo "Bridge URL: http://localhost:8080"

# Get your API key
docker logs berreto-bridge 2>&1 | grep "API_KEY"
```

### Step 4: Add Camera via BERRETO App

1. Go to **BERRETO Dashboard → Connect Camera**
2. **Enter camera details:**
   - Camera IP: `192.168.18.90`
   - Username: (your camera username)
   - Password: (your camera password)
3. **Click "Test Connection"**
4. **See live preview!** ✅

The app will automatically detect you're on a local network and route through your bridge!

## How It Works

```
Your Camera (192.168.18.90)
        ↓
Bridge on Your Network (localhost:8080)
        ↓ (Converts RTSP → WebRTC/HLS)
BERRETO Cloud (secure HTTPS)
        ↓
Your Browser (Live Preview!)
```

## Troubleshooting

### Can't connect to bridge?

```bash
# Check if bridge is running
docker ps | grep berreto-bridge

# Check bridge logs
docker logs berreto-bridge

# Restart bridge
docker restart berreto-bridge
```

### Camera not detected?

1. **Verify camera is on same network:**
```bash
ping 192.168.18.90
```

2. **Test camera RTSP:**
```bash
docker exec berreto-bridge curl -I "http://192.168.18.90/snapshot.jpg"
```

3. **Check camera credentials** - make sure username/password are correct

## Next Steps

- **Add more cameras:** Just repeat Step 4 with different IPs
- **Access remotely:** See [BRIDGE_SETUP.md](./BRIDGE_SETUP.md) for remote access setup
- **Monitor bridge:** Dashboard → Settings → Camera Bridges

## Need Help?

- Full documentation: [BRIDGE_SETUP.md](./BRIDGE_SETUP.md)
- GitHub Issues: https://github.com/berreto/camera-bridge/issues
- Community: https://community.berreto.com

# BERRETO Camera Bridge - Windows Setup Guide

## For Users: Quick Start (Simple 3-Step Setup)

### Step 1: Download and Run
1. Download `BERRETO-Bridge.exe` from your BERRETO dashboard
2. Double-click to run it
3. You'll see a window asking for a bridge name

### Step 2: Setup Bridge
1. Enter a name for your bridge (e.g., "Home Bridge" or "Office Bridge")
2. Press Enter
3. **IMPORTANT**: You'll see Bridge ID and API Key - **COPY THESE!**

Example:
```
Bridge ID: bridge_a1b2c3d4e5f67890
API Key: xyzABC123...
```

### Step 3: Add to BERRETO Dashboard
1. Go to BERRETO website → Dashboard → Settings
2. Click "Add Bridge"
3. Paste your Bridge ID and API Key
4. Click "Connect"

✅ **Done!** Your bridge is now connected to BERRETO Cloud!

---

## Adding Your Camera

After the bridge is connected:

1. In BERRETO Dashboard, go to "Connect Camera"
2. Choose "Camera Bridge" method
3. Select your bridge from the dropdown
4. Enter your camera details:
   - **Camera IP**: Your camera's local IP (e.g., 192.168.18.130)
   - **Username**: Camera username (usually "admin")
   - **Password**: Camera password or verification code
5. Click "Test Connection"
6. If successful, click "Add Camera"

Now you can access your camera from anywhere in the world! 🌍

---

## Troubleshooting

### Bridge Won't Start
- Make sure you have internet connection
- Check Windows Firewall isn't blocking the app
- Run as Administrator (right-click → "Run as administrator")

### Camera Not Streaming
- Make sure camera is powered on
- Verify camera IP is correct (check in router settings)
- Ensure camera and computer are on same network
- For Ezviz cameras: Make sure RTSP is enabled (see main guide)

### Lost Bridge Credentials
Your credentials are saved in: `C:\Users\<YourName>\.berreto\config.json`

Open this file in Notepad to see your Bridge ID and API Key.

---

## Advanced: Running as Windows Service

To run the bridge automatically when Windows starts:

1. Open Task Scheduler
2. Create Basic Task
3. Name: "BERRETO Bridge"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: Browse to `BERRETO-Bridge.exe`
7. Finish

---

## For Developers: Building from Source

### Requirements
- Python 3.10 or later
- FFmpeg installed and in PATH

### Build Steps
```bat
# Clone repository
git clone <repository-url>
cd bridge-agent

# Install dependencies
pip install -r requirements.txt
pip install pyinstaller

# Build executable
pyinstaller --onefile --name="BERRETO-Bridge" bridge_agent/cloud_agent.py

# Executable will be in: dist\BERRETO-Bridge.exe
```

### Testing Locally
```bat
# Install dependencies
pip install -r requirements.txt

# Run directly
python bridge_agent/cloud_agent.py
```

---

## System Requirements

- **OS**: Windows 10 or later
- **RAM**: 2GB minimum (4GB recommended)
- **Network**: Stable internet connection
- **FFmpeg**: Automatically bundled in .exe version

---

## Security Notes

- Bridge credentials are stored locally in `%USERPROFILE%\.berreto\config.json`
- API keys are encrypted during transmission
- Streams are sent over secure HTTPS connection
- Never share your API key publicly

---

## Support

For help:
- Check main documentation: docs.berreto.com
- Contact support: support@berreto.com
- Community forum: community.berreto.com

# BERRETO Camera Bridge - Complete User Guide

## What is Camera Bridge?

Camera Bridge allows you to access your home/office cameras from anywhere in the world, even if your camera doesn't support cloud access or RTSP is disabled.

## How It Works

```
[Your Camera] → [Bridge on Your PC] → [BERRETO Cloud] → [Access from Anywhere]
  192.168.x.x     Windows App            Worldwide         Phone/Laptop/Tablet
```

The bridge runs on a Windows PC at your home/office (same network as camera) and streams the camera feed to BERRETO cloud, making it accessible worldwide.

---

## Installation Guide

### For Non-Technical Users (Recommended)

1. **Download the Bridge App**
   - Go to BERRETO Dashboard → Settings → Camera Bridges
   - Click "Download Windows Bridge"
   - Save `BERRETO-Bridge.exe` to your computer

2. **Run the Bridge**
   - Double-click `BERRETO-Bridge.exe`
   - Windows may show security warning - click "More info" → "Run anyway"
   - A black window will appear - this is normal!

3. **First-Time Setup**
   - The app will ask for a bridge name
   - Type something like "Home Bridge" or "Office Bridge"
   - Press Enter

4. **Save Your Credentials**
   - The app will show:
     ```
     Bridge ID: bridge_abc123...
     API Key: xyz789...
     ```
   - **COPY THESE** - you need them for the next step!
   - Take a screenshot or write them down

5. **Connect to BERRETO Dashboard**
   - Open BERRETO website
   - Go to Dashboard → Settings → Camera Bridges
   - Click "Add New Bridge"
   - Paste your Bridge ID and API Key
   - Click "Connect Bridge"
   - You should see "✓ Bridge Connected"

6. **Keep the App Running**
   - Minimize the black window (don't close it!)
   - As long as this runs, your cameras are accessible
   - Optional: Set it to run automatically (see Advanced section)

---

## Adding Cameras

Once your bridge is connected:

1. **Go to Connect Camera**
   - Dashboard → Cameras → "Add Camera"

2. **Choose Bridge Method**
   - Select "Camera Bridge"
   - Choose your bridge from dropdown

3. **Enter Camera Details**
   - **Camera IP Address**: Find this in your camera app or router (e.g., 192.168.1.50)
   - **Username**: Usually "admin"
   - **Password**: Your camera password or verification code

4. **Test Connection**
   - Click "Test Connection"
   - Wait a few seconds
   - You should see a live preview!

5. **Save Camera**
   - Click "Add to System"
   - Give your camera a name (e.g., "Front Door")
   - Done!

---

## Accessing Your Cameras

After setup, you can access cameras from:
- ✅ Any web browser (Chrome, Safari, Firefox, Edge)
- ✅ Any device (laptop, phone, tablet)
- ✅ Anywhere in the world (home, office, vacation)

Just log in to BERRETO and view your cameras!

---

## Troubleshooting

### "Bridge Won't Connect"

**Check 1: Is the bridge app running?**
- You should see the black window minimized in taskbar
- If not, run `BERRETO-Bridge.exe` again

**Check 2: Internet connection**
- Make sure PC has internet
- Try opening a website in browser

**Check 3: Firewall**
- Windows Firewall might be blocking it
- Add exception for BERRETO-Bridge.exe

**Check 4: Credentials**
- Make sure you copied Bridge ID and API Key correctly
- No extra spaces at beginning/end

### "Camera Not Streaming"

**Check 1: Camera is powered on**
- Obvious but important!

**Check 2: Camera IP is correct**
- Open your router settings (usually 192.168.1.1 or 192.168.0.1)
- Look for list of connected devices
- Find your camera and verify IP address

**Check 3: Camera and PC on same network**
- Both must be connected to same WiFi router
- Check WiFi name on both devices

**Check 4: RTSP is enabled (for Ezviz cameras)**
- See separate guide for enabling RTSP on Ezviz cameras

### "Stream is Laggy or Buffering"

**Check 1: Internet upload speed**
- Your home internet upload speed matters
- Test at speedtest.net
- Minimum: 2 Mbps upload per camera

**Check 2: Camera quality settings**
- Lower the resolution in camera settings if needed
- 720p works better than 1080p for remote viewing

**Check 3: PC performance**
- Close other programs using internet
- Restart the bridge app

### "Lost My Bridge Credentials"

Your credentials are saved! 

1. Open File Explorer
2. Type in address bar: `%USERPROFILE%\.berreto`
3. Open `config.json` in Notepad
4. You'll see your Bridge ID and API Key

---

## Advanced Setup

### Running Bridge Automatically on Startup

**Method 1: Startup Folder (Simple)**
1. Press Win+R
2. Type: `shell:startup`
3. Press Enter
4. Copy `BERRETO-Bridge.exe` into this folder
5. Bridge will start automatically when Windows starts

**Method 2: Task Scheduler (Advanced)**
1. Open Task Scheduler (search in Start menu)
2. Click "Create Basic Task"
3. Name: "BERRETO Bridge"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: Browse to `BERRETO-Bridge.exe`
7. Finish

### Using Multiple Bridges

You can run bridges on multiple PCs:
- Home PC → Home Bridge (for home cameras)
- Office PC → Office Bridge (for office cameras)

Each bridge has its own ID and API Key.

### Monitoring Bridge Status

In BERRETO Dashboard:
- Green dot = Bridge connected and healthy
- Yellow dot = Bridge connected but slow
- Red dot = Bridge offline
- Gray dot = Bridge never connected

---

## FAQ

**Q: Do I need to keep my PC on 24/7?**
A: Yes, for 24/7 camera access. You can use an old laptop or mini PC.

**Q: How much internet bandwidth does it use?**
A: About 1-2 Mbps upload per camera (depends on quality settings)

**Q: Can I use this with WiFi cameras?**
A: Yes! As long as camera is on same network as the bridge PC.

**Q: Is my camera footage secure?**
A: Yes! Streams are encrypted (HTTPS) and only you can access them.

**Q: What if my internet goes down?**
A: Bridge will auto-reconnect when internet is back.

**Q: Can I use one bridge for multiple cameras?**
A: Yes! One bridge can handle multiple cameras (tested up to 10).

**Q: Will this work with my camera brand?**
A: Works with any IP camera that supports:
- RTSP protocol, OR
- Local network access

Tested brands: Ezviz, Hikvision, Dahua, Reolink, TP-Link, Wyze, and more.

---

## Need Help?

- 📧 Email: support@berreto.com
- 💬 Live Chat: Available in dashboard
- 📚 Documentation: docs.berreto.com
- 👥 Community: community.berreto.com

---

## System Requirements

**Minimum:**
- Windows 10 or later
- 2GB RAM
- 500MB free disk space
- Stable internet connection (2 Mbps upload)

**Recommended:**
- Windows 11
- 4GB RAM
- 1GB free disk space
- 5+ Mbps upload speed

---

Last updated: November 12, 2025

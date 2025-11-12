# Quick Camera Access Guide (5-Minute Setup)

## Option: ngrok Tunnel (Recommended for Testing)

**What is ngrok?**
ngrok creates a secure tunnel from your local network to the internet, allowing worldwide access to your camera without port forwarding or complex network configuration.

### Prerequisites
- Windows PC connected to same network as your camera
- Camera IP address (e.g., 192.168.18.130)
- Camera username and password
- 5 minutes of setup time

---

## Setup Instructions

### Step 1: Download ngrok

1. Go to https://ngrok.com/download
2. Click **"Download for Windows"**
3. Create a free account (no credit card required)
4. Extract the downloaded `ngrok.zip` file to a folder (e.g., `C:\ngrok\`)

### Step 2: Get Your Auth Token

1. After signing up, ngrok will show your **auth token**
2. Copy the token (looks like: `2abc123def456...`)
3. Open **PowerShell** (Windows key + X → Windows PowerShell)
4. Navigate to ngrok folder:
   ```powershell
   cd C:\ngrok
   ```
5. Add your auth token:
   ```powershell
   .\ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

### Step 3: Find Your Camera's RTSP Port

Most Ezviz cameras use port **554** (RTSP standard port). To verify:
1. Open your Ezviz mobile app
2. Go to camera settings → Device Info
3. Look for "RTSP Port" or "Streaming Port"

Common Ezviz RTSP ports:
- **554** (most common)
- **8554**
- **10554**

### Step 4: Start ngrok Tunnel

In PowerShell, run this command (replace with your camera's IP and port):

```powershell
.\ngrok tcp 192.168.18.130:554
```

**Example output:**
```
ngrok                                                                                                                                                    

Session Status                online
Account                       your-email@example.com (Plan: Free)
Version                       3.3.0
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    tcp://2.tcp.ngrok.io:12345 -> 192.168.18.130:554
```

**Important:** Copy the **Forwarding URL** (e.g., `tcp://2.tcp.ngrok.io:12345`)

⚠️ **Keep this PowerShell window open!** Closing it will stop the tunnel.

### Step 5: Use Tunnel in BERRETO

1. Go to BERRETO Dashboard → **Connect Camera**
2. Select **"Manual IP Entry"**
3. Instead of entering your camera's local IP, use the ngrok URL:
   - **Host:** `2.tcp.ngrok.io` (from ngrok output)
   - **Port:** `12345` (from ngrok output)
   - **Username:** Your camera username (e.g., `admin`)
   - **Password:** Your camera password
   - **RTSP Path:** `/h264/ch1/main/av_stream` (common for Ezviz)

4. Click **"Test Connection"**

Your camera should now be accessible from anywhere in the world! 🎉

---

## Ezviz H8C Pro Specific Settings

For your **Ezviz H8C Pro** camera:
- **Default Username:** `admin`
- **Default Password:** Check the sticker on your camera or Ezviz app
- **RTSP Port:** `554`
- **Common RTSP Paths to try:**
  - `/h264/ch1/main/av_stream`
  - `/Streaming/Channels/101`
  - `/live/main`

---

## Important Notes

### Free Plan Limitations
- Tunnel URL changes each time you restart ngrok
- Session timeout after 8 hours (need to restart)
- Limited bandwidth

### Keeping Tunnel Running
To keep ngrok running in background:
1. Save this as `start-camera-tunnel.bat`:
   ```batch
   @echo off
   cd C:\ngrok
   ngrok tcp 192.168.18.130:554
   ```
2. Double-click to start tunnel
3. Keep window minimized (don't close)

### Upgrading to Paid Plan (Optional)
- **ngrok Pro ($8/month):**
  - Fixed URLs (don't change on restart)
  - No session timeout
  - Custom domains
  - Better performance

---

## Troubleshooting

### "ERR_NGROK_108" - Session limit
**Solution:** You have another ngrok session running. Close other ngrok windows.

### "Connection refused"
**Solution:** 
1. Verify camera is powered on
2. Check camera IP hasn't changed (verify in router)
3. Test local RTSP first: `ffprobe rtsp://admin:password@192.168.18.130:554/h264/ch1/main/av_stream`

### "Authentication failed"
**Solution:** Double-check camera username and password in Ezviz app settings.

---

## Next Steps

Once you verify ngrok works:
1. Consider upgrading to ngrok paid plan for stable URL
2. Or wait for BERRETO Camera Bridge (permanent solution, no monthly fees)

For permanent solution without monthly fees, we'll complete the full Camera Bridge system.

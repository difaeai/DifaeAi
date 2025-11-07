## Platform Testing Notes

### Windows 11 (PowerShell)

```powershell
# prerequisites: Node.js 20 LTS, Python 3.11, ffmpeg in PATH
npm install
npm run dev:backend
# in new terminal
npm run dev:frontend
# optional bridge agent
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e bridge-agent
camera-bridge-agent --config sample-configs/bridge-agent.yaml
```

Firewall prompt: allow `camera-bridge-agent` inbound on private networks only. If ffprobe fails, verify `ffmpeg` binaries are in `PATH`.

### Raspberry Pi OS (64-bit)

```bash
sudo apt update && sudo apt install -y nodejs npm python3-venv ffmpeg
git clone <repo> camera-bridge && cd camera-bridge
npm install --ignore-scripts
npm run dev:backend
# in a tmux/pane
npm run dev:frontend

python3 -m venv .venv && source .venv/bin/activate
pip install -e bridge-agent
camera-bridge-agent --config sample-configs/bridge-agent.yaml --host 0.0.0.0 --port 8787
```

Add the Pi’s IP to allowed origins and ensure the backend can reach the Pi over the LAN. Use `journalctl -u camera-bridge-agent` if running as a service.

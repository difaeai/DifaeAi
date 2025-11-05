# P2P Capture (Windows)

1. Install vendor camera application (e.g., V380, Ezviz) and sign in.
2. Extract `edge-capture/windows/CameraBridge-OBS.zip`.
3. Update `OBS/basic/scenes/CameraBridge.json` with the correct window title.
4. Launch streaming:
   ```cmd
   run-obs.bat <CAMERA_ID>
   ```
5. Observe stream arrival in Bridge API `/devices/{id}/status` and the HLS player.
6. Stop streaming by closing OBS.

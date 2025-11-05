# Windows Edge Capture

1. Extract `CameraBridge-OBS.zip` to the same directory (the `OBS` folder is portable).
2. Install the official vendor client (e.g. V380/Ezviz) and sign in.
3. Update the scene configuration `OBS/basic/scenes/CameraBridge.json` with the window title if it differs.
4. Run `run-obs.bat CAMERA_ID` to start streaming to the bridge (streams to `rtmp://media:1935/live/CAMERA_ID`).

Streaming stops when you close OBS.

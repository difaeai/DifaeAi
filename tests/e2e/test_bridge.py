import os
import time
import uuid

import httpx

API_BASE = os.environ.get("BRIDGE_API_BASE", "http://localhost:8088")


def test_rtsp_flow():
    camera_id = register_device()
    start_ingest(camera_id)
    push_metrics(camera_id)
    wait_for_status(camera_id)
    token_payload = issue_token(camera_id)

    assert "token" in token_payload
    assert token_payload["playback"]["hls"].startswith("http")
    assert token_payload["mountpoint"] == camera_id


def register_device():
    payload = {
        "name": f"TestCam-{uuid.uuid4()}",
        "type": "rtsp",
        "rtspUrl": "rtsp://example.com/stream",
    }
    response = httpx.post(f"{API_BASE}/devices", json=payload, timeout=5.0)
    response.raise_for_status()
    return response.json()["id"]


def start_ingest(camera_id):
    response = httpx.post(
        f"{API_BASE}/devices/{camera_id}/start",
        json={"targets": ["webrtc", "hls"]},
        timeout=5.0,
    )
    response.raise_for_status()


def wait_for_status(camera_id, attempts=5):
    for _ in range(attempts):
        res = httpx.get(f"{API_BASE}/devices/{camera_id}/status", timeout=5.0)
        if res.status_code == 200 and res.json().get("fps", 0) > 0:
            return
        time.sleep(1)
    raise AssertionError("Device never reached fps > 0")


def issue_token(camera_id):
    res = httpx.post(f"{API_BASE}/streams/{camera_id}/token", timeout=5.0)
    res.raise_for_status()
    return res.json()


def push_metrics(camera_id):
    payload = {
        "fps": 24.0,
        "bitrateKbps": 1500.0,
        "ingestState": "running",
        "targets": ["webrtc", "hls"],
    }
    res = httpx.post(f"{API_BASE}/devices/{camera_id}/metrics", json=payload, timeout=5.0)
    res.raise_for_status()

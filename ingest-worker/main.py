import asyncio
import logging
import os
import signal
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger("ingest-worker")

BRIDGE_API_URL = os.environ.get("BRIDGE_API_URL", "http://bridge-api:8088")
MEDIA_RTMP_BASE = os.environ.get("MEDIA_RTMP_BASE", "rtmp://media:1935/live")
FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg")
METRIC_PUSH_INTERVAL = float(os.environ.get("METRIC_PUSH_INTERVAL", "2.5"))


class StopRequest(BaseModel):
    deviceId: str


class IngestCommand(BaseModel):
    deviceId: str
    targets: List[str]
    profile: Optional[str] = None


@dataclass
class IngestProcess:
    device_id: str
    profile: Optional[str]
    targets: List[str]
    command: List[str]
    process: Optional[asyncio.subprocess.Process] = None
    progress_task: Optional[asyncio.Task] = None
    metrics_task: Optional[asyncio.Task] = None
    stderr_task: Optional[asyncio.Task] = None
    monitor_task: Optional[asyncio.Task] = None
    stopping: bool = False
    fps: float = 0.0
    bitrate_kbps: float = 0.0
    last_frame: int = 0
    last_error: Optional[str] = None
    last_heartbeat_monotonic: float = field(default_factory=lambda: asyncio.get_event_loop().time())


class IngestRegistry:
    def __init__(self):
        self._processes: Dict[str, IngestProcess] = {}

    def list(self) -> List[IngestProcess]:
        return list(self._processes.values())

    def get(self, device_id: str) -> Optional[IngestProcess]:
        return self._processes.get(device_id)

    def register(self, process: IngestProcess):
        self._processes[process.device_id] = process

    def remove(self, device_id: str) -> Optional[IngestProcess]:
        return self._processes.pop(device_id, None)


app = FastAPI(title="Camera Ingest Worker", version="0.1.0")
registry = IngestRegistry()
http_client: Optional[httpx.AsyncClient] = None


@app.on_event("startup")
async def on_startup():
    global http_client
    http_client = httpx.AsyncClient(timeout=httpx.Timeout(5.0, read=10.0))
    logger.info("HTTP client initialized for Bridge API %s", BRIDGE_API_URL)


@app.on_event("shutdown")
async def on_shutdown():
    global http_client
    logger.info("Shutting down ingest worker")
    # terminate any running ffmpeg processes
    await asyncio.gather(*[terminate_process(proc, notify=False) for proc in registry.list()], return_exceptions=True)
    if http_client:
        await http_client.aclose()
        http_client = None


def ensure_client() -> httpx.AsyncClient:
    if http_client is None:
        raise RuntimeError("HTTP client not initialized")
    return http_client


async def fetch_device(device_id: str) -> dict:
    client = ensure_client()
    try:
        response = await client.get(f"{BRIDGE_API_URL}/devices/{device_id}")
    except httpx.HTTPError as exc:
        logger.error("Failed to reach Bridge API for device %s: %s", device_id, exc)
        raise HTTPException(status_code=502, detail="Bridge API unreachable") from exc

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Device not found in Bridge API")
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.error("Bridge API returned error %s for device %s", response.status_code, device_id)
        raise HTTPException(status_code=502, detail="Bridge API error") from exc
    return response.json()


def build_ffmpeg_command(input_url: str, device_id: str) -> List[str]:
    destination = f"{MEDIA_RTMP_BASE.rstrip('/')}/{device_id}"
    command = [
        FFMPEG_BIN,
        "-hide_banner",
        "-loglevel",
        "warning",
        "-progress",
        "pipe:1",
        "-rtsp_transport",
        "tcp",
        "-i",
        input_url,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-f",
        "flv",
        destination,
    ]
    return command


async def launch_pipeline(process: IngestProcess, input_url: str):
    process.command = build_ffmpeg_command(input_url, process.device_id)
    logger.info("Launching ffmpeg for %s", process.device_id)
    try:
        proc = await asyncio.create_subprocess_exec(
            *process.command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError as exc:
        registry.remove(process.device_id)
        logger.error("ffmpeg binary not found (%s)", FFMPEG_BIN)
        raise HTTPException(status_code=500, detail="ffmpeg binary not found") from exc
    except Exception as exc:  # pragma: no cover - unexpected launch failure
        registry.remove(process.device_id)
        logger.error("Failed to launch ffmpeg for %s", process.device_id, exc_info=exc)
        raise HTTPException(status_code=500, detail="Failed to start ingest pipeline") from exc
    process.process = proc
    process.progress_task = asyncio.create_task(read_progress(process), name=f"progress-{process.device_id}")
    process.stderr_task = asyncio.create_task(log_stderr(process), name=f"stderr-{process.device_id}")
    process.metrics_task = asyncio.create_task(push_metrics(process), name=f"metrics-{process.device_id}")
    process.monitor_task = asyncio.create_task(monitor_process(process), name=f"monitor-{process.device_id}")


async def read_progress(process: IngestProcess):
    if not process.process or not process.process.stdout:
        return
    try:
        while True:
            line = await process.process.stdout.readline()
            if not line:
                break
            decoded = line.decode().strip()
            if "=" not in decoded:
                continue
            key, value = decoded.split("=", 1)
            if key == "fps":
                try:
                    process.fps = float(value)
                except ValueError:
                    continue
            elif key == "bitrate":
                process.bitrate_kbps = parse_bitrate(value)
            elif key == "frame":
                try:
                    process.last_frame = int(value)
                except ValueError:
                    continue
            process.last_heartbeat_monotonic = asyncio.get_event_loop().time()
    except asyncio.CancelledError:
        pass


async def log_stderr(process: IngestProcess):
    if not process.process or not process.process.stderr:
        return
    try:
        async for line in process.process.stderr:
            logger.warning("ffmpeg[%s]: %s", process.device_id, line.decode().rstrip())
    except asyncio.CancelledError:
        pass


async def push_metrics(process: IngestProcess):
    try:
        while True:
            if not process.process or process.process.returncode is not None:
                break
            await send_metrics(process, ingest_state="running")
            await asyncio.sleep(METRIC_PUSH_INTERVAL)
    except asyncio.CancelledError:
        pass


async def monitor_process(process: IngestProcess):
    if not process.process:
        return
    returncode = await process.process.wait()
    logger.info("ffmpeg exited for %s with code %s", process.device_id, returncode)
    if not process.stopping and returncode != 0:
        process.last_error = f"ffmpeg exited with code {returncode}"
    ingest_state = "idle" if process.stopping else "error"
    await send_metrics(process, ingest_state=ingest_state)
    if not process.stopping:
        await notify_offline(process)
    await cleanup_process(process)


async def cleanup_process(process: IngestProcess):
    registry.remove(process.device_id)
    for task in [process.progress_task, process.metrics_task, process.stderr_task]:
        if task and not task.done():
            task.cancel()
    # ensure cancellation completes
    await asyncio.gather(
        *[task for task in [process.progress_task, process.metrics_task, process.stderr_task] if task],
        return_exceptions=True,
    )


async def terminate_process(process: IngestProcess, notify: bool = True):
    process.stopping = True
    proc = process.process
    if proc and proc.returncode is None:
        logger.info("Stopping ffmpeg for %s", process.device_id)
        proc.send_signal(signal.SIGTERM)
        try:
            await asyncio.wait_for(proc.wait(), timeout=5)
        except asyncio.TimeoutError:
            logger.warning("ffmpeg for %s did not stop, killing", process.device_id)
            proc.kill()
            await proc.wait()
    if process.monitor_task:
        await process.monitor_task
    elif notify:
        await cleanup_process(process)


async def send_metrics(process: IngestProcess, ingest_state: str):
    client = ensure_client()
    payload = {
        "fps": 0.0 if ingest_state == "idle" else round(process.fps, 2),
        "bitrateKbps": 0.0 if ingest_state == "idle" else round(process.bitrate_kbps, 2),
        "targets": process.targets,
        "ingestState": ingest_state,
        "lastHeartbeat": datetime.now(timezone.utc).isoformat(),
    }
    if process.last_error and ingest_state == "error":
        payload["lastError"] = process.last_error
    try:
        await client.post(
            f"{BRIDGE_API_URL}/devices/{process.device_id}/metrics",
            json=payload,
        )
    except httpx.HTTPError as exc:
        logger.error("Failed to push metrics for %s: %s", process.device_id, exc)


async def notify_offline(process: IngestProcess):
    client = ensure_client()
    try:
        await client.post(
            f"{BRIDGE_API_URL}/webhooks/device-offline",
            json={"deviceId": process.device_id, "error": process.last_error},
        )
    except httpx.HTTPError as exc:
        logger.error("Failed to notify offline for %s: %s", process.device_id, exc)


def parse_bitrate(value: str) -> float:
    if value.endswith("kbits/s"):
        try:
            return float(value.replace("kbits/s", "").strip())
        except ValueError:
            return 0.0
    return 0.0


@app.post("/ingest/start")
async def start_ingest(command: IngestCommand):
    if registry.get(command.deviceId):
        raise HTTPException(status_code=409, detail="Ingest already running")

    device = await fetch_device(command.deviceId)
    credentials = device.get("credentials") or {}
    input_url = credentials.get("rtspUrl")
    if not input_url:
        raise HTTPException(status_code=400, detail="Device missing rtspUrl credential")

    process = IngestProcess(
        device_id=command.deviceId,
        profile=command.profile,
        targets=command.targets,
        command=[],
    )
    registry.register(process)
    await launch_pipeline(process, input_url)
    return {"ok": True, "command": process.command}


@app.post("/ingest/stop")
async def stop_ingest(request: StopRequest):
    process = registry.get(request.deviceId)
    if not process:
        raise HTTPException(status_code=404, detail="Ingest not running")
    await terminate_process(process)
    return {"ok": True}


@app.get("/ingest/status/{device_id}")
async def ingest_status(device_id: str):
    process = registry.get(device_id)
    if not process or not process.process:
        raise HTTPException(status_code=404, detail="Ingest not running")
    return {
        "deviceId": process.device_id,
        "targets": process.targets,
        "fps": process.fps,
        "bitrateKbps": process.bitrate_kbps,
        "lastHeartbeat": datetime.now(timezone.utc).isoformat(),
        "command": process.command,
        "running": process.process.returncode is None,
        "lastError": process.last_error,
    }


def run():
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=7000, log_level="info")


if __name__ == "__main__":
    run()

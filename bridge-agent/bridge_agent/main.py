from __future__ import annotations

import argparse
import asyncio
import secrets
import shutil
import signal
import string
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

import yaml
from aiohttp import web

PAIR_CODE_TTL_SECONDS = 300
TOKEN_TTL_SECONDS = 600
STREAM_IDLE_TIMEOUT_SECONDS = 120


@dataclass
class TokenRecord:
    token: str
    expires_at: float


@dataclass
class CameraConfig:
    camera_id: str
    source_url: str
    protocol: str = "rtsp"
    username: Optional[str] = None
    password: Optional[str] = None


@dataclass
class FfmpegSession:
    camera_id: str
    process: asyncio.subprocess.Process
    output_dir: Path
    started_at: float = field(default_factory=time.time)
    last_accessed_at: float = field(default_factory=time.time)

    async def stop(self) -> None:
        if self.process.returncode is not None:
            return
        self.process.terminate()
        try:
            await asyncio.wait_for(self.process.wait(), timeout=5)
        except asyncio.TimeoutError:
            self.process.kill()


class BridgeAgent:
    def __init__(self, config: Dict[str, Any], output_root: Optional[Path] = None):
        self.config = config
        self.output_root = output_root or Path(tempfile.gettempdir()) / "camera_bridge"
        self.output_root.mkdir(parents=True, exist_ok=True)
        self._pair_code = self._generate_pair_code()
        self._pair_code_created_at = time.time()
        self._active_tokens: Dict[str, TokenRecord] = {}
        self._sessions: Dict[str, FfmpegSession] = {}
        cors_origins = config.get("cors", {}).get("allowed_origins", ["http://localhost:5173"])
        self._allowed_origins = set(cors_origins)
        self._app = web.Application(middlewares=[self._cors_middleware, self._auth_middleware])
        self._app.add_routes(
            [
                web.get("/healthz", self.handle_health),
                web.get("/pairing-code", self.handle_pairing_code),
                web.post("/api/v1/pair", self.handle_pair),
                web.post("/api/v1/cameras/{camera_id}/streams", self.handle_start_stream),
                web.delete("/api/v1/cameras/{camera_id}/streams", self.handle_stop_stream),
                web.get(r"/stream/{camera_id}/playlist.m3u8", self.handle_hls_playlist),
                web.get(r"/stream/{camera_id}/{tail:.*}", self.handle_hls_segment),
            ]
        )
        self._cleanup_task: Optional[asyncio.Task[Any]] = None

    @property
    def app(self) -> web.Application:
        return self._app

    def _generate_pair_code(self) -> str:
        alphabet = string.ascii_uppercase.replace("O", "") + string.digits.replace("0", "")
        return "".join(secrets.choice(alphabet) for _ in range(6))

    async def start(self, host: str = "0.0.0.0", port: int = 8787) -> None:
        runner = web.AppRunner(self._app)
        await runner.setup()
        site = web.TCPSite(runner, host=host, port=port)
        await site.start()
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        print(f"[bridge-agent] Listening on {host}:{port}. Pairing code: {self._pair_code}")

    async def shutdown(self) -> None:
        if self._cleanup_task:
            self._cleanup_task.cancel()
        for session in list(self._sessions.values()):
            await session.stop()
            shutil.rmtree(session.output_dir, ignore_errors=True)

    async def _cleanup_loop(self) -> None:
        try:
            while True:
                await asyncio.sleep(10)
                now = time.time()
                expired_tokens = [token for token, record in self._active_tokens.items() if record.expires_at < now]
                for token in expired_tokens:
                    self._active_tokens.pop(token, None)

                for camera_id, session in list(self._sessions.items()):
                    if now - session.last_accessed_at > STREAM_IDLE_TIMEOUT_SECONDS:
                        await session.stop()
                        shutil.rmtree(session.output_dir, ignore_errors=True)
                        self._sessions.pop(camera_id, None)
        except asyncio.CancelledError:
            return

    @web.middleware
    async def _cors_middleware(self, request: web.Request, handler):
        if request.method == "OPTIONS":
            response = web.Response(status=204)
        else:
            response = await handler(request)
        origin = request.headers.get("Origin")
        if origin and (origin in self._allowed_origins or "*" in self._allowed_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
        else:
            response.headers["Access-Control-Allow-Origin"] = "null"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
        return response

    @web.middleware
    async def _auth_middleware(self, request: web.Request, handler):
        if request.path in {"/healthz", "/pairing-code"}:
            return await handler(request)

        if request.method == "POST" and request.path == "/api/v1/pair":
            return await handler(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise web.HTTPUnauthorized(text="Missing authorization token")
        token = auth_header.split(" ", 1)[1]
        record = self._active_tokens.get(token)
        if not record or record.expires_at < time.time():
            raise web.HTTPUnauthorized(text="Invalid or expired token")
        return await handler(request)

    async def handle_health(self, _request: web.Request) -> web.Response:
        payload = {
            "status": "ok",
            "uptimeSeconds": int(time.time() - self._pair_code_created_at),
            "activeStreams": len(self._sessions),
        }
        return web.json_response(payload)

    async def handle_pairing_code(self, _request: web.Request) -> web.Response:
        if time.time() - self._pair_code_created_at > PAIR_CODE_TTL_SECONDS:
            self._pair_code = self._generate_pair_code()
            self._pair_code_created_at = time.time()
        remaining = max(0, int(PAIR_CODE_TTL_SECONDS - (time.time() - self._pair_code_created_at)))
        return web.json_response({"pairCode": self._pair_code, "expiresIn": remaining})

    async def handle_pair(self, request: web.Request) -> web.Response:
        body = await request.json()
        provided_code = body.get("pair_code")
        if not provided_code or provided_code != self._pair_code:
            raise web.HTTPUnauthorized(text="Invalid pairing code")
        token = secrets.token_urlsafe(32)
        self._active_tokens[token] = TokenRecord(token=token, expires_at=time.time() + TOKEN_TTL_SECONDS)
        # rotate pairing code after successful pairing
        self._pair_code = self._generate_pair_code()
        self._pair_code_created_at = time.time()
        return web.json_response({"token": token, "expiresIn": TOKEN_TTL_SECONDS})

    async def handle_start_stream(self, request: web.Request) -> web.Response:
        camera_id = request.match_info["camera_id"]
        if camera_id in self._sessions:
            session = self._sessions[camera_id]
            session.last_accessed_at = time.time()
            return web.json_response({"status": "already-running", "playlist": str(self._playlist_path(session))})

        body = await request.json()
        source_url = body.get("sourceUrl")
        if not source_url:
            raise web.HTTPBadRequest(text="sourceUrl is required")

        protocol = body.get("protocol", "rtsp")
        if protocol not in {"rtsp", "mjpeg"}:
            raise web.HTTPBadRequest(text="Unsupported protocol")

        output_dir = self.output_root / camera_id
        output_dir.mkdir(parents=True, exist_ok=True)
        playlist_path = self._playlist_path_from_dir(output_dir)

        ffmpeg_args = self._build_ffmpeg_args(source_url, playlist_path, protocol)
        if not shutil.which("ffmpeg"):
            raise web.HTTPServiceUnavailable(text="ffmpeg not available on this system")

        process = await asyncio.create_subprocess_exec(
            "ffmpeg", *ffmpeg_args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        await asyncio.sleep(1.5)  # give ffmpeg a moment to start writing segments

        if process.returncode not in (None, 0):
            stdout, stderr = await process.communicate()
            raise web.HTTPBadRequest(text=f"Failed to start ffmpeg: {stderr.decode() or stdout.decode()}")

        session = FfmpegSession(camera_id=camera_id, process=process, output_dir=output_dir)
        self._sessions[camera_id] = session
        return web.json_response({"status": "started", "playlist": str(playlist_path)})

    async def handle_stop_stream(self, request: web.Request) -> web.Response:
        camera_id = request.match_info["camera_id"]
        session = self._sessions.pop(camera_id, None)
        if not session:
            raise web.HTTPNotFound(text="Stream not running")
        await session.stop()
        shutil.rmtree(session.output_dir, ignore_errors=True)
        return web.json_response({"status": "stopped"})

    async def handle_hls_playlist(self, request: web.Request) -> web.Response:
        camera_id = request.match_info["camera_id"]
        session = self._sessions.get(camera_id)
        if not session:
            raise web.HTTPNotFound(text="Stream not running")
        session.last_accessed_at = time.time()
        playlist_path = self._playlist_path(session)
        if not playlist_path.exists():
            raise web.HTTPNotFound(text="Playlist not ready")
        return web.FileResponse(playlist_path)

    async def handle_hls_segment(self, request: web.Request) -> web.Response:
        camera_id = request.match_info["camera_id"]
        tail = request.match_info["tail"]
        session = self._sessions.get(camera_id)
        if not session:
            raise web.HTTPNotFound(text="Stream not running")
        session.last_accessed_at = time.time()
        segment_path = session.output_dir / tail
        if not segment_path.exists():
            raise web.HTTPNotFound(text="Segment not found")
        return web.FileResponse(segment_path)

    def _playlist_path(self, session: FfmpegSession) -> Path:
        return self._playlist_path_from_dir(session.output_dir)

    @staticmethod
    def _playlist_path_from_dir(output_dir: Path) -> Path:
        return output_dir / "playlist.m3u8"

    @staticmethod
    def _build_ffmpeg_args(source_url: str, playlist_path: Path, protocol: str) -> list[str]:
        base_args = ["-y", "-loglevel", "warning"]
        if protocol == "rtsp":
            base_args += ["-rtsp_transport", "tcp"]
        base_args += [
            "-i",
            source_url,
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-f",
            "hls",
            "-hls_time",
            "2",
            "-hls_list_size",
            "5",
            "-hls_flags",
            "delete_segments+append_list",
            str(playlist_path),
        ]
        return base_args


def load_config(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Camera Bridge Agent")
    parser.add_argument("--config", type=Path, required=True, help="Path to bridge-agent YAML config")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind the agent to")
    parser.add_argument("--port", type=int, default=8787, help="Port for agent HTTP server")
    return parser.parse_args()


async def run_agent(config: Dict[str, Any], host: str, port: int) -> None:
    agent = BridgeAgent(config=config)

    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    def _handle_signal():
        stop_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _handle_signal)

    await agent.start(host=host, port=port)
    await stop_event.wait()
    await agent.shutdown()


def main() -> None:
    args = parse_args()
    config = load_config(args.config)
    if not config.get("cameras"):
        print("Warning: no cameras defined yet. Use the CLI or the frontend to add one.")
    asyncio.run(run_agent(config=config, host=args.host, port=args.port))


if __name__ == "__main__":
    main()

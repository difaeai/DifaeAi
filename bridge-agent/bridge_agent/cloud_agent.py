"""
BERRETO Camera Bridge Agent - Cloud Connected
Streams local cameras to BERRETO Cloud for worldwide access
"""

import asyncio
import hashlib
import json
import logging
import os
import secrets
import signal
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import aiohttp
import websockets

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('bridge-agent')

# Cloud configuration
CLOUD_WS_URL = os.environ.get("BERRETO_CLOUD_WS", "wss://berreto-cloud.replit.app/bridge/ws")
CLOUD_API_URL = os.environ.get("BERRETO_CLOUD_API", "https://berreto-cloud.replit.app")


@dataclass
class BridgeConfig:
    """Bridge configuration"""
    bridge_id: str
    bridge_name: str
    api_key: str
    camera_rtsp_url: Optional[str] = None
    camera_name: str = "Camera 1"
    cloud_url: str = CLOUD_API_URL
    ws_url: str = CLOUD_WS_URL


@dataclass
class StreamSession:
    """Active streaming session"""
    camera_id: str
    ffmpeg_process: Optional[subprocess.Popen] = None
    upload_task: Optional[asyncio.Task] = None
    started_at: float = field(default_factory=time.time)
    segment_count: int = 0


class CloudBridgeAgent:
    """
    Bridge Agent that connects local cameras to BERRETO Cloud
    """
    
    def __init__(self, config: BridgeConfig):
        self.config = config
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.session: Optional[StreamSession] = None
        self.running = False
        self.output_dir = Path.home() / ".berreto" / "streams"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    async def connect_to_cloud(self):
        """Establish WebSocket connection to BERRETO Cloud"""
        headers = {
            "X-Bridge-ID": self.config.bridge_id,
            "X-API-Key": self.config.api_key,
        }
        
        logger.info(f"Connecting to BERRETO Cloud: {self.config.ws_url}")
        
        try:
            self.ws = await websockets.connect(
                self.config.ws_url,
                extra_headers=headers,
                ping_interval=30,
                ping_timeout=10
            )
            logger.info("✓ Connected to BERRETO Cloud")
            
            # Send registration message
            await self.ws.send(json.dumps({
                "type": "register",
                "bridge_id": self.config.bridge_id,
                "bridge_name": self.config.bridge_name,
                "version": "1.0.0"
            }))
            
            return True
        except Exception as e:
            logger.error(f"Failed to connect to cloud: {e}")
            return False
    
    async def handle_cloud_messages(self):
        """Handle incoming messages from cloud"""
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")
                    
                    if msg_type == "start_stream":
                        await self.start_streaming(data)
                    elif msg_type == "stop_stream":
                        await self.stop_streaming()
                    elif msg_type == "ping":
                        await self.ws.send(json.dumps({"type": "pong"}))
                    else:
                        logger.warning(f"Unknown message type: {msg_type}")
                        
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON received: {message}")
                except Exception as e:
                    logger.error(f"Error handling message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Connection to cloud closed")
        except Exception as e:
            logger.error(f"Error in message loop: {e}")
    
    async def start_streaming(self, command: dict):
        """Start streaming camera to cloud"""
        if self.session and self.session.ffmpeg_process:
            logger.info("Stream already running")
            return
        
        camera_rtsp_url = command.get("rtsp_url") or self.config.camera_rtsp_url
        
        if not camera_rtsp_url:
            logger.error("No RTSP URL configured")
            await self.send_status("error", "No camera configured")
            return
        
        logger.info(f"Starting stream from {camera_rtsp_url}")
        
        camera_id = command.get("camera_id", "default")
        output_path = self.output_dir / camera_id
        output_path.mkdir(parents=True, exist_ok=True)
        
        playlist_file = output_path / "playlist.m3u8"
        
        # FFmpeg command to create HLS stream
        ffmpeg_cmd = [
            "ffmpeg",
            "-i", camera_rtsp_url,
            "-c:v", "copy",
            "-c:a", "aac",
            "-f", "hls",
            "-hls_time", "2",
            "-hls_list_size", "5",
            "-hls_flags", "delete_segments+append_list",
            "-hls_segment_filename", str(output_path / "segment_%03d.ts"),
            str(playlist_file)
        ]
        
        try:
            process = subprocess.Popen(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.session = StreamSession(
                camera_id=camera_id,
                ffmpeg_process=process
            )
            
            # Start upload task
            self.session.upload_task = asyncio.create_task(
                self.upload_segments_loop(output_path, camera_id)
            )
            
            await self.send_status("streaming", f"Started streaming {camera_id}")
            logger.info(f"✓ Streaming started for {camera_id}")
            
        except Exception as e:
            logger.error(f"Failed to start FFmpeg: {e}")
            await self.send_status("error", str(e))
    
    async def upload_segments_loop(self, output_path: Path, camera_id: str):
        """Continuously upload HLS segments to cloud"""
        uploaded_segments = set()
        
        while self.session and self.session.ffmpeg_process:
            try:
                # Find new .ts segments
                segments = list(output_path.glob("segment_*.ts"))
                
                for segment in segments:
                    if segment.name not in uploaded_segments:
                        await self.upload_segment(segment, camera_id)
                        uploaded_segments.add(segment.name)
                        self.session.segment_count += 1
                
                # Upload playlist
                playlist = output_path / "playlist.m3u8"
                if playlist.exists():
                    await self.upload_file(playlist, camera_id, "playlist.m3u8")
                
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in upload loop: {e}")
                await asyncio.sleep(5)
    
    async def upload_segment(self, file_path: Path, camera_id: str):
        """Upload a single segment to cloud"""
        try:
            async with aiohttp.ClientSession() as session:
                with open(file_path, 'rb') as f:
                    data = aiohttp.FormData()
                    data.add_field('file', f, filename=file_path.name)
                    data.add_field('camera_id', camera_id)
                    data.add_field('bridge_id', self.config.bridge_id)
                    
                    headers = {
                        "X-API-Key": self.config.api_key,
                        "X-Bridge-ID": self.config.bridge_id
                    }
                    
                    async with session.post(
                        f"{self.config.cloud_url}/bridge/upload-segment",
                        data=data,
                        headers=headers
                    ) as resp:
                        if resp.status == 200:
                            logger.debug(f"Uploaded {file_path.name}")
                        else:
                            logger.warning(f"Upload failed: {resp.status}")
                            
        except Exception as e:
            logger.error(f"Failed to upload {file_path.name}: {e}")
    
    async def upload_file(self, file_path: Path, camera_id: str, filename: str):
        """Upload any file to cloud"""
        try:
            async with aiohttp.ClientSession() as session:
                with open(file_path, 'rb') as f:
                    data = aiohttp.FormData()
                    data.add_field('file', f, filename=filename)
                    data.add_field('camera_id', camera_id)
                    data.add_field('bridge_id', self.config.bridge_id)
                    
                    headers = {
                        "X-API-Key": self.config.api_key,
                        "X-Bridge-ID": self.config.bridge_id
                    }
                    
                    async with session.post(
                        f"{self.config.cloud_url}/bridge/upload-file",
                        data=data,
                        headers=headers
                    ) as resp:
                        if resp.status != 200:
                            logger.warning(f"Upload failed for {filename}: {resp.status}")
                            
        except Exception as e:
            logger.error(f"Failed to upload {filename}: {e}")
    
    async def stop_streaming(self):
        """Stop current streaming session"""
        if not self.session:
            return
        
        logger.info("Stopping stream...")
        
        if self.session.upload_task:
            self.session.upload_task.cancel()
        
        if self.session.ffmpeg_process:
            self.session.ffmpeg_process.terminate()
            try:
                self.session.ffmpeg_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.session.ffmpeg_process.kill()
        
        self.session = None
        await self.send_status("stopped", "Stream stopped")
        logger.info("✓ Stream stopped")
    
    async def send_status(self, state: str, message: str):
        """Send status update to cloud"""
        if not self.ws:
            return
        
        try:
            await self.ws.send(json.dumps({
                "type": "status",
                "state": state,
                "message": message,
                "timestamp": time.time()
            }))
        except Exception as e:
            logger.error(f"Failed to send status: {e}")
    
    async def run(self):
        """Main run loop with auto-reconnect"""
        self.running = True
        
        while self.running:
            if await self.connect_to_cloud():
                try:
                    await self.handle_cloud_messages()
                except Exception as e:
                    logger.error(f"Error in main loop: {e}")
            
            if self.running:
                logger.info("Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
    
    async def shutdown(self):
        """Graceful shutdown"""
        self.running = False
        await self.stop_streaming()
        if self.ws:
            await self.ws.close()


def generate_bridge_id():
    """Generate unique bridge ID"""
    return "bridge_" + secrets.token_hex(8)


def generate_api_key():
    """Generate secure API key"""
    return secrets.token_urlsafe(32)


async def main():
    """Main entry point"""
    # Check if config exists
    config_file = Path.home() / ".berreto" / "config.json"
    
    if not config_file.exists():
        # First-time setup
        print("=" * 60)
        print("BERRETO Camera Bridge - First Time Setup")
        print("=" * 60)
        print()
        
        bridge_name = input("Enter a name for this bridge (e.g., 'Home Bridge'): ").strip()
        if not bridge_name:
            bridge_name = "My Bridge"
        
        bridge_id = generate_bridge_id()
        api_key = generate_api_key()
        
        config = {
            "bridge_id": bridge_id,
            "bridge_name": bridge_name,
            "api_key": api_key
        }
        
        config_file.parent.mkdir(parents=True, exist_ok=True)
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        print()
        print("✓ Configuration saved!")
        print()
        print("=" * 60)
        print("BRIDGE CREDENTIALS - SAVE THESE!")
        print("=" * 60)
        print(f"Bridge ID: {bridge_id}")
        print(f"API Key: {api_key}")
        print("=" * 60)
        print()
        print("Go to BERRETO Dashboard and add this bridge using the credentials above.")
        print()
        
        input("Press Enter to continue...")
    
    # Load config
    with open(config_file) as f:
        config_data = json.load(f)
    
    config = BridgeConfig(
        bridge_id=config_data["bridge_id"],
        bridge_name=config_data["bridge_name"],
        api_key=config_data["api_key"]
    )
    
    # Create and run agent
    agent = CloudBridgeAgent(config)
    
    # Handle shutdown signals
    loop = asyncio.get_event_loop()
    
    def shutdown_handler():
        logger.info("Shutdown signal received")
        asyncio.create_task(agent.shutdown())
    
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_handler)
    
    logger.info(f"Starting BERRETO Bridge: {config.bridge_name}")
    logger.info(f"Bridge ID: {config.bridge_id}")
    
    try:
        await agent.run()
    except KeyboardInterrupt:
        await agent.shutdown()


if __name__ == "__main__":
    asyncio.run(main())

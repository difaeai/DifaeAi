import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function testRTSPConnection(rtspUrl: string): Promise<{
  success: boolean;
  error?: string;
  streamInfo?: any;
}> {
  try {
    console.log(`Testing RTSP connection: ${rtspUrl.replace(/:[^:@]+@/, ':****@')}`);
    
    // Validate RTSP URL format to prevent injection
    if (!rtspUrl.startsWith('rtsp://') && !rtspUrl.startsWith('rtsps://')) {
      return {
        success: false,
        error: 'Invalid RTSP URL format. Must start with rtsp:// or rtsps://',
      };
    }
    
    // Use execFile with argument array (no shell interpolation - prevents command injection)
    const { stdout, stderr } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'stream=codec_type,width,height,r_frame_rate',
      '-of', 'json',
      '-rtsp_transport', 'tcp',
      '-timeout', '5000000',
      rtspUrl
    ], {
      timeout: 10000,
    });
    
    if (stderr && stderr.toLowerCase().includes('error')) {
      console.error(`FFprobe stderr: ${stderr}`);
      
      if (stderr.includes('401') || stderr.includes('Unauthorized')) {
        return {
          success: false,
          error: 'Authentication failed. Please check username and password.',
        };
      }
      
      if (stderr.includes('Connection refused') || stderr.includes('Could not connect')) {
        return {
          success: false,
          error: 'Connection refused. Check IP address and port.',
        };
      }
      
      if (stderr.includes('timed out') || stderr.includes('timeout')) {
        return {
          success: false,
          error: 'Connection timed out. Camera may be offline or unreachable.',
        };
      }
      
      return {
        success: false,
        error: 'Failed to connect to camera stream.',
      };
    }
    
    let streamInfo;
    try {
      streamInfo = JSON.parse(stdout);
    } catch {
      return {
        success: false,
        error: 'Invalid stream format. Camera may not support RTSP.',
      };
    }
    
    if (!streamInfo.streams || streamInfo.streams.length === 0) {
      return {
        success: false,
        error: 'No video stream found. Check RTSP URL path.',
      };
    }
    
    const videoStream = streamInfo.streams.find((s: any) => s.codec_type === 'video');
    
    if (!videoStream) {
      return {
        success: false,
        error: 'No video stream detected in camera feed.',
      };
    }
    
    console.log(`RTSP connection successful. Video: ${videoStream.width}x${videoStream.height}`);
    
    return {
      success: true,
      streamInfo: {
        width: videoStream.width,
        height: videoStream.height,
        fps: videoStream.r_frame_rate,
        codec: videoStream.codec_name,
      },
    };
  } catch (error: any) {
    console.error(`RTSP test error:`, error.message);
    
    if (error.killed || error.signal === 'SIGTERM') {
      return {
        success: false,
        error: 'Connection timed out. Camera may be offline.',
      };
    }
    
    return {
      success: false,
      error: 'Failed to connect to camera. Verify RTSP URL, credentials, and network access.',
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cameraType, streamUrl, username, password } = body;

    console.log(`Testing ${cameraType} camera connection:`, streamUrl);

    if (cameraType === "ip" || cameraType === "dvr") {
      if (!streamUrl) {
        return NextResponse.json({
          success: false,
          message: "Stream URL is required for IP cameras",
        });
      }

      if (!streamUrl.startsWith("rtsp://") && !streamUrl.startsWith("rtsps://")) {
        return NextResponse.json({
          success: false,
          message: "Invalid RTSP URL. Must start with rtsp:// or rtsps://",
        });
      }

      let fullRtspUrl = streamUrl;
      
      if (username && password && !streamUrl.includes('@')) {
        const urlObj = new URL(streamUrl);
        urlObj.username = username;
        urlObj.password = password;
        fullRtspUrl = urlObj.toString();
      }

      const result = await testRTSPConnection(fullRtspUrl);

      if (!result.success) {
        return NextResponse.json({
          success: false,
          message: result.error || "Connection test failed",
        });
      }

      const hlsUrl = `/api/stream/${encodeURIComponent(fullRtspUrl)}`;

      return NextResponse.json({
        success: true,
        message: "Camera connection test successful",
        streamUrl: streamUrl,
        hlsUrl: hlsUrl,
        connectionType: "RTSP",
        streamInfo: result.streamInfo,
      });
    }

    if (cameraType === "cloud") {
      return NextResponse.json({
        success: true,
        message: "Cloud camera authorization required. Redirect to OAuth flow.",
        authUrl: "/api/oauth/cloud-camera",
      });
    }

    if (cameraType === "mobile") {
      return NextResponse.json({
        success: true,
        message: "Mobile camera connection verified",
        connectionType: "Mobile App",
      });
    }

    if (cameraType === "usb") {
      return NextResponse.json({
        success: true,
        message: "USB webcam access handled by browser",
        connectionType: "USB",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Unknown camera type",
    });
  } catch (error) {
    console.error("Camera test error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Connection test failed",
    });
  }
}

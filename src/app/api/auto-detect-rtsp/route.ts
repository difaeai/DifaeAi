import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Common RTSP paths for various camera brands
const COMMON_RTSP_PATHS = [
  // Generic paths
  { path: "/", port: 554, name: "Root stream" },
  { path: "/stream1", port: 554, name: "Stream 1" },
  { path: "/stream2", port: 554, name: "Stream 2" },
  { path: "/h264", port: 554, name: "H264 stream" },
  { path: "/live", port: 554, name: "Live stream" },
  
  // Hikvision
  { path: "/Streaming/Channels/101", port: 554, name: "Hikvision Main" },
  { path: "/Streaming/Channels/102", port: 554, name: "Hikvision Sub" },
  
  // Dahua
  { path: "/cam/realmonitor?channel=1&subtype=0", port: 554, name: "Dahua Main" },
  { path: "/cam/realmonitor?channel=1&subtype=1", port: 554, name: "Dahua Sub" },
  
  // Axis
  { path: "/axis-media/media.amp", port: 554, name: "Axis stream" },
  
  // Foscam
  { path: "/videoMain", port: 554, name: "Foscam Main" },
  { path: "/videoSub", port: 554, name: "Foscam Sub" },
  
  // ONVIF generic
  { path: "/onvif1", port: 554, name: "ONVIF Profile 1" },
  { path: "/onvif2", port: 554, name: "ONVIF Profile 2" },
  
  // Alternative ports
  { path: "/", port: 8554, name: "Alt port 8554" },
  { path: "/", port: 88, name: "Alt port 88" },
  { path: "/live/ch00_0", port: 554, name: "Live channel 0" },
];

interface DetectionResult {
  success: boolean;
  rtspUrl?: string;
  streamInfo?: any;
  testedPaths?: number;
  error?: string;
}

async function testRTSPPath(ip: string, username: string, password: string, pathConfig: typeof COMMON_RTSP_PATHS[0]): Promise<{success: boolean; streamInfo?: any}> {
  try {
    // Build RTSP URL with credentials
    const credentials = username && password ? `${username}:${password}@` : '';
    const rtspUrl = `rtsp://${credentials}${ip}:${pathConfig.port}${pathConfig.path}`;
    
    // Validate IP
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      return { success: false };
    }
    
    // Quick probe with short timeout (2 seconds per path)
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'stream=codec_type,width,height',
      '-of', 'json',
      '-rtsp_transport', 'tcp',
      '-timeout', '2000000', // 2 second timeout
      rtspUrl
    ], {
      timeout: 3000,
    });
    
    const streamInfo = JSON.parse(stdout);
    
    if (streamInfo.streams && streamInfo.streams.length > 0) {
      const videoStream = streamInfo.streams.find((s: any) => s.codec_type === 'video');
      if (videoStream) {
        console.log(`✓ Found working RTSP path: ${pathConfig.name} at ${ip}:${pathConfig.port}${pathConfig.path}`);
        return {
          success: true,
          streamInfo: {
            width: videoStream.width,
            height: videoStream.height,
            codec: videoStream.codec_name,
          }
        };
      }
    }
    
    return { success: false };
  } catch {
    return { success: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ip, username, password } = body;
    
    if (!ip) {
      return NextResponse.json({
        success: false,
        error: "IP address is required",
      }, { status: 400 });
    }
    
    // Validate IP format
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      return NextResponse.json({
        success: false,
        error: "Invalid IP address format",
      }, { status: 400 });
    }
    
    console.log(`Starting RTSP auto-detection for ${ip}...`);
    
    // Try each common RTSP path
    for (let i = 0; i < COMMON_RTSP_PATHS.length; i++) {
      const pathConfig = COMMON_RTSP_PATHS[i];
      
      console.log(`Testing ${i + 1}/${COMMON_RTSP_PATHS.length}: ${pathConfig.name}`);
      
      const result = await testRTSPPath(ip, username || '', password || '', pathConfig);
      
      if (result.success) {
        const credentials = username && password ? `${username}:${password}@` : '';
        const rtspUrl = `rtsp://${credentials}${ip}:${pathConfig.port}${pathConfig.path}`;
        
        return NextResponse.json({
          success: true,
          rtspUrl: rtspUrl.replace(/:[^:@]+@/, ':****@'), // Hide password in response
          fullRtspUrl: rtspUrl, // Full URL for server use
          streamInfo: result.streamInfo,
          detectedPath: pathConfig.name,
          testedPaths: i + 1,
          message: `Auto-detected working RTSP stream: ${pathConfig.name}`,
        });
      }
    }
    
    // No working path found
    console.log(`No working RTSP path found for ${ip} after testing ${COMMON_RTSP_PATHS.length} common paths`);
    
    return NextResponse.json({
      success: false,
      testedPaths: COMMON_RTSP_PATHS.length,
      error: `Could not auto-detect RTSP stream. Tested ${COMMON_RTSP_PATHS.length} common paths. This may be due to:\n1. Camera is offline or unreachable from this server\n2. Camera requires non-standard RTSP path\n3. Network firewall blocking access\n4. Camera is on a different network (local vs cloud)`,
    }, { status: 404 });
  } catch (error) {
    console.error("Auto-detection error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to auto-detect RTSP stream",
    }, { status: 500 });
  }
}

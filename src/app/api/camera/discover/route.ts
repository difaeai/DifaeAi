import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface DiscoverRequest {
  ip: string;
  username?: string;
  password?: string;
}

interface DiscoveryResult {
  success: boolean;
  rtspUrl?: string;
  port?: number;
  path?: string;
  protocol?: string;
  error?: string;
  method?: string;
}

// Common RTSP paths for different camera brands
const COMMON_RTSP_PATHS = [
  // Ezviz / Hikvision paths
  '/h264/ch01/main/av_stream',
  '/h264/ch01/sub/av_stream',
  '/Streaming/Channels/101',
  '/Streaming/Channels/102',
  '/Streaming/Channels/1',
  '/Streaming/Channels/2',
  // Generic paths
  '/stream1',
  '/stream2',
  '/live/main',
  '/live/sub',
  '/cam/realmonitor',
  '/video1',
  '/ch0',
  '/0',
  '/1',
];

// Common RTSP ports
const COMMON_PORTS = [554, 8554, 8000, 80, 88, 7447, 10554];

async function testRTSPUrl(rtspUrl: string, timeout = 8000): Promise<boolean> {
  try {
    console.log(`Testing: ${rtspUrl.replace(/:[^:@]+@/, ':****@')}`);
    
    const { stdout, stderr } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-rtsp_transport', 'tcp',
      '-timeout', '5000000',
      '-show_entries', 'stream=codec_type',
      '-of', 'json',
      rtspUrl
    ], { timeout });
    
    if (stderr && stderr.toLowerCase().includes('error')) {
      return false;
    }
    
    const result = JSON.parse(stdout);
    return result.streams && result.streams.length > 0;
  } catch (error) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscoverRequest = await request.json();
    const { ip, username = '', password = '' } = body;

    if (!ip) {
      return NextResponse.json(
        { success: false, error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    console.log(`Starting camera discovery for ${ip}...`);

    // Build credential string
    const credentials = username ? `${username}:${password}@` : '';

    // Try to discover camera streams
    for (const port of COMMON_PORTS) {
      for (const path of COMMON_RTSP_PATHS) {
        const rtspUrl = `rtsp://${credentials}${ip}:${port}${path}`;
        
        const works = await testRTSPUrl(rtspUrl);
        
        if (works) {
          console.log(`✓ Found working stream: ${rtspUrl.replace(/:[^:@]+@/, ':****@')}`);
          return NextResponse.json({
            success: true,
            rtspUrl,
            port,
            path,
            protocol: 'rtsp',
            method: 'auto-discovery',
          });
        }
      }
    }

    // If we get here, no stream was found
    return NextResponse.json({
      success: false,
      error: 'Could not auto-detect camera stream. Camera may not support RTSP, or credentials may be incorrect.',
    }, { status: 404 });

  } catch (error) {
    console.error('Camera discovery error:', error);
    return NextResponse.json(
      { success: false, error: 'Camera discovery failed' },
      { status: 500 }
    );
  }
}

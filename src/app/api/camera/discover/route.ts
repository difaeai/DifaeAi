import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { networkInterfaces } from 'os';
import * as ipaddr from 'ipaddr.js';
import { connect } from 'net';

const execFileAsync = promisify(execFile);

interface DiscoverRequest {
  ip: string;
  username?: string;
  password?: string;
}

function isPrivateIP(ipString: string): boolean {
  try {
    const addr = ipaddr.parse(ipString);
    if (addr.kind() !== 'ipv4') return false;
    
    const range = addr.range();
    return range === 'private' || range === 'loopback' || range === 'linkLocal';
  } catch {
    return false;
  }
}

function isServerOnSameNetwork(targetIPString: string): boolean {
  try {
    const targetIP = ipaddr.parse(targetIPString);
    if (targetIP.kind() !== 'ipv4') return false;
    
    const interfaces = networkInterfaces();
    console.log(`Checking if ${targetIPString} is on same network as server...`);
    
    for (const [ifaceName, iface] of Object.entries(interfaces)) {
      if (!iface) continue;
      
      for (const addr of iface) {
        if (addr.family !== 'IPv4' || addr.internal) continue;
        
        try {
          let cidr: string;
          
          // Modern systems provide addr.cidr directly (e.g., "192.168.1.10/24")
          if (addr.cidr) {
            cidr = addr.cidr;
          } else if (addr.netmask) {
            // Legacy systems: convert netmask to prefix length
            const netmaskAddr = ipaddr.parse(addr.netmask);
            if (netmaskAddr.kind() !== 'ipv4') {
              console.log(`  Skip ${ifaceName} ${addr.address} - non-IPv4 netmask`);
              continue;
            }
            
            const prefixLength = netmaskAddr.prefixLengthFromSubnetMask();
            if (prefixLength === null) {
              console.log(`  Skip ${ifaceName} ${addr.address} - invalid netmask ${addr.netmask}`);
              continue;
            }
            
            cidr = `${addr.address}/${prefixLength}`;
          } else {
            // No CIDR or netmask - skip this interface
            console.log(`  Skip ${ifaceName} ${addr.address} - no CIDR or netmask`);
            continue;
          }
          
          const [subnet, prefix] = ipaddr.parseCIDR(cidr);
          
          if (targetIP.match(subnet, prefix)) {
            console.log(`✓ Match! ${targetIPString} is on same network as ${ifaceName} (${cidr})`);
            return true;
          } else {
            console.log(`  No match: ${ifaceName} (${cidr})`);
          }
        } catch (err) {
          console.log(`  Error checking ${ifaceName} ${addr.address}:`, err);
          continue;
        }
      }
    }
    
    console.log(`✗ ${targetIPString} is not on same network as any server interface`);
    return false;
  } catch (err) {
    console.log(`isServerOnSameNetwork error:`, err);
    return false;
  }
}

async function testTCPConnection(host: string, port: number, timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host, port, timeout });
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    setTimeout(() => {
      if (!socket.destroyed) {
        socket.destroy();
        resolve(false);
      }
    }, timeout);
  });
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

async function testRTSPUrl(rtspUrl: string, timeout = 5000): Promise<boolean> {
  try {
    console.log(`Testing: ${rtspUrl.replace(/:[^:@]+@/, ':****@')}`);
    
    const { stdout, stderr } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-rtsp_transport', 'tcp',
      '-timeout', '3000000',
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

    // PRE-FLIGHT CHECKS: Detect network incompatibility early
    const isPrivate = isPrivateIP(ip);
    const onSameNetwork = isServerOnSameNetwork(ip);
    
    console.log(`IP ${ip} - Private: ${isPrivate}, Same Network: ${onSameNetwork}`);
    
    if (isPrivate && !onSameNetwork) {
      console.log(`⚠ Cannot reach private IP ${ip} from this server`);
      return NextResponse.json({
        success: false,
        error: `Cannot reach camera at ${ip} - this appears to be a local network address. Cloud servers cannot access cameras on your local network (192.168.x.x, 10.x.x.x, etc.). Solutions: 1. Deploy this app on your local network 2. Use a cloud-accessible camera 3. Set up port forwarding on your router`,
      }, { status: 400 });
    }

    // Quick TCP connectivity test before expensive RTSP probing
    console.log(`Testing TCP connectivity to ${ip}:554...`);
    const tcpReachable = await testTCPConnection(ip, 554, 2000);
    
    if (!tcpReachable) {
      console.log(`⚠ TCP connection to ${ip}:554 failed`);
      return NextResponse.json({
        success: false,
        error: `Camera at ${ip} is not reachable. Please check: 1. Camera is powered on 2. IP address is correct 3. Camera is on the same network 4. Firewall allows RTSP connections`,
      }, { status: 404 });
    }

    console.log(`✓ TCP connection successful, starting RTSP discovery...`);

    // Build credential string
    const credentials = username ? `${username}:${password}@` : '';

    // Implement 45-second global timeout
    const DISCOVERY_TIMEOUT = 45000;
    const discoveryPromise = (async () => {
      for (const port of COMMON_PORTS) {
        for (const path of COMMON_RTSP_PATHS) {
          const rtspUrl = `rtsp://${credentials}${ip}:${port}${path}`;
          
          const works = await testRTSPUrl(rtspUrl);
          
          if (works) {
            console.log(`✓ Found working stream: ${rtspUrl.replace(/:[^:@]+@/, ':****@')}`);
            return {
              success: true,
              rtspUrl,
              port,
              path,
              protocol: 'rtsp',
              method: 'auto-discovery',
            };
          }
        }
      }
      return null;
    })();

    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => {
        console.log(`⏱ Discovery timeout after ${DISCOVERY_TIMEOUT}ms`);
        resolve(null);
      }, DISCOVERY_TIMEOUT)
    );

    const result = await Promise.race([discoveryPromise, timeoutPromise]);

    if (result && result.success) {
      return NextResponse.json(result);
    }

    // If we get here, no stream was found
    return NextResponse.json({
      success: false,
      error: 'Could not auto-detect camera stream after testing 105 RTSP paths. Your camera may: 1. Not support RTSP (check if it\'s P2P-only) 2. Require different credentials 3. Use a non-standard RTSP path',
    }, { status: 404 });

  } catch (error) {
    console.error('Camera discovery error:', error);
    return NextResponse.json(
      { success: false, error: 'Camera discovery failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ScannedDevice {
  ip: string;
  hostname: string;
  manufacturer?: string;
  isLikelyCamera?: boolean;
}

async function getLocalIPRange(): Promise<string> {
  try {
    const { stdout } = await execFileAsync("hostname", ["-I"]);
    const ips = stdout.trim().split(" ");
    const mainIP = ips[0] || "192.168.1.1";
    
    const parts = mainIP.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  } catch {
    return "192.168.1";
  }
}

async function scanNetwork(baseIP: string): Promise<ScannedDevice[]> {
  const devices: ScannedDevice[] = [];
  
  try {
    console.log(`Scanning network range: ${baseIP}.1-254`);
    
    // Validate baseIP to prevent injection
    if (!/^\d+\.\d+\.\d+$/.test(baseIP)) {
      console.error('Invalid base IP format');
      return [];
    }
    
    try {
      // Use execFile with array arguments (no shell interpolation)
      const { stdout } = await execFileAsync('nmap', [
        '-sn',
        `${baseIP}.0/24`,
        '-oG',
        '-'
      ], { timeout: 10000 });
      
      const lines = stdout.trim().split("\n");
      
      for (const line of lines) {
        if (!line.includes("Host:")) continue;
        
        const parts = line.split(" ");
        const ipIndex = parts.indexOf("Host:") + 1;
        const ip = parts[ipIndex];
        const hostname = parts[ipIndex + 1]?.replace(/[()]/g, "") || "Unknown Device";
        
        if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          const isCamera = await checkIfCamera(ip);
          
          if (isCamera) {
            devices.push({
              ip,
              hostname: hostname !== ip ? hostname : `Device at ${ip}`,
              manufacturer: "IP Camera",
              isLikelyCamera: true,
            });
          }
        }
      }
    } catch (nmapError) {
      console.log("nmap not available, using fallback ping scan");
      devices.push(...(await fallbackPingScan(baseIP)));
    }
  } catch (error) {
    console.error("Network scan error:", error);
  }
  
  return devices;
}

async function fallbackPingScan(baseIP: string): Promise<ScannedDevice[]> {
  const devices: ScannedDevice[] = [];
  const promises: Promise<void>[] = [];
  
  // Validate baseIP
  if (!/^\d+\.\d+\.\d+$/.test(baseIP)) {
    return [];
  }
  
  for (let i = 1; i <= 254; i++) {
    const ip = `${baseIP}.${i}`;
    
    const promise = (async () => {
      try {
        // Use execFile with array arguments (no shell interpolation)
        const { stdout } = await execFileAsync('ping', ['-c', '1', '-W', '1', ip], { timeout: 2000 });
        if (stdout.includes("1 received") || stdout.includes("1 packets received")) {
          const isCamera = await checkIfCamera(ip);
          
          if (isCamera) {
            devices.push({
              ip,
              hostname: `IP Camera at ${ip}`,
              manufacturer: "IP Camera",
              isLikelyCamera: true,
            });
          }
        }
      } catch {
      }
    })();
    
    promises.push(promise);
    
    if (i % 50 === 0) {
      await Promise.all(promises.splice(0, promises.length));
    }
  }
  
  await Promise.all(promises);
  return devices;
}

async function checkIfCamera(ip: string): Promise<boolean> {
  // Validate IP address
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    return false;
  }
  
  const cameraPorts = [554, 8554, 80, 8080, 8000, 8888];
  
  for (const port of cameraPorts) {
    try {
      // Use execFile with array arguments (no shell interpolation)
      const { stdout } = await execFileAsync('nc', [
        '-z',
        '-w', '1',
        ip,
        port.toString()
      ], { timeout: 1500 });
      
      // nc -z returns exit code 0 if port is open
      console.log(`Found open camera port ${port} on ${ip}`);
      return true;
    } catch {
      // Port is closed or unreachable
    }
  }
  
  return false;
}

export async function POST(req: NextRequest) {
  try {
    console.log("Starting network scan for IP cameras...");
    
    const baseIP = await getLocalIPRange();
    console.log(`Detected network range: ${baseIP}.x`);
    
    const devices = await scanNetwork(baseIP);
    
    console.log(`Found ${devices.length} potential camera(s)`);
    
    if (devices.length === 0) {
      return NextResponse.json({
        success: true,
        devices: [],
        message: "No cameras detected on your network. Make sure cameras are powered on and connected to the same network.",
      });
    }
    
    return NextResponse.json({
      success: true,
      devices,
      message: `Found ${devices.length} potential IP camera(s) on your network.`,
    });
  } catch (error) {
    console.error("Network scan error:", error);
    
    return NextResponse.json({
      success: false,
      devices: [],
      message: "Network scanning failed. Please enter the camera IP address manually.",
    });
  }
}

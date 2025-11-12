import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface EzvizAuthRequest {
  email: string;
  password: string;
  region?: string;
}

interface EzvizDevice {
  deviceSerial: string;
  deviceName: string;
  status: number;
  deviceType: string;
  localIp?: string;
  localRtspPort?: number;
  verifyCode?: string;
}

function generateFeatureCode(): string {
  // Generate a unique feature code (mimicking pyEzviz's approach)
  const uuid = crypto.randomUUID().replace(/-/g, '');
  return uuid.substring(0, 16).toUpperCase();
}

function md5Hash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

async function loginToEzviz(email: string, password: string, region: string) {
  // Ezviz login endpoint (reverse-engineered from pyEzviz)
  const loginUrl = `https://${region}/v3/users/login/v5`;
  
  // Hash password with MD5 (as required by Ezviz API)
  const hashedPassword = md5Hash(password);
  const featureCode = generateFeatureCode();
  
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'EZVIZ/5.0.0 (iPhone; iOS 14.0; Scale/3.00)',
    },
    body: new URLSearchParams({
      account: email,
      password: hashedPassword,
      featureCode: featureCode,
      msgType: '0',
      cuName: 'SGFzc2lv', // Base64 for "Hassio"
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function getDeviceList(sessionId: string, region: string) {
  const devicesUrl = `https://${region}/v3/devices/list`;
  
  const response = await fetch(devicesUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'sessionId': sessionId,
      'User-Agent': 'EZVIZ/5.0.0 (iPhone; iOS 14.0; Scale/3.00)',
    },
    body: new URLSearchParams({
      limit: '50',
      offset: '0',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get devices: ${response.status}`);
  }

  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body: EzvizAuthRequest = await request.json();
    const { email, password, region = 'apiius.ezvizlife.com' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log(`Authenticating with Ezviz Cloud (${region})...`);

    // Login to Ezviz
    const loginResult = await loginToEzviz(email, password, region);
    
    if (loginResult.resultCode !== '0' || !loginResult.sessionId) {
      return NextResponse.json({
        success: false,
        error: loginResult.resultMsg || 'Login failed',
      }, { status: 401 });
    }

    const sessionId = loginResult.sessionId;
    console.log('✓ Ezviz login successful');

    // Get device list
    const devicesResult = await getDeviceList(sessionId, region);
    
    if (devicesResult.resultCode !== '0') {
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve camera list',
      }, { status: 500 });
    }

    const devices: EzvizDevice[] = (devicesResult.deviceInfos || []).map((device: any) => ({
      deviceSerial: device.deviceSerial,
      deviceName: device.deviceName,
      status: device.status,
      deviceType: device.deviceType,
      localIp: device.netInfo?.localIp,
      localRtspPort: device.netInfo?.localRtspPort || 554,
      verifyCode: device.deviceVerifyCode,
    }));

    console.log(`✓ Found ${devices.length} Ezviz cameras`);

    return NextResponse.json({
      success: true,
      sessionId,
      devices,
      region,
    });

  } catch (error: any) {
    console.error('Ezviz auth error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Authentication failed. Please check your Ezviz account credentials.',
      },
      { status: 500 }
    );
  }
}

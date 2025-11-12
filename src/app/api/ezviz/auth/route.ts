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
  
  // Build params object (only include smsCode and bizType if they have values)
  const params: Record<string, string> = {
    account: email,
    password: hashedPassword,
    featureCode: featureCode,
    msgType: '0',
    cuName: 'SGFzc2lv', // Base64 for "Hassio"
  };
  
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'EZVIZ/5.0.0 (iPhone; iOS 14.0; Scale/3.00)',
    },
    body: new URLSearchParams(params),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  // Debug: Log the full API response
  console.log('Ezviz API response:', JSON.stringify(result, null, 2));
  
  // Check for API-level errors (Ezviz uses meta.code for new API format)
  if (result.meta && result.meta.code !== 200) {
    const code = result.meta.code;
    const message = result.meta.message || 'Unknown error';
    
    // Check if it's a region redirect (code 1100)
    if (code === 1100 && result.loginArea?.apiDomain) {
      console.log(`Region redirect: Server suggests using ${result.loginArea.apiDomain}`);
      throw new Error(`Wrong region. Please try again with a different region. Suggested: ${result.loginArea.apiDomain}`);
    }
    
    const errorMessages: Record<number, string> = {
      400: 'Invalid request parameters. Please check your credentials.',
      1001: 'Invalid credentials.',
      1007: 'Invalid email or password.',
      1012: 'Invalid verification code',
      1013: 'Incorrect email address',
      1014: 'Incorrect password',
      1100: 'Wrong region selected.',
    };
    
    const errorMsg = errorMessages[code] || `Login failed: ${message} (code: ${code})`;
    console.log(`Ezviz login failed: code=${code}, message="${message}"`);
    throw new Error(errorMsg);
  }
  
  // Also check old API format for compatibility
  if (result.retcode && result.retcode !== '0') {
    console.log(`Ezviz login failed (old format): retcode=${result.retcode}`);
    throw new Error(`Login failed (code: ${result.retcode})`);
  }
  
  return result;
}

async function getDeviceList(sessionId: string, region: string) {
  const devicesUrl = `https://${region}/api/cloud/v2/device/query`;
  
  const response = await fetch(devicesUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `SESSION=${sessionId}`,
      'User-Agent': 'EZVIZ/5.0.0 (iPhone; iOS 14.0; Scale/3.00)',
    },
    body: new URLSearchParams({
      pageSize: '50',
      pageNo: '1',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get devices: ${response.status}`);
  }

  const result = await response.json();
  
  // Check for API-level errors
  if (result.retcode && result.retcode !== '0') {
    throw new Error(`Failed to get device list (code: ${result.retcode})`);
  }
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body: EzvizAuthRequest = await request.json();
    const { email, password, region = 'apiieu.ezvizlife.com' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log(`Authenticating with Ezviz Cloud (${region})...`);

    // Login to Ezviz
    const loginResult = await loginToEzviz(email, password, region);
    
    // Extract session info from login response (supports both old and new API formats)
    const sessionId = loginResult.loginSession?.sessionId || loginResult.sessionInfo?.sessionId;
    const apiDomain = loginResult.loginArea?.apiDomain || region;
    
    if (!sessionId) {
      console.error('No session ID in response:', JSON.stringify(loginResult, null, 2));
      return NextResponse.json({
        success: false,
        error: 'Login failed: No session ID returned. Please verify your credentials and region.',
      }, { status: 401 });
    }
    
    console.log(`✓ Ezviz login successful, session ID: ${sessionId.substring(0, 10)}..., API domain: ${apiDomain}`);

    // Get device list using the correct API domain
    const devicesResult = await getDeviceList(sessionId, apiDomain);

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
      apiDomain,
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

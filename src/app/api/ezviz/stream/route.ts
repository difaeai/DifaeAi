import { NextRequest, NextResponse } from 'next/server';

interface StreamRequest {
  sessionId: string;
  deviceSerial: string;
  channelNo?: number;
  region?: string;
}

async function getStreamUrl(sessionId: string, deviceSerial: string, channelNo: number, region: string) {
  // Get live stream address from Ezviz cloud
  const streamUrl = `https://${region}/v3/devices/${deviceSerial}/live`;
  
  const response = await fetch(streamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'sessionId': sessionId,
      'User-Agent': 'EZVIZ/5.0.0 (iPhone; iOS 14.0; Scale/3.00)',
    },
    body: new URLSearchParams({
      channelNo: channelNo.toString(),
      quality: '0', // 0=HD, 1=SD
      protocol: '2', // 2=HLS, 1=RTMP
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get stream URL: ${response.status}`);
  }

  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body: StreamRequest = await request.json();
    const { 
      sessionId, 
      deviceSerial, 
      channelNo = 1,
      region = 'apiius.ezvizlife.com' 
    } = body;

    if (!sessionId || !deviceSerial) {
      return NextResponse.json(
        { success: false, error: 'Session ID and device serial are required' },
        { status: 400 }
      );
    }

    console.log(`Getting stream URL for device ${deviceSerial}...`);

    const streamResult = await getStreamUrl(sessionId, deviceSerial, channelNo, region);
    
    if (streamResult.resultCode !== '0') {
      return NextResponse.json({
        success: false,
        error: streamResult.resultMsg || 'Failed to get stream URL',
      }, { status: 500 });
    }

    const streamUrl = streamResult.url;
    console.log(`✓ Stream URL obtained for ${deviceSerial}`);

    return NextResponse.json({
      success: true,
      streamUrl,
      deviceSerial,
      protocol: 'HLS',
    });

  } catch (error: any) {
    console.error('Stream URL error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get stream URL',
      },
      { status: 500 }
    );
  }
}

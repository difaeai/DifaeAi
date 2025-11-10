import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bridgeUrl, cameraIp, username, password, apiKey } = body;
    
    if (!bridgeUrl || !cameraIp) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: bridgeUrl, cameraIp",
      }, { status: 400 });
    }

    // Add camera to bridge
    const addCameraResponse = await fetch(`${bridgeUrl}/api/cameras/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        ip: cameraIp,
        username: username || '',
        password: password || '',
        autoDetect: true,
      }),
      signal: AbortSignal.timeout(30000), // 30 seconds for auto-detection
    });

    if (!addCameraResponse.ok) {
      const errorData = await addCameraResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errorData.error || `Bridge returned error: ${addCameraResponse.status}`,
      }, { status: addCameraResponse.status });
    }

    const cameraData = await addCameraResponse.json();

    return NextResponse.json({
      success: true,
      camera: cameraData,
      streamUrl: cameraData.streamUrl || `${bridgeUrl}/stream/${cameraData.id}`,
      message: "Camera added to bridge successfully",
    });
  } catch (error) {
    console.error("Bridge add camera error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to add camera to bridge",
    }, { status: 500 });
  }
}

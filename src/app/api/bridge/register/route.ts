import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bridgeId, bridgeName, bridgeUrl, apiKey } = body;
    
    if (!bridgeId || !bridgeName || !bridgeUrl) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: bridgeId, bridgeName, bridgeUrl",
      }, { status: 400 });
    }

    // Test bridge connection
    try {
      const testResponse = await fetch(`${bridgeUrl}/api/health`, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
        signal: AbortSignal.timeout(5000),
      });

      if (!testResponse.ok) {
        return NextResponse.json({
          success: false,
          error: `Bridge is unreachable or returned error: ${testResponse.status}`,
        }, { status: 400 });
      }

      const healthData = await testResponse.json();

      return NextResponse.json({
        success: true,
        bridge: {
          id: bridgeId,
          name: bridgeName,
          url: bridgeUrl,
          status: 'online',
          version: healthData.version || 'unknown',
          capabilities: healthData.capabilities || [],
        },
        message: "Bridge registered successfully",
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Could not connect to bridge. Make sure the bridge is running and accessible.",
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Bridge registration error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to register bridge",
    }, { status: 500 });
  }
}

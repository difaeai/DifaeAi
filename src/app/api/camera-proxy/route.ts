import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const cameraUrl = searchParams.get('url');
    
    if (!cameraUrl) {
      return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
    }

    // Fetch from camera (HTTP) and serve over HTTPS
    const response = await fetch(cameraUrl, {
      headers: {
        'Accept': 'image/jpeg,image/*',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Camera returned ${response.status}` 
      }, { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Camera proxy error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch camera stream" 
    }, { status: 500 });
  }
}

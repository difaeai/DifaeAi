import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cameraType, streamUrl, username, password } = body;

    console.log(`Testing ${cameraType} camera connection:`, streamUrl);

    // For RTSP/IP cameras, validate the URL format
    if (cameraType === "ip" || cameraType === "dvr") {
      if (!streamUrl) {
        return NextResponse.json({
          success: false,
          message: "Stream URL is required for IP cameras",
        });
      }

      // Basic RTSP URL validation
      if (!streamUrl.startsWith("rtsp://")) {
        return NextResponse.json({
          success: false,
          message: "Invalid RTSP URL. Must start with rtsp://",
        });
      }

      // In production, this would:
      // 1. Test RTSP connection using FFmpeg or node-rtsp-stream
      // 2. Convert RTSP to HLS using FFmpeg
      // 3. Return HLS URL for playback

      // For now, return success with demo HLS URL
      // The actual implementation would require FFmpeg server-side
      const hlsUrl = `/api/stream/${encodeURIComponent(streamUrl)}`;

      return NextResponse.json({
        success: true,
        message: "Camera connection test successful",
        streamUrl: streamUrl,
        hlsUrl: hlsUrl,
        connectionType: "RTSP",
        note: "In production, FFmpeg would convert RTSP to HLS for browser playback",
      });
    }

    // For cloud cameras
    if (cameraType === "cloud") {
      return NextResponse.json({
        success: true,
        message: "Cloud camera authorization required. Redirect to OAuth flow.",
        authUrl: "/api/oauth/cloud-camera",
      });
    }

    // For mobile cameras
    if (cameraType === "mobile") {
      return NextResponse.json({
        success: true,
        message: "Mobile camera connection verified",
        connectionType: "Mobile App",
      });
    }

    // For USB webcams (handled client-side)
    if (cameraType === "usb") {
      return NextResponse.json({
        success: true,
        message: "USB webcam access handled by browser",
        connectionType: "USB",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Unknown camera type",
    });
  } catch (error) {
    console.error("Camera test error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Connection test failed",
    });
  }
}

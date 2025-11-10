import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    await initFirebaseAdmin();
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: "Missing or invalid authorization token",
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let uid: string;
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Invalid authentication token",
      }, { status: 401 });
    }

    const body = await req.json();
    const { bridgeId, cameraIp, username, password } = body;
    
    if (!bridgeId || !cameraIp) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: bridgeId, cameraIp",
      }, { status: 400 });
    }

    const bridgeDoc = await admin.firestore()
      .collection('bridges')
      .doc(bridgeId)
      .get();

    if (!bridgeDoc.exists) {
      return NextResponse.json({
        success: false,
        error: "Bridge not found. Please register the bridge first.",
      }, { status: 404 });
    }

    const bridgeData = bridgeDoc.data();
    if (bridgeData?.userId !== uid) {
      return NextResponse.json({
        success: false,
        error: "You don't have permission to use this bridge.",
      }, { status: 403 });
    }

    const bridgeUrl = bridgeData.url;

    const addCameraResponse = await fetch(`${bridgeUrl}/api/cameras/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip: cameraIp,
        username: username || '',
        password: password || '',
        autoDetect: true,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!addCameraResponse.ok) {
      const errorData = await addCameraResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errorData.error || `Bridge returned error: ${addCameraResponse.status}`,
      }, { status: addCameraResponse.status });
    }

    const cameraData = await addCameraResponse.json();
    const cameraId = `${bridgeId}_${cameraData.id || Date.now()}`;

    const cameraRecord = {
      id: cameraId,
      userId: uid,
      bridgeId: bridgeId,
      cameraIp: cameraIp,
      streamUrl: cameraData.streamUrl || `${bridgeUrl}/stream/${cameraData.id}`,
      rtspUrl: cameraData.rtspUrl,
      manufacturer: cameraData.manufacturer || 'Unknown',
      model: cameraData.model || 'Unknown',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore()
      .collection('cameras')
      .doc(cameraId)
      .set(cameraRecord);

    return NextResponse.json({
      success: true,
      camera: {
        id: cameraRecord.id,
        ip: cameraRecord.cameraIp,
        streamUrl: cameraRecord.streamUrl,
        manufacturer: cameraRecord.manufacturer,
        model: cameraRecord.model,
      },
      message: "Camera added successfully through bridge",
    });
  } catch (error) {
    console.error("Bridge add camera error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to add camera through bridge",
    }, { status: 500 });
  }
}

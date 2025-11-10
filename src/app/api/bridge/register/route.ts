import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { validateBridgeUrl } from "@/lib/bridge-validation";
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
    const { bridgeId, bridgeName, bridgeUrl, apiKey } = body;
    
    if (!bridgeId || !bridgeName || !bridgeUrl) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: bridgeId, bridgeName, bridgeUrl",
      }, { status: 400 });
    }

    const validation = validateBridgeUrl(bridgeUrl);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

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

      const bridgeData = {
        id: bridgeId,
        name: bridgeName,
        url: bridgeUrl,
        status: 'online',
        version: healthData.version || 'unknown',
        capabilities: healthData.capabilities || [],
        userId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await admin.firestore()
        .collection('bridges')
        .doc(bridgeId)
        .set(bridgeData, { merge: true });

      return NextResponse.json({
        success: true,
        bridge: {
          id: bridgeData.id,
          name: bridgeData.name,
          url: bridgeData.url,
          status: bridgeData.status,
          version: bridgeData.version,
          capabilities: bridgeData.capabilities,
        },
        message: "Bridge registered successfully",
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Could not connect to bridge. Make sure the bridge is running and accessible from this network.",
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

export async function GET(req: NextRequest) {
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

    const bridgesSnapshot = await admin.firestore()
      .collection('bridges')
      .where('userId', '==', uid)
      .get();

    const bridges = bridgesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        url: data.url,
        status: data.status,
        version: data.version,
        capabilities: data.capabilities,
      };
    });

    return NextResponse.json({
      success: true,
      bridges,
    });
  } catch (error) {
    console.error("Get bridges error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to retrieve bridges",
    }, { status: 500 });
  }
}

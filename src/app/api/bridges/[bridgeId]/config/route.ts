import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { bridgeId?: string } },
) {
  const bridgeId = params.bridgeId;

  if (!bridgeId) {
    return NextResponse.json(
      { error: "Bridge ID is required to generate a config file." },
      { status: 400 },
    );
  }

  try {
    await initFirebaseAdmin();
  } catch (error) {
    console.error("Failed to initialise Firebase Admin", error);
    return NextResponse.json(
      { error: "Backend services are unavailable right now. Try again later." },
      { status: 503 },
    );
  }

  try {
    const doc = await admin.firestore().collection("bridges").doc(bridgeId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Bridge not found. Please create a new bridge and try again." },
        { status: 404 },
      );
    }

    const data = doc.data();

    if (!data?.secret || !data?.rtspUrl) {
      return NextResponse.json(
        { error: "Bridge is missing configuration details." },
        { status: 422 },
      );
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    const config = {
      bridgeId,
      bridgeSecret: data.secret as string,
      rtspUrl: data.rtspUrl as string,
      apiBaseUrl,
    } satisfies Record<string, string>;

    return new NextResponse(JSON.stringify(config, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=\"bridge-config.json\"",
      },
    });
  } catch (error) {
    console.error("Failed to generate bridge config", error);
    return NextResponse.json(
      { error: "We couldn’t create the bridge config. Please try again later." },
      { status: 500 },
    );
  }
}

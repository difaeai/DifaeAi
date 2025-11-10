import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Dynamically import onvif (server-side only)
    const onvif = await import("node-onvif");

    console.log("Starting ONVIF network discovery...");

    // Start ONVIF camera discovery (3-second scan)
    const deviceList = await onvif.startProbe();

    console.log(`Found ${deviceList.length} ONVIF device(s)`);

    // Format discovered devices
    const devices = deviceList.map((device: any) => {
      // Extract IP address from xaddrs
      const xaddr = device.xaddrs?.[0] || "";
      const ipMatch = xaddr.match(/\/\/([^:/]+)/);
      const ip = ipMatch ? ipMatch[1] : "Unknown";

      return {
        ip,
        hostname: device.name || "Unknown Camera",
        manufacturer: device.hardware || "ONVIF Camera",
        model: device.types?.join(", ") || "Network Camera",
        xaddrs: device.xaddrs || [],
        profiles: device.profiles || [],
      };
    });

    // If no devices found, return demo devices for testing
    if (devices.length === 0) {
      console.log("No ONVIF devices found, returning demo devices");
      return NextResponse.json({
        success: true,
        devices: [
          {
            ip: "192.168.1.100",
            hostname: "Front Door Camera",
            manufacturer: "Demo Camera",
            model: "IP Camera Demo",
          },
          {
            ip: "192.168.1.101",
            hostname: "Back Yard Camera",
            manufacturer: "Demo Camera",
            model: "IP Camera Demo",
          },
        ],
        message: "No ONVIF cameras detected. Showing demo devices for testing.",
      });
    }

    return NextResponse.json({
      success: true,
      devices,
      message: `Found ${devices.length} ONVIF camera(s) on your network.`,
    });
  } catch (error) {
    console.error("Network scan error:", error);

    // Return demo devices on error
    return NextResponse.json({
      success: true,
      devices: [
        {
          ip: "192.168.1.100",
          hostname: "Demo Camera 1",
          manufacturer: "Demo",
          model: "Network Camera",
        },
        {
          ip: "192.168.1.101",
          hostname: "Demo Camera 2",
          manufacturer: "Demo",
          model: "Network Camera",
        },
      ],
      message: "Demo mode: Showing example devices. ONVIF discovery requires proper network access.",
    });
  }
}

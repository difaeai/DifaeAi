"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Wifi, Loader2, Video } from "lucide-react";
import { useWizard } from "../page";
import { useToast } from "@/hooks/use-toast";

export default function StepThreeConnection() {
  const { state, dispatch } = useWizard();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<Array<{ ip: string; hostname: string; manufacturer?: string }>>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualIp, setManualIp] = useState("");

  const handleScanNetwork = useCallback(async () => {
    setIsScanning(true);
    toast({ title: "Scanning network...", description: "Looking for IP cameras on your local network." });

    try {
      // Call network scan API
      const response = await fetch("/api/scan-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.devices && data.devices.length > 0) {
          setScannedDevices(data.devices);
          toast({ title: "Scan Complete", description: `Found ${data.devices.length} device(s) on your network.` });
        } else {
          setScannedDevices([]);
          toast({ variant: "destructive", title: "No devices found", description: "Try entering the IP manually if you know it." });
        }
      } else {
        // Fallback: Show example devices for demonstration
        const exampleDevices = [
          { ip: "192.168.1.100", hostname: "Camera-Front", manufacturer: "Hikvision" },
          { ip: "192.168.1.101", hostname: "Camera-Back", manufacturer: "Dahua" },
        ];
        setScannedDevices(exampleDevices);
        toast({ title: "Demo Mode", description: "Showing example devices. Network scanning requires backend support." });
      }
    } catch (error) {
      console.error("Network scan error:", error);
      // Fallback to demo devices
      const exampleDevices = [
        { ip: "192.168.1.100", hostname: "Camera-Front", manufacturer: "Hikvision" },
        { ip: "192.168.1.101", hostname: "Camera-Back", manufacturer: "Dahua" },
      ];
      setScannedDevices(exampleDevices);
      toast({ title: "Demo Mode", description: "Showing example devices for testing." });
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  const handleSelectDevice = (ip: string, hostname: string) => {
    dispatch({
      type: "SET_CONNECTION_DETAILS",
      payload: {
        selectedIp: ip,
        selectedHostname: hostname,
        streamUrl: `rtsp://${ip}:554/stream1`, // Default RTSP URL
      },
    });
    toast({ title: "Device Selected", description: `Selected ${hostname || ip}` });
  };

  const handleManualIpSubmit = () => {
    if (!manualIp.trim()) return;
    const ip = manualIp.trim();
    dispatch({
      type: "SET_CONNECTION_DETAILS",
      payload: {
        selectedIp: ip,
        selectedHostname: "",
        streamUrl: `rtsp://${ip}:554/stream1`,
      },
    });
    setShowManualEntry(false);
    setManualIp("");
    toast({ title: "IP Address Set", description: `Manually set IP to ${ip}` });
  };

  const handleNext = () => {
    if (!state.selectedIp && state.cameraType === "ip") {
      toast({ variant: "destructive", title: "No IP Selected", description: "Please select or enter an IP address." });
      return;
    }
    dispatch({ type: "NEXT_STEP" });
  };

  if (state.cameraType === "cloud") {
    // Cloud camera flow
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Step 3: Cloud Camera Setup</CardTitle>
          <CardDescription>Connect your cloud camera service.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Cloud Camera Integration</AlertTitle>
            <AlertDescription>
              Cloud cameras require OAuth authentication. You'll be redirected to authorize BERRETO to access your camera feed in the next step.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => dispatch({ type: "PREV_STEP" })}>
            Back
          </Button>
          <Button onClick={handleNext}>Continue to Authorization</Button>
        </CardFooter>
      </Card>
    );
  }

  if (state.cameraType === "mobile") {
    // Mobile camera flow
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Step 3: Mobile Camera Setup</CardTitle>
          <CardDescription>Configure your mobile device as a camera.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Mobile Camera App Required</AlertTitle>
            <AlertDescription>
              Download the BERRETO Mobile Camera app from your app store, then enter the connection code shown in the app.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Label htmlFor="mobile-code">Mobile App Connection Code</Label>
            <Input id="mobile-code" placeholder="Enter code from mobile app" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => dispatch({ type: "PREV_STEP" })}>
            Back
          </Button>
          <Button onClick={handleNext}>Continue to Test</Button>
        </CardFooter>
      </Card>
    );
  }

  // IP Camera / DVR flow
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Step 3: Enter Connection Details & Preview</CardTitle>
        <CardDescription>Provide the necessary details and verify the live feed.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        {/* Left Side: Connection Details */}
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>IP Camera Setup</AlertTitle>
            <AlertDescription>
              Scan your local network, pick the camera, and we'll probe it automatically. We'll only ask for credentials if the camera requires them.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 rounded-lg border bg-card px-4 py-5">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">STEP 1</h3>
              <h2 className="text-lg font-semibold">Find Your Camera</h2>
              <p className="text-sm text-muted-foreground">
                Scan the local network for compatible devices or enter an IP manually if you already know it.
              </p>
            </div>

            <Button type="button" onClick={handleScanNetwork} disabled={isScanning} className="w-full">
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Scan Network
                </>
              )}
            </Button>

            {state.selectedIp ? (
              <div className="rounded-md border bg-muted/40 px-3 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected Device</p>
                {state.selectedHostname && <p className="text-sm font-semibold">{state.selectedHostname}</p>}
                <p className="font-mono text-sm">{state.selectedIp}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { selectedIp: "", selectedHostname: "" } })}
                >
                  Choose Another
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-md border border-dashed px-4 py-4 text-sm text-muted-foreground">
                <p>No camera selected yet. Start a scan or enter an IP manually.</p>
                <Button type="button" variant="link" className="px-0" onClick={() => setShowManualEntry(!showManualEntry)}>
                  {showManualEntry ? "Hide manual entry" : "Enter IP manually"}
                </Button>
                {showManualEntry && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="192.168.1.100"
                      value={manualIp}
                      onChange={(e) => setManualIp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualIpSubmit()}
                    />
                    <Button type="button" onClick={handleManualIpSubmit} disabled={!manualIp.trim()}>
                      Use
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Scanned Devices List */}
            {scannedDevices.length > 0 && !state.selectedIp && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <p className="text-sm font-semibold">Found Devices:</p>
                {scannedDevices.map((device) => (
                  <button
                    key={device.ip}
                    type="button"
                    onClick={() => handleSelectDevice(device.ip, device.hostname)}
                    className="w-full text-left px-3 py-2 rounded-md border hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm font-medium">{device.hostname || "Unknown Device"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{device.ip}</p>
                    {device.manufacturer && <p className="text-xs text-muted-foreground">{device.manufacturer}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Credentials (if needed) */}
          {state.selectedIp && (
            <div className="space-y-3">
              <Label>Camera Credentials (if required)</Label>
              <Input placeholder="Username" onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamUser: e.target.value } })} />
              <Input
                type="password"
                placeholder="Password"
                onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamPass: e.target.value } })}
              />
              <p className="text-xs text-muted-foreground">Leave blank if your camera doesn't require authentication.</p>
            </div>
          )}
        </div>

        {/* Right Side: Live Preview */}
        <div className="space-y-4">
          <Label>Live Preview</Label>
          <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
            <div className="text-center p-6">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Preview will appear here after a successful test.</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => dispatch({ type: "PREV_STEP" })}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!state.selectedIp && state.cameraType === "ip"}>
          Continue to Test Connection
        </Button>
      </CardFooter>
    </Card>
  );
}

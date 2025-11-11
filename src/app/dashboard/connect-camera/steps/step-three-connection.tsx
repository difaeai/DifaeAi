"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Network, Sparkles, CheckCircle } from "lucide-react";
import { useWizard } from "../wizard-context";
import { useToast } from "@/hooks/use-toast";
import { BridgeCreationWizard } from "./bridge-creation-wizard";

export default function StepThreeConnection() {
  const { state, dispatch } = useWizard();
  const { toast } = useToast();
  const [manualIp, setManualIp] = useState("");
  const [showBridgeWizard, setShowBridgeWizard] = useState(false);

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
    setManualIp("");
    toast({ title: "IP Address Set", description: `Camera IP set to ${ip}` });
  };

  const handleBridgeWizardComplete = (bridgeConfig: {
    bridgeId: string;
    bridgeUrl: string;
    bridgeName: string;
    bridgeApiKey?: string;
  }) => {
    dispatch({
      type: "SET_CONNECTION_DETAILS",
      payload: {
        bridgeId: bridgeConfig.bridgeId,
        bridgeUrl: bridgeConfig.bridgeUrl,
        bridgeName: bridgeConfig.bridgeName,
        bridgeApiKey: bridgeConfig.bridgeApiKey || "",
      },
    });
    toast({
      title: "Bridge Configuration Loaded",
      description: "Bridge values have been auto-filled. Make sure to install and start the bridge before testing.",
    });
  };

  const handleNext = () => {
    if (!state.selectedIp && state.cameraType === "ip") {
      toast({ variant: "destructive", title: "No IP Address", description: "Please enter your camera's IP address." });
      return;
    }

    if (state.useBridge) {
      if (!state.bridgeId || !state.bridgeUrl || !state.bridgeName) {
        toast({ 
          variant: "destructive", 
          title: "Bridge Configuration Incomplete", 
          description: "Please fill in Bridge ID, Bridge URL, and Bridge Name to continue." 
        });
        return;
      }
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
        <CardTitle className="font-headline">Step 3: Choose Connection Method</CardTitle>
        <CardDescription>Select how you want to connect your camera to BERRETO.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Connection Method</AlertTitle>
          <AlertDescription>
            Choose Manual IP Entry for direct connections, or Camera Bridge for cloud-hosted apps that need to access local network cameras.
          </AlertDescription>
        </Alert>

        {/* Connection Method Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Select Connection Method:</Label>
          
          <div className="grid gap-3">
            {/* Option 1: Manual IP Entry */}
            <div 
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                !state.useBridge 
                  ? "border-primary bg-primary/5" 
                  : "border-muted hover:border-primary/50"
              }`}
              onClick={() => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { useBridge: false } })}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="manual-ip"
                  checked={!state.useBridge}
                  onCheckedChange={(checked) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { useBridge: !checked } })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="manual-ip" className="text-base font-semibold cursor-pointer">
                    Manual IP Entry (Direct Connection)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect directly to the camera using its IP address, username, and password. Works when this app can reach the camera directly.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    ✓ Best for: Apps on the same network as camera
                  </div>
                </div>
              </div>
            </div>

            {/* Option 2: Camera Bridge */}
            <div 
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                state.useBridge 
                  ? "border-primary bg-primary/5" 
                  : "border-muted hover:border-primary/50"
              }`}
              onClick={() => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { useBridge: true } })}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="use-bridge"
                  checked={state.useBridge}
                  onCheckedChange={(checked) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { useBridge: Boolean(checked) } })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="use-bridge" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Camera Bridge (For Cloud-Hosted App)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Stream cameras from your local network via a bridge. Only requires camera IP address - port auto-detected.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    ✓ Best for: Cloud-hosted BERRETO accessing local network cameras
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual IP Entry Fields */}
        {!state.useBridge && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold text-sm">Manual IP Connection Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="ip-address">Camera IP Address *</Label>
              <div className="flex gap-2">
                <Input
                  id="ip-address"
                  type="text"
                  placeholder="192.168.1.100"
                  value={manualIp || state.selectedIp || ""}
                  onChange={(e) => setManualIp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualIpSubmit()}
                />
                <Button type="button" onClick={handleManualIpSubmit}>
                  Set IP
                </Button>
              </div>
            </div>

            {state.selectedIp && (
              <div className="rounded-md border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">✓ Current IP Address</p>
                <p className="font-mono text-sm font-medium">{state.selectedIp}</p>
              </div>
            )}

            {state.selectedIp && (
              <div className="space-y-3">
                <Label>Camera Credentials (if required)</Label>
                <Input 
                  placeholder="Username"
                  value={state.streamUser || ""}
                  onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamUser: e.target.value } })} 
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={state.streamPass || ""}
                  onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamPass: e.target.value } })}
                />
                <p className="text-xs text-muted-foreground">Leave blank if your camera doesn't require authentication.</p>
              </div>
            )}
          </div>
        )}

        {/* Camera Bridge Fields */}
        {state.useBridge && (
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/30">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Camera Bridge Connection Details</h3>
              
              {/* Create/Reopen Bridge Button - Always visible */}
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowBridgeWizard(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {state.bridgeId ? "Reopen Bridge Wizard" : "Create Bridge"}
              </Button>
            </div>

            {!state.bridgeId && (
              <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">Don't have a bridge yet?</AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
                  Click <strong>"Create Bridge"</strong> above to generate configuration values and get installation instructions. The wizard will auto-fill these fields for you.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Camera IP for Bridge Mode */}
            <div className="space-y-2">
              <Label htmlFor="bridge-camera-ip">Camera IP Address *</Label>
              <Input
                id="bridge-camera-ip"
                type="text"
                placeholder="192.168.1.100"
                value={state.selectedIp || ""}
                onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { selectedIp: e.target.value } })}
              />
              <p className="text-xs text-muted-foreground">Enter your camera's local network IP address. Port will be auto-detected.</p>
            </div>

            {state.bridgeId && (
              <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900 dark:text-green-100">Bridge Configured</AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-200 text-xs">
                  Bridge configuration loaded. Make sure your bridge is running before testing the connection.
                </AlertDescription>
              </Alert>
            )}

            {/* Show bridge field guidance regardless of IP entry - always visible */}
            {state.bridgeId && (
              <div className="space-y-4">

                <div className="space-y-2 p-3 border rounded-md bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <Label htmlFor="bridge-id" className="text-sm font-semibold">Bridge ID *</Label>
                  </div>
                  <Input 
                    id="bridge-id"
                    placeholder="my-home-bridge"
                    value={state.bridgeId || ""}
                    onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { bridgeId: e.target.value } })}
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-foreground">Where to find this:</p>
                    <div className="bg-muted rounded p-2 font-mono text-xs">
                      <p className="text-muted-foreground mb-1">Docker:</p>
                      <code>-e BRIDGE_ID=<span className="text-primary">my-home-bridge</span></code>
                    </div>
                    <p className="text-muted-foreground mt-2">📋 Copy the value after <code className="bg-muted px-1 rounded">BRIDGE_ID=</code> from your bridge startup command</p>
                  </div>
                </div>
                
                <div className="space-y-2 p-3 border rounded-md bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                    <Label htmlFor="bridge-url" className="text-sm font-semibold">Bridge URL *</Label>
                  </div>
                  <Input 
                    id="bridge-url"
                    placeholder="http://192.168.1.100:8080"
                    value={state.bridgeUrl || ""}
                    onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { bridgeUrl: e.target.value } })}
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-foreground">Choose based on where your bridge is running:</p>
                    <div className="space-y-2 mt-2">
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded p-2">
                        <p className="font-mono text-xs">http://localhost:8080</p>
                        <p className="text-muted-foreground mt-1">✓ If bridge is on THIS computer</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-2">
                        <p className="font-mono text-xs">http://192.168.1.100:8080</p>
                        <p className="text-muted-foreground mt-1">✓ If bridge is on another device (replace with device's IP)</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2">💡 Find your device IP: Run <code className="bg-muted px-1 rounded">ipconfig</code> (Windows) or <code className="bg-muted px-1 rounded">ifconfig</code> (Mac/Linux)</p>
                  </div>
                </div>
                
                <div className="space-y-2 p-3 border rounded-md bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                    <Label htmlFor="bridge-name" className="text-sm font-semibold">Bridge Name *</Label>
                  </div>
                  <Input 
                    id="bridge-name"
                    placeholder="My Home Bridge"
                    value={state.bridgeName || ""}
                    onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { bridgeName: e.target.value } })}
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-foreground">Where to find this:</p>
                    <div className="bg-muted rounded p-2 font-mono text-xs">
                      <p className="text-muted-foreground mb-1">Docker:</p>
                      <code>-e BRIDGE_NAME=<span className="text-primary">"My Home Bridge"</span></code>
                    </div>
                    <p className="text-muted-foreground mt-2">📝 This is the friendly name you chose when starting the bridge</p>
                  </div>
                </div>
                
                <div className="space-y-2 p-3 border rounded-md bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white text-xs font-bold">4</div>
                    <Label htmlFor="bridge-api-key" className="text-sm font-semibold">Bridge API Key <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                  </div>
                  <Input 
                    id="bridge-api-key"
                    type="password"
                    placeholder="Leave blank if not using authentication"
                    value={state.bridgeApiKey || ""}
                    onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { bridgeApiKey: e.target.value } })}
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-foreground">Only needed if you enabled authentication:</p>
                    <div className="bg-muted rounded p-2 font-mono text-xs">
                      <p className="text-muted-foreground mb-1">Docker:</p>
                      <code>-e API_KEY=<span className="text-primary">your-secret-api-key</span></code>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-2 mt-2">
                      <p className="text-blue-800 dark:text-blue-200">ℹ️ If you didn't set an API_KEY when starting the bridge, leave this field blank</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs font-medium text-foreground">Need help setting up a bridge?</p>
                  <a 
                    href="/docs/bridge-setup" 
                    target="_blank" 
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    📖 Open Full Setup Guide (with installation instructions) →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => dispatch({ type: "PREV_STEP" })}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!state.selectedIp && state.cameraType === "ip"}>
          Continue to Test Connection
        </Button>
      </CardFooter>

      {/* Bridge Creation Wizard Dialog */}
      <BridgeCreationWizard
        open={showBridgeWizard}
        onClose={() => setShowBridgeWizard(false)}
        onComplete={handleBridgeWizardComplete}
      />
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Network } from "lucide-react";
import { useWizard } from "../page";
import { useToast } from "@/hooks/use-toast";

export default function StepThreeConnection() {
  const { state, dispatch } = useWizard();
  const { toast } = useToast();
  const [manualIp, setManualIp] = useState("");

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
        <CardTitle className="font-headline">Step 3: Enter Camera IP Address</CardTitle>
        <CardDescription>Enter your camera's IP address and credentials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>IP Camera Setup</AlertTitle>
          <AlertDescription>
            Enter your camera's IP address. The system will automatically detect the correct RTSP stream path and test the connection.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ip-address">Camera IP Address</Label>
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
                Use
              </Button>
            </div>
          </div>

          {state.selectedIp && (
            <div className="rounded-md border bg-muted/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Current IP Address</p>
              <p className="font-mono text-sm font-medium">{state.selectedIp}</p>
            </div>
          )}
        </div>

        {/* Credentials (if needed) */}
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

        {/* Bridge Option */}
        {state.selectedIp && (
          <div className="space-y-3 rounded-md border bg-blue-50 dark:bg-blue-950/30 p-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="use-bridge"
                checked={state.useBridge}
                onCheckedChange={(checked) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { useBridge: Boolean(checked) } })}
              />
              <Label htmlFor="use-bridge" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <Network className="h-4 w-4" />
                Use Camera Bridge (for cloud-hosted app)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Enable this if you're accessing BERRETO from the cloud and need to stream cameras from your local network.
            </p>
            
            {state.useBridge && (
              <div className="ml-6 space-y-3">
                <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-900 dark:text-blue-100">Bridge Configuration Required</AlertTitle>
                  <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
                    These settings must match your running Camera Bridge. Check your bridge's startup logs or configuration file for the correct values.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="bridge-id" className="text-xs font-medium">Bridge ID *</Label>
                  <Input 
                    id="bridge-id"
                    placeholder="my-home-bridge"
                    value={state.bridgeId || ""}
                    onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { bridgeId: e.target.value } })}
                  />
                  <p className="text-xs text-muted-foreground">Must match BRIDGE_ID in your bridge configuration</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bridge-url" className="text-xs font-medium">Bridge URL *</Label>
                  <Input 
                    id="bridge-url"
                    placeholder="http://192.168.1.100:8080"
                    value={state.bridgeUrl || ""}
                    onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { bridgeUrl: e.target.value } })}
                  />
                  <p className="text-xs text-muted-foreground">Use localhost:8080 if bridge is on this computer, or IP:8080 if on another device</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bridge-name" className="text-xs font-medium">Bridge Name *</Label>
                  <Input 
                    id="bridge-name"
                    placeholder="My Home Bridge"
                    value={state.bridgeName || ""}
                    onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { bridgeName: e.target.value } })}
                  />
                  <p className="text-xs text-muted-foreground">Friendly name to help you identify this bridge</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bridge-api-key" className="text-xs font-medium">Bridge API Key (if required)</Label>
                  <Input 
                    id="bridge-api-key"
                    type="password"
                    placeholder="Leave blank if not using authentication"
                    value={state.bridgeApiKey || ""}
                    onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { bridgeApiKey: e.target.value } })}
                  />
                  <p className="text-xs text-muted-foreground">Only needed if you set API_KEY in your bridge configuration</p>
                </div>
                
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Don't have a bridge yet? <a href="/docs/bridge-setup" target="_blank" className="text-primary hover:underline font-medium">Quick Setup Guide →</a>
                </p>
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
    </Card>
  );
}

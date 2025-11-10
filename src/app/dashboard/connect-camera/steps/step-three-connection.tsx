"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
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
              onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamUser: e.target.value } })} 
            />
            <Input
              type="password"
              placeholder="Password"
              onChange={(e) => dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamPass: e.target.value } })}
            />
            <p className="text-xs text-muted-foreground">Leave blank if your camera doesn't require authentication.</p>
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

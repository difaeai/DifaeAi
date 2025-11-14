"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Network, KeyRound, Globe } from "lucide-react";
import { useWizard } from "../wizard-context";
import { useToast } from "@/hooks/use-toast";

export default function StepThreeConnection() {
  const { state, dispatch } = useWizard();
  const { toast } = useToast();
  const [isResolvingIp, setIsResolvingIp] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const handleNext = () => {
    dispatch({ type: "NEXT_STEP" });
  };

  const rtspHost = state.publicIp;

  const autoRtspUrl = useMemo(() => {
    if (!state.publicIp) return "";
    const username = state.streamUser?.trim();
    const password = state.streamPass?.trim();
    const port = state.streamPort?.trim() || "554";

    const encodedUser = username ? encodeURIComponent(username) : "";
    const encodedPass = password ? encodeURIComponent(password) : "";

    let credentials = "";
    if (encodedUser) {
      credentials = encodedUser;
      if (encodedPass) {
        credentials += `:${encodedPass}`;
      }
      credentials += "@";
    }

    const portSegment = port ? `:${port}` : "";

    return `rtsp://${credentials}${state.publicIp}${portSegment}/Streaming/Channels/101/`;
  }, [state.publicIp, state.streamPass, state.streamPort, state.streamUser]);

  useEffect(() => {
    if (autoRtspUrl !== state.streamUrl) {
      dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamUrl: autoRtspUrl } });
    }
  }, [autoRtspUrl, dispatch, state.streamUrl]);

  const resolvePublicIp = async () => {
    if (!state.localIp?.trim()) {
      toast({
        variant: "destructive",
        title: "Local IP Required",
        description: "Enter the local IP address of your camera before converting it.",
      });
      return;
    }

    try {
      setIsResolvingIp(true);
      setConversionError(null);

      const response = await fetch("https://api.ipify.org?format=json");
      if (!response.ok) {
        throw new Error("Failed to retrieve public IP address.");
      }
      const data: { ip?: string } = await response.json();
      if (!data.ip) {
        throw new Error("Could not determine your public IP address.");
      }

      dispatch({
        type: "SET_CONNECTION_DETAILS",
        payload: {
          publicIp: data.ip,
          selectedIp: data.ip,
          selectedHostname: data.ip,
        },
      });

      toast({
        title: "Public IP Detected",
        description: `We converted ${state.localIp} to your public IP address ${data.ip}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while converting IP.";
      setConversionError(message);
      toast({
        variant: "destructive",
        title: "IP Conversion Failed",
        description: message,
      });
    } finally {
      setIsResolvingIp(false);
    }
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
        <CardTitle className="font-headline">Step 3: Provide Your RTSP Stream</CardTitle>
        <CardDescription>Enter the RTSP address for your camera so we can connect directly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Use a direct RTSP stream</AlertTitle>
          <AlertDescription>
            We'll help you build the correct RTSP address. Start with the camera's local IP, then supply the username, password, and port. We'll convert it to a public-facing stream URL for
            you.
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Network className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">RTSP Stream Address</h3>
              <div className="space-y-2">
                <Label htmlFor="local-ip">Local IP Address *</Label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Input
                    id="local-ip"
                    type="text"
                    className="md:flex-1"
                    placeholder="e.g., 192.168.1.88"
                    value={state.localIp}
                    onChange={(e) =>
                      dispatch({ type: "SET_CONNECTION_DETAILS", payload: { localIp: e.target.value } })
                    }
                  />
                  <Button type="button" onClick={resolvePublicIp} disabled={isResolvingIp}>
                    {isResolvingIp ? "Resolving…" : "Use"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Start with the local IP for your camera. We'll convert it to the public IP that BERRETO can reach.
                </p>
                {conversionError && <p className="text-xs text-destructive">{conversionError}</p>}
              </div>

              {state.publicIp && (
                <div className="rounded-md border bg-background p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4 text-primary" />
                    Public IP in use: <span className="font-mono">{state.publicIp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll embed this address into the RTSP connection details automatically.
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rtsp-username" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    Username
                  </Label>
                  <Input
                    id="rtsp-username"
                    placeholder="e.g., admin"
                    value={state.streamUser}
                    onChange={(e) =>
                      dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamUser: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rtsp-password">Password</Label>
                  <Input
                    id="rtsp-password"
                    type="password"
                    placeholder="••••••••"
                    value={state.streamPass}
                    onChange={(e) =>
                      dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamPass: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rtsp-port">RTSP Port</Label>
                  <Input
                    id="rtsp-port"
                    type="text"
                    placeholder="554"
                    value={state.streamPort}
                    onChange={(e) =>
                      dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamPort: e.target.value } })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Provide the username, password, and port for the camera. We'll embed them into the RTSP stream automatically.
              </p>
            </div>
          </div>
        </div>

        {state.publicIp && (
          <div className="rounded-md border bg-muted/60 p-4 space-y-2">
            <Label htmlFor="rtsp-url" className="text-sm font-semibold">
              Generated RTSP URL
            </Label>
            <Input id="rtsp-url" type="text" value={autoRtspUrl} readOnly className="font-mono" />
            <p className="text-xs text-muted-foreground">
              We generated this RTSP link using your public IP and credentials. You'll confirm it and connect on the next step.
            </p>
          </div>
        )}

        {rtspHost && (
          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-semibold">Detected Camera Host</p>
            <p className="font-mono text-xs mt-1">{rtspHost}</p>
            <p className="text-xs text-muted-foreground mt-2">
              We'll use this host when showing the connection summary on the next step.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => dispatch({ type: "PREV_STEP" })}>
          Back
        </Button>
        <Button
          onClick={() => {
            if (!state.publicIp) {
              toast({
                variant: "destructive",
                title: "Public IP Required",
                description: "Convert the local IP to a public IP before continuing.",
              });
              return;
            }
            if (!state.streamUser?.trim() || !state.streamPass?.trim()) {
              toast({
                variant: "destructive",
                title: "Credentials Required",
                description: "Enter the camera username and password to build the RTSP link.",
              });
              return;
            }
            if (!state.streamPort?.trim()) {
              toast({
                variant: "destructive",
                title: "Port Required",
                description: "Provide the RTSP port that should be used for this camera.",
              });
              return;
            }
            dispatch({
              type: "SET_CONNECTION_DETAILS",
              payload: {
                selectedIp: rtspHost,
                selectedHostname: rtspHost,
              },
            });
            dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
            handleNext();
          }}
        >
          Add Connection
        </Button>
      </CardFooter>
    </Card>
  );
}

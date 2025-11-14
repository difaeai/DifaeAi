"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Network, KeyRound } from "lucide-react";
import { useWizard } from "../wizard-context";
import { useToast } from "@/hooks/use-toast";

export default function StepThreeConnection() {
  const { state, dispatch } = useWizard();
  const { toast } = useToast();

  const handleNext = () => {
    dispatch({ type: "NEXT_STEP" });
  };

  const rtspHost = useMemo(() => {
    if (!state.streamUrl) return "";
    try {
      const url = new URL(state.streamUrl);
      return url.hostname;
    } catch {
      return "";
    }
  }, [state.streamUrl]);

  const handleRtspChange = (value: string) => {
    dispatch({
      type: "SET_CONNECTION_DETAILS",
      payload: { streamUrl: value },
    });

    try {
      const parsed = new URL(value);
      const updates: {
        selectedIp: string;
        selectedHostname: string;
        streamUser?: string;
        streamPass?: string;
      } = {
        selectedIp: parsed.hostname,
        selectedHostname: parsed.hostname,
      };
      if (parsed.username) {
        updates.streamUser = decodeURIComponent(parsed.username);
      }
      if (parsed.password) {
        updates.streamPass = decodeURIComponent(parsed.password);
      }
      dispatch({ type: "SET_CONNECTION_DETAILS", payload: updates });
    } catch {
      // Ignore parse failures until URL is complete
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
            Your camera should provide a URL that starts with <code className="bg-muted px-1 rounded">rtsp://</code>. If the URL already contains a username and password (for example
            <code className="bg-muted px-1 rounded">rtsp://user:pass@192.168.1.10:554/stream</code>) we will detect them automatically.
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Network className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">RTSP Stream Address</h3>
              <div className="space-y-2">
                <Label htmlFor="rtsp-url">Full RTSP URL *</Label>
                <Input
                  id="rtsp-url"
                  type="text"
                  placeholder="rtsp://username:password@192.168.1.10:554/Streaming/Channels/101"
                  value={state.streamUrl}
                  onChange={(e) => handleRtspChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Paste the exact RTSP address that worked in VLC or another player. We'll use it to connect directly to your camera.
                </p>
              </div>

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
              </div>
              <p className="text-xs text-muted-foreground">
                If your RTSP URL already contains credentials, we filled them in above. Otherwise, enter them here and we'll embed them before connecting.
              </p>
            </div>
          </div>
        </div>

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
            if (!state.streamUrl || !state.streamUrl.toLowerCase().startsWith("rtsp")) {
              toast({
                variant: "destructive",
                title: "RTSP URL Required",
                description: "Enter a valid RTSP address before continuing.",
              });
              return;
            }
            if (!rtspHost) {
              toast({
                variant: "destructive",
                title: "Invalid URL",
                description: "We couldn't read the camera host from that RTSP address. Double-check the format and try again.",
              });
              return;
            }
            dispatch({
              type: "SET_CONNECTION_DETAILS",
              payload: { selectedIp: rtspHost, selectedHostname: rtspHost },
            });
            handleNext();
          }}
        >
          Continue to Connect
        </Button>
      </CardFooter>
    </Card>
  );
}

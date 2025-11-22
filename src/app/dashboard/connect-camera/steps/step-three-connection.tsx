"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Download, Info, KeyRound, Laptop, Loader2, Network } from "lucide-react";
import { useWizard } from "../wizard-context";
import { useToast } from "@/hooks/use-toast";
import { isValidIPv4 } from "@/lib/network/ip";
import { useAuth } from "@/hooks/use-auth";

type BridgeResponse = {
  bridgeId: string;
  bridgeSecret: string;
  rtspUrl: string;
  agentDownloadUrl: string;
  configUrl: string;
};

export default function StepThreeConnection() {
  const { state, dispatch } = useWizard();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreatingBridge, setIsCreatingBridge] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeResult, setBridgeResult] = useState<BridgeResponse | null>(null);
  const isLocalRunner = state.connectionMode === "localRunner";

  const handleNext = () => {
    dispatch({ type: "NEXT_STEP" });
  };

  const handleConnectionModeChange = (value: string) => {
    const mode = value === "localRunner" ? "localRunner" : "standard";
    setBridgeError(null);
    setBridgeResult(null);
    dispatch({
      type: "SET_CONNECTION_DETAILS",
      payload: { connectionMode: mode, windowsAgentDownloadUrl: "" },
    });
  };

  const rtspHost = useMemo(() => state.localIp?.trim() || "", [state.localIp]);

  const normalizedPath = useMemo(() => {
    const raw = state.rtspPath?.trim();
    if (!raw) return "";
    const withoutLeading = raw.replace(/^\/+/g, "");
    return `/${withoutLeading}`;
  }, [state.rtspPath]);

  const autoRtspUrl = useMemo(() => {
    if (!rtspHost) return "";
    const username = state.streamUser?.trim();
    const password = state.streamPass?.trim();
    const port = state.streamPort?.trim() || "554";

    const preserveAtSymbol = (value: string) => value.replace(/%40/g, "@");

    const encodedUser = username
      ? preserveAtSymbol(encodeURIComponent(username))
      : "";
    const encodedPass = password
      ? preserveAtSymbol(encodeURIComponent(password))
      : "";

    let credentials = "";
    if (encodedUser) {
      credentials = encodedUser;
      if (encodedPass) {
        credentials += `:${encodedPass}`;
      }
      credentials += "@";
    }

    const portSegment = port ? `:${port}` : "";
    const pathSegment = normalizedPath || "";

    return `rtsp://${credentials}${rtspHost}${portSegment}${pathSegment}`;
  }, [normalizedPath, rtspHost, state.streamPass, state.streamPort, state.streamUser]);

  useEffect(() => {
    if (autoRtspUrl && autoRtspUrl !== state.streamUrl) {
      dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamUrl: autoRtspUrl } });
      if (state.isConnectionTested) {
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
      }
    } else if (!autoRtspUrl && state.streamUrl) {
      dispatch({ type: "SET_CONNECTION_DETAILS", payload: { streamUrl: "" } });
      if (state.isConnectionTested) {
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
      }
    }
  }, [autoRtspUrl, dispatch, state.isConnectionTested, state.streamUrl]);

  useEffect(() => {
    if (!rtspHost) {
      if (state.selectedIp) {
        dispatch({
          type: "SET_CONNECTION_DETAILS",
          payload: { selectedIp: "" },
        });
      }
      return;
    }

    if (state.selectedIp !== rtspHost) {
      dispatch({
        type: "SET_CONNECTION_DETAILS",
        payload: { selectedIp: rtspHost },
      });
    }
  }, [dispatch, rtspHost, state.selectedIp]);

  useEffect(() => {
    if (!isLocalRunner) {
      return;
    }

    const updates: {
      streamPort?: string;
      rtspPath?: string;
      selectedIp?: string;
    } = {};

    if (state.streamPort !== "554") {
      updates.streamPort = "554";
    }

    const desiredPath = "/Streaming/Channels/101";
    if (state.rtspPath?.trim() !== desiredPath) {
      updates.rtspPath = desiredPath;
    }

    if (state.localIp && state.selectedIp !== state.localIp) {
      updates.selectedIp = state.localIp;
    }

    if (Object.keys(updates).length > 0) {
      dispatch({ type: "SET_CONNECTION_DETAILS", payload: updates });
    }
  }, [
    dispatch,
    isLocalRunner,
    state.localIp,
    state.rtspPath,
    state.selectedIp,
    state.streamPort,
  ]);

  const handleAddConnection = async () => {
    setBridgeError(null);
    setBridgeResult(null);

    const trimmedHost = rtspHost.trim();
    if (!trimmedHost) {
      const description = "Provide the local IP address of your camera before continuing.";
      toast({
        variant: "destructive",
        title: "Local IP Required",
        description,
      });
      setBridgeError(description);
      return;
    }

    if (!isValidIPv4(trimmedHost)) {
      const description = "Enter a valid IPv4 address (e.g., 192.168.1.120).";
      toast({
        variant: "destructive",
        title: "Invalid IP",
        description,
      });
      setBridgeError(description);
      return;
    }

    const username = state.streamUser?.trim();
    const password = state.streamPass?.trim();

    if (!username || !password) {
      const description = "Enter the camera username and password so we can include them in your bridge config.";
      toast({
        variant: "destructive",
        title: "Credentials Required",
        description,
      });
      setBridgeError(description);
      return;
    }

    const portValue = state.streamPort?.trim() || "554";
    const portNumber = Number(portValue);
    if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
      const description = "Enter a valid RTSP port between 1 and 65535.";
      toast({
        variant: "destructive",
        title: "Invalid Port",
        description,
      });
      setBridgeError(description);
      return;
    }

    const finalPath = normalizedPath || "/Streaming/Channels/101";

    dispatch({
      type: "SET_CONNECTION_DETAILS",
      payload: {
        selectedIp: trimmedHost,
        streamPort: String(portNumber),
        rtspPath: finalPath,
      },
    });
    dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });

    if (state.cameraType === "ip") {
      if (!user?.uid) {
        const description = "Sign in before creating the bridge.";
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description,
        });
        setBridgeError(description);
        return;
      }

      setIsCreatingBridge(true);
      try {
        const response = await fetch("/api/bridges/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: trimmedHost,
            port: portNumber,
            username,
            password,
            streamPath: finalPath,
          }),
        });

        const data = await response.json().catch(() => null);
        const errorMessage =
          data && typeof data.error === "string"
            ? data.error
            : "We couldn’t create the bridge. Please check your camera details and try again.";

        if (
          !response.ok ||
          !data ||
          typeof data.bridgeId !== "string" ||
          typeof data.agentDownloadUrl !== "string"
        ) {
          throw new Error(errorMessage);
        }

        const configUrl = `/api/bridges/${data.bridgeId}/config`;

        setBridgeResult({
          bridgeId: data.bridgeId,
          bridgeSecret: data.bridgeSecret,
          rtspUrl: data.rtspUrl,
          agentDownloadUrl: data.agentDownloadUrl,
          configUrl,
        });

        dispatch({
          type: "SET_CONNECTION_DETAILS",
          payload: { windowsAgentDownloadUrl: data.agentDownloadUrl },
        });

        toast({
          title: "Bridge created",
          description:
            "Download the Windows agent and config file to start streaming to BERRETO.",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "We couldn’t create the bridge. Please check your camera details and try again.";
        setBridgeError(message);
        toast({
          variant: "destructive",
          title: "Bridge setup failed",
          description: message,
        });
        setIsCreatingBridge(false);
        return;
      }

      setIsCreatingBridge(false);
    }
  };

  const handleDownloadConfig = (configUrl: string) => {
    try {
      const anchor = document.createElement("a");
      anchor.href = configUrl;
      anchor.download = "bridge-config.json";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      console.warn("Failed to trigger config download", error);
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
            We'll help you build the correct RTSP address. Start with the camera's local IP, then supply the username, password, and port. We'll create a bridge record and give you a Windows agent plus a config file to forward the feed to BERRETO.
          </AlertDescription>
        </Alert>

        <Tabs value={state.connectionMode} onValueChange={handleConnectionModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="standard" className="w-full text-sm">Direct RTSP Builder</TabsTrigger>
            <TabsTrigger value="localRunner" className="w-full text-sm">Run locally</TabsTrigger>
          </TabsList>
          <TabsContent value="standard" className="mt-4 space-y-4">
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Network className="h-5 w-5" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">RTSP Stream Address</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter the local IP and credentials exactly as they work on your LAN. We'll create a ready-to-run Windows bridge and config so it can forward the video to BERRETO continuously.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="local-ip">Local IP Address *</Label>
                    <Input
                      id="local-ip"
                      type="text"
                      placeholder="e.g., 192.168.1.88"
                      value={state.localIp}
                      onChange={(e) => {
                        setBridgeError(null);
                        setBridgeResult(null);
                        dispatch({
                          type: "SET_CONNECTION_DETAILS",
                          payload: {
                            localIp: e.target.value,
                            windowsAgentDownloadUrl: "",
                          },
                        });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use the address you can reach from a PC on the same network as the camera.
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
                        onChange={(e) => {
                          setBridgeError(null);
                          setBridgeResult(null);
                          dispatch({
                            type: "SET_CONNECTION_DETAILS",
                            payload: {
                              streamUser: e.target.value,
                              windowsAgentDownloadUrl: "",
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rtsp-password">Password</Label>
                      <Input
                        id="rtsp-password"
                        type="password"
                        placeholder="••••••••"
                        value={state.streamPass}
                        onChange={(e) => {
                          setBridgeError(null);
                          setBridgeResult(null);
                          dispatch({
                            type: "SET_CONNECTION_DETAILS",
                            payload: {
                              streamPass: e.target.value,
                              windowsAgentDownloadUrl: "",
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rtsp-port">RTSP Port</Label>
                      <Input
                        id="rtsp-port"
                        type="text"
                        placeholder="554"
                        value={state.streamPort}
                        onChange={(e) => {
                          setBridgeError(null);
                          setBridgeResult(null);
                          dispatch({
                            type: "SET_CONNECTION_DETAILS",
                            payload: {
                              streamPort: e.target.value,
                              windowsAgentDownloadUrl: "",
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="rtsp-path">Stream Path</Label>
                      <Input
                        id="rtsp-path"
                        type="text"
                        placeholder="e.g., Streaming/Channels/101 or h264"
                        value={state.rtspPath}
                        onChange={(e) => {
                          setBridgeError(null);
                          setBridgeResult(null);
                          dispatch({
                            type: "SET_CONNECTION_DETAILS",
                            payload: {
                              rtspPath: e.target.value,
                              windowsAgentDownloadUrl: "",
                            },
                          });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        We'll append this path to the RTSP URL for you.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These credentials only live in the generated config file—nothing extra to configure once it runs on Windows.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="localRunner" className="mt-4 space-y-4">
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Laptop className="h-5 w-5" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Run Locally</h3>
                  <p className="text-sm text-muted-foreground">
                    Test the camera from this computer without exposing it publicly. We'll use the default RTSP port and stream path so you can connect with a link like rtsp://username:password@192.168.x.x:554/Streaming/Channels/101.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="local-run-ip">Local Camera IP *</Label>
                      <Input
                        id="local-run-ip"
                        type="text"
                        placeholder="e.g., 192.168.18.130"
                        value={state.localIp}
                        onChange={(e) => {
                          setBridgeError(null);
                          setBridgeResult(null);
                          dispatch({
                            type: "SET_CONNECTION_DETAILS",
                            payload: {
                              localIp: e.target.value,
                              windowsAgentDownloadUrl: "",
                            },
                          });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the IP address assigned to your camera on your local network.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="local-run-username" className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        Username
                      </Label>
                      <Input
                        id="local-run-username"
                        placeholder="e.g., admin"
                        value={state.streamUser}
                        onChange={(e) => {
                          setBridgeError(null);
                          setBridgeResult(null);
                          dispatch({
                            type: "SET_CONNECTION_DETAILS",
                            payload: {
                              streamUser: e.target.value,
                              windowsAgentDownloadUrl: "",
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="local-run-password">Password</Label>
                      <Input
                        id="local-run-password"
                        type="password"
                        placeholder="••••••••"
                        value={state.streamPass}
                        onChange={(e) => {
                          setBridgeError(null);
                        setBridgeResult(null);
                          dispatch({
                            type: "SET_CONNECTION_DETAILS",
                            payload: {
                              streamPass: e.target.value,
                              windowsAgentDownloadUrl: "",
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll automatically use RTSP port 554 and the /Streaming/Channels/101 path so the generated link works for most Hikvision-style cameras.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {autoRtspUrl && (
          <div className="rounded-md border bg-muted/60 p-4 space-y-2">
            <Label htmlFor="rtsp-url" className="text-sm font-semibold">
              Generated RTSP URL
            </Label>
            <Input id="rtsp-url" type="text" value={autoRtspUrl} readOnly className="font-mono" />
            <p className="text-xs text-muted-foreground">
              We generated this RTSP link using your selected host and credentials. You'll confirm it and connect on the next step.
            </p>
          </div>
        )}

        {rtspHost && (
          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-semibold">Host in Use for RTSP Link</p>
            <p className="font-mono text-xs mt-1">{rtspHost}</p>
            <p className="text-xs text-muted-foreground mt-2">
              We'll use this host when showing the connection summary on the next step.
            </p>
          </div>
        )}

        {bridgeResult && (
          <div className="space-y-4 rounded-lg border border-primary/40 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <CheckCircle className="h-4 w-4" />
              Bridge created successfully
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Step 1: Download the Windows bridge agent.</p>
              <p>Step 2: Run it on the same PC/network as your camera.</p>
              <p>Step 3: Keep it running; it will send your camera feed securely to BERRETO / DIFAE.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={bridgeResult.agentDownloadUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download Agent
                </a>
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => handleDownloadConfig(bridgeResult.configUrl)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Config
              </Button>
            </div>
            <div className="rounded-md border bg-white/80 p-3 text-sm shadow-sm">
              <p className="font-semibold">Bridge details</p>
              <p className="mt-2 text-xs text-muted-foreground">Bridge ID</p>
              <p className="font-mono text-xs break-all">{bridgeResult.bridgeId}</p>
              <p className="mt-3 text-xs text-muted-foreground">Generated RTSP URL</p>
              <p className="font-mono text-xs break-all">{bridgeResult.rtspUrl}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => dispatch({ type: "PREV_STEP" })}>
          Back
        </Button>
        <div className="flex flex-col items-end gap-2">
          {bridgeError && (
            <p className="max-w-xs text-right text-sm text-destructive">{bridgeError}</p>
          )}
          <Button onClick={handleAddConnection} disabled={isCreatingBridge}>
            {isCreatingBridge ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating bridge...
              </>
            ) : (
              "Add Connection"
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}


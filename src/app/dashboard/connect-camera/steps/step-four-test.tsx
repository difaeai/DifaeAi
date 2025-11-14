"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useWizard } from "../wizard-context";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import LivePreviewPlayer from "@/components/live-preview-player";

interface StepFourTestProps {
  onComplete: () => void;
}

function buildRtspWithCredentials(baseUrl: string, username?: string, password?: string) {
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    if (username) {
      url.username = username;
    }
    if (password) {
      url.password = password;
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}

function maskRtsp(url: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "******";
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export default function StepFourTest({ onComplete }: StepFourTestProps) {
  const { state, dispatch } = useWizard();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isTesting, setIsTesting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isRtspCamera = state.cameraType === "ip" || state.cameraType === "dvr";
  const displayRtspUrl = useMemo(() => maskRtsp(state.streamUrl), [state.streamUrl]);

  // Handle USB Webcam
  useEffect(() => {
    if (state.cameraType === "usb") {
      const getWebcamStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Wait for video to be ready
            videoRef.current.onloadeddata = () => {
              setVideoReady(true);
              dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: true } });
              setShowPreview(true);
            };
          }
        } catch (error) {
          console.error("Webcam error:", error);
          toast({
            variant: "destructive",
            title: "Webcam Access Denied",
            description: "Please enable camera permissions in your browser.",
          });
          dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
        }
      };
      getWebcamStream();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [state.cameraType, toast, dispatch]);

  const handleConnectCamera = useCallback(async () => {
    if (!isRtspCamera) {
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to connect your camera.",
      });
      dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
      setVideoReady(false);
      return;
    }

    if (!state.streamUrl) {
      toast({
        variant: "destructive",
        title: "RTSP URL Required",
        description: "Provide the RTSP link for your camera before connecting.",
      });
      dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
      setVideoReady(false);
      return;
    }

    setIsTesting(true);
    setShowPreview(false);
    setVideoReady(false);
    setPreviewUrl("");

    try {
      const response = await fetch("/api/test-camera", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cameraType: state.cameraType,
          streamUrl: state.streamUrl,
          username: state.streamUser || "",
          password: state.streamPass || "",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const message = data?.message || "Connection test failed. Check your RTSP URL and credentials.";
        throw new Error(message);
      }

      const fullRtspUrl = buildRtspWithCredentials(state.streamUrl, state.streamUser, state.streamPass);
      dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: true, streamUrl: fullRtspUrl } });
      setPreviewUrl(fullRtspUrl);
      setShowPreview(true);
      toast({
        title: "Camera connected!",
        description: "We verified the RTSP stream. Loading live preview…",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to connect to camera.";
      dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
      setPreviewUrl("");
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: message,
      });
    } finally {
      setIsTesting(false);
    }
  }, [dispatch, isRtspCamera, state.cameraType, state.streamPass, state.streamUrl, state.streamUser, toast, user]);

  const isReadyToAdd = useMemo(() => {
    if (state.cameraType === "usb") {
      return state.isConnectionTested && videoReady;
    }
    if (isRtspCamera) {
      return state.isConnectionTested && videoReady;
    }
    if (state.cameraType === "mobile" || state.cameraType === "cloud") {
      return state.isConnectionTested;
    }
    return state.isConnectionTested;
  }, [isRtspCamera, state.cameraType, state.isConnectionTested, videoReady]);

  const handleComplete = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to add a camera.",
      });
      return;
    }

    if (!state.isConnectionTested) {
      toast({
        variant: "destructive",
        title: "Connection Not Tested",
        description: "Please connect the camera before adding it to the system.",
      });
      return;
    }

    setIsAdding(true);
    try {
      await onComplete();
    } catch (error) {
      console.error("Add camera error:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Step 4: Test Connection & Validate</CardTitle>
        <CardDescription>
          Verify that BERRETO can connect to your camera and validate the video stream before adding it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Camera Name</Label>
            <p className="text-sm font-medium">{state.cameraName}</p>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <p className="text-sm font-medium">{state.location}</p>
          </div>
          <div className="space-y-2">
            <Label>Camera Type</Label>
            <p className="text-sm font-medium capitalize">{state.cameraType || "Not selected"}</p>
          </div>
          {state.selectedIp && (
            <div className="space-y-2">
              <Label>Camera Host</Label>
              <p className="text-sm font-medium font-mono">{state.selectedIp}</p>
            </div>
          )}
          {isRtspCamera && state.streamUrl && (
            <div className="space-y-2 md:col-span-2">
              <Label>RTSP URL</Label>
              <p className="text-xs font-mono break-all bg-muted/50 p-2 rounded">
                {displayRtspUrl}
              </p>
            </div>
          )}
        </div>

        {/* Connect/Test Button */}
        {isRtspCamera && (
          <Button type="button" onClick={handleConnectCamera} disabled={isTesting} size="lg">
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Camera...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Connect Camera
              </>
            )}
          </Button>
        )}

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Live Preview</Label>
          <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center">
            {showPreview && state.cameraType === "usb" ? (
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline controls />
            ) : showPreview && previewUrl ? (
              <LivePreviewPlayer
                rtspUrl={previewUrl}
                onReady={() => {
                  setVideoReady(true);
                }}
                onError={(message) => {
                  setVideoReady(false);
                  dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
                  toast({
                    variant: "destructive",
                    title: "Preview Error",
                    description: message || "Unable to render live stream.",
                  });
                }}
              />
            ) : (
              <div className="text-center p-6">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {state.cameraType === "usb"
                    ? "Webcam preview should appear here"
                    : "Live preview will appear here after connecting to your camera."}
                </p>
                {isRtspCamera && (
                  <p className="text-xs text-muted-foreground mt-2">
                    We'll launch a secure ffmpeg session to convert your RTSP stream to an in-browser preview.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        {state.isConnectionTested ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Connection Verified!</AlertTitle>
            <AlertDescription className="text-green-700">
              Your camera is ready to be added to the system.
            </AlertDescription>
          </Alert>
        ) : (
          isRtspCamera && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Not Connected</AlertTitle>
              <AlertDescription>
                Enter your RTSP link and click <strong>Connect Camera</strong> to verify the live stream before adding it.
              </AlertDescription>
            </Alert>
          )
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => dispatch({ type: "PREV_STEP" })}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={!isReadyToAdd || isAdding} size="lg">
          {isAdding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Camera...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Add Camera to System
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useWizard } from "../wizard-context";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
function LiveCameraPreview({ url }: { url: string }) {
  const [imgSrc, setImgSrc] = useState('');
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Use proxy to avoid HTTPS/HTTP mixed content blocking
    const proxyUrl = `/api/camera-proxy?url=${encodeURIComponent(url)}`;
    setImgSrc(proxyUrl + '&t=' + Date.now());
    
    // Auto-refresh every second for snapshot URLs
    const interval = setInterval(() => {
      setImgSrc(proxyUrl + '&t=' + Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [url]);
  
  if (!imgSrc) return null;
  
  return (
    <div className="relative w-full h-full">
      <img 
        src={imgSrc} 
        alt="Camera Live Feed" 
        className="w-full h-full object-cover"
        onLoad={() => setHasError(false)}
        onError={() => setHasError(true)}
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <p className="text-sm text-muted-foreground">Connecting to camera...</p>
        </div>
      )}
    </div>
  );
}

interface StepFourTestProps {
  onComplete: () => void;
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

  const handleTestConnection = useCallback(async () => {
    if (state.cameraType === "usb") {
      // USB webcam already tested via getUserMedia
      return;
    }

    setIsTesting(true);
    setShowPreview(false);
    
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "You must be logged in to use the Camera Bridge.",
        });
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
        setVideoReady(false);
        return;
      }

      if (!state.bridgeId || !state.bridgeUrl || !state.bridgeName) {
        toast({
          variant: "destructive",
          title: "Bridge Details Missing",
          description: "Please complete the bridge configuration before testing the connection.",
        });
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
        setVideoReady(false);
        return;
      }

      if (!state.selectedIp) {
        toast({
          variant: "destructive",
          title: "Camera IP Required",
          description: "Enter your camera's IP address to continue.",
        });
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
        setVideoReady(false);
        return;
      }

      toast({
        title: "Connecting via Camera Bridge...",
        description: "Auto-detecting camera port and stream path on your local network.",
      });

      const authToken = await user.getIdToken();
      const bridgeResponse = await fetch("/api/bridge/add-camera", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          bridgeId: state.bridgeId,
          cameraIp: state.selectedIp,
          username: state.streamUser || "",
          password: state.streamPass || "",
          autoDetect: true,
        }),
      });

      if (!bridgeResponse.ok) {
        const errorData = await bridgeResponse.json().catch(() => ({ error: "Network error" }));
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
        setVideoReady(false);

        toast({
          variant: "destructive",
          title: "Bridge Connection Failed",
          description:
            errorData.error ||
            `Bridge returned error (${bridgeResponse.status}). Please check:\n1. Bridge is running and accessible\n2. Camera is powered on\n3. IP address is correct\n4. You're on the same network`,
          duration: 10000,
        });
        return;
      }

      const bridgeResult = await bridgeResponse.json();

      if (bridgeResult.success && bridgeResult.camera) {
        dispatch({
          type: "SET_CONNECTION_TESTED",
          payload: {
            tested: true,
            streamUrl: bridgeResult.camera.streamUrl,
          },
        });

        setPreviewUrl(bridgeResult.camera.streamUrl);
        setShowPreview(true);
        setVideoReady(true);

        toast({
          title: "Camera Connected via Bridge!",
          description: `Camera detected: ${bridgeResult.camera.manufacturer} ${bridgeResult.camera.model}\nLive preview available when on the same network.`,
        });
      } else {
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
        setVideoReady(false);

        toast({
          variant: "destructive",
          title: "Bridge Connection Failed",
          description:
            bridgeResult.error ||
            "Could not connect to camera via bridge. Please check:\n1. Camera is powered on\n2. IP address is correct\n3. You're on the same network as the camera\n4. Bridge is running and accessible",
          duration: 10000,
        });
      }
    } catch (error) {
      console.error("Connection test error:", error);
      
      // STRICT ERROR HANDLING: Do not auto-approve failures
      dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
      setShowPreview(false);
      setVideoReady(false);
      
      toast({
        variant: "destructive",
        title: "Connection Test Failed",
        description: "Could not connect to camera. Please check the IP address and credentials, then try again.",
      });
    } finally {
      setIsTesting(false);
    }
  }, [state, toast, dispatch, user]);

  // Gate camera addition on both connection tested AND video ready
  const isReadyToAdd = state.isConnectionTested && videoReady;

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
              <Label>IP Address</Label>
              <p className="text-sm font-medium font-mono">{state.selectedIp}</p>
            </div>
          )}
        </div>

        {/* Test Connection Button */}
        {state.cameraType !== "usb" && (
          <Button type="button" onClick={handleTestConnection} disabled={isTesting} size="lg">
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Test Connection
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
              <LiveCameraPreview url={previewUrl} />
            ) : (
              <div className="text-center p-6">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {state.cameraType === "usb"
                    ? "Webcam preview should appear here"
                    : "Live preview will appear here after a successful test."}
                </p>
                {state.cameraType !== "usb" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Your browser will connect directly to the camera on your local network.
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
          state.cameraType !== "usb" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Not Tested</AlertTitle>
              <AlertDescription>
                Please test the connection to validate the camera stream before adding it to the system.
              </AlertDescription>
            </Alert>
          )
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => dispatch({ type: "PREV_STEP" })}>
          Back
        </Button>
        <Button onClick={onComplete} disabled={!isReadyToAdd || isAdding} size="lg">
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

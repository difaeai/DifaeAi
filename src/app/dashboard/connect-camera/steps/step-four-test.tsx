"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useWizard } from "../page";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

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
    toast({ title: "Testing connection...", description: "This may take a moment." });

    try {
      // Test RTSP/IP camera connection
      const testPayload: any = {
        cameraType: state.cameraType,
        streamUrl: state.streamUrl || `rtsp://${state.selectedIp}:554/stream1`,
      };

      if (state.streamUser) testPayload.username = state.streamUser;
      if (state.streamPass) testPayload.password = state.streamPass;

      const response = await fetch("/api/test-camera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
      });

      const result = await response.json();

      if (result.success) {
        // Connection successful - FFmpeg verified RTSP stream
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: true, streamUrl: result.streamUrl } });
        
        // For IP/DVR cameras, FFmpeg probe validation is sufficient
        // Video preview will be available after HLS transcoding is deployed
        setVideoReady(true);
        
        toast({
          title: "Connection Verified!",
          description: result.streamInfo 
            ? `Camera validated: ${result.streamInfo.width}x${result.streamInfo.height}`
            : "Camera connection successful.",
        });

        // Optionally attempt video preview (if streaming endpoint exists)
        const streamUrl = result.streamUrl || result.hlsUrl;
        if (streamUrl && result.hlsUrl) {
          setPreviewUrl(streamUrl);
          setShowPreview(true);

          // Load video if HLS
          if (result.hlsUrl && videoRef.current) {
            const video = videoRef.current;
            
            // Load HLS stream
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
              video.src = result.hlsUrl;
            } else if (typeof window !== "undefined" && (window as any).Hls) {
              const Hls = (window as any).Hls;
              if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(result.hlsUrl);
                hls.attachMedia(video);
              }
            }
          }
        } else {
          // For cloud/mobile cameras without video preview
          dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: true } });
          setVideoReady(true);
          toast({
            title: "Connection Verified!",
            description: result.message || "Camera connected successfully.",
          });
        }
      } else {
        // Connection failed
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
        setVideoReady(false);
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: result.message || "Could not connect to the camera. Check IP address and credentials.",
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
  }, [state, toast, dispatch]);

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
            {showPreview ? (
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline controls />
            ) : (
              <div className="text-center p-6">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {state.cameraType === "usb"
                    ? "Webcam preview should appear here"
                    : "Preview will appear here after a successful test."}
                </p>
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

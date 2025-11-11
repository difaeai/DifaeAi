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
    toast({ 
      title: "Auto-detecting RTSP stream...", 
      description: "Testing common camera paths. This may take up to 30 seconds." 
    });

    try {
      // Step 1: Auto-detect RTSP URL from IP address
      const autoDetectResponse = await fetch("/api/auto-detect-rtsp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: state.selectedIp,
          username: state.streamUser || '',
          password: state.streamPass || '',
        }),
      });

      const autoDetectResult = await autoDetectResponse.json();

      if (autoDetectResult.success) {
        // Check if this is a local network camera (browser will test directly)
        if (autoDetectResult.isLocalNetwork && autoDetectResult.httpSnapshotUrls) {
          toast({
            title: "Testing Camera Connection...",
            description: "Your browser is testing connection to local camera...",
          });
          
          // Test each HTTP URL in the browser until one works
          let foundWorkingUrl = false;
          for (const urlConfig of autoDetectResult.httpSnapshotUrls) {
            try {
              // Test if browser can load this image
              const testImage = new Image();
              const imageLoadPromise = new Promise<boolean>((resolve) => {
                testImage.onload = () => resolve(true);
                testImage.onerror = () => resolve(false);
                setTimeout(() => resolve(false), 3000); // 3 second timeout
              });
              
              testImage.src = urlConfig.url + '?t=' + Date.now();
              const success = await imageLoadPromise;
              
              if (success) {
                // Found working URL!
                setPreviewUrl(urlConfig.url);
                setShowPreview(true);
                setVideoReady(true);
                foundWorkingUrl = true;
                
                dispatch({ type: "SET_CONNECTION_TESTED", payload: { 
                  tested: true, 
                  streamUrl: urlConfig.url
                } });
                
                toast({
                  title: "Camera Connected!",
                  description: `Live feed found: ${urlConfig.name}\nYour browser is connected directly to the camera.`,
                });
                
                break; // Stop testing, we found one that works
              }
            } catch (error) {
              console.log(`Failed to load ${urlConfig.name}:`, error);
            }
          }
          
          if (!foundWorkingUrl) {
            // None of the URLs worked
            dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
            setVideoReady(false);
            
            toast({
              variant: "destructive",
              title: "Connection Failed",
              description: "Could not connect to camera. Please check:\n1. Camera is powered on\n2. Username/password are correct\n3. You're on the same network as the camera",
              duration: 10000,
            });
          }
        } else {
          // Cloud-accessible camera - use server-validated URL
          dispatch({ type: "SET_CONNECTION_TESTED", payload: { 
            tested: true, 
            streamUrl: autoDetectResult.fullRtspUrl || autoDetectResult.httpSnapshotUrl
          } });
          
          setVideoReady(true);
          
          const description = autoDetectResult.streamInfo 
            ? `Found: ${autoDetectResult.detectedPath}\nResolution: ${autoDetectResult.streamInfo.width}x${autoDetectResult.streamInfo.height}\nTested ${autoDetectResult.testedPaths} path(s)`
            : `Found: ${autoDetectResult.detectedPath}\nTested ${autoDetectResult.testedPaths} path(s)`;
          
          toast({
            title: "Stream Auto-Detected!",
            description: description,
          });
          
          // Show live preview from HTTP snapshot
          if (autoDetectResult.httpSnapshotUrl) {
            setPreviewUrl(autoDetectResult.httpSnapshotUrl);
            setShowPreview(true);
          }
        }
      } else {
        // Auto-detection failed
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
        setVideoReady(false);
        
        // Show detailed error message
        const isLocalNetwork = state.selectedIp?.startsWith('192.168.') || 
                              state.selectedIp?.startsWith('10.') ||
                              state.selectedIp?.startsWith('172.');
        
        const errorMessage = isLocalNetwork
          ? `Cannot reach camera at ${state.selectedIp} - this appears to be a local network address.\n\n` +
            `Cloud servers cannot access cameras on your local network (192.168.x.x, 10.x.x.x, etc.).\n\n` +
            `Solutions:\n` +
            `1. Deploy this app on your local network\n` +
            `2. Use a cloud-accessible camera\n` +
            `3. Set up port forwarding on your router`
          : autoDetectResult.error || "Could not auto-detect RTSP stream";
        
        toast({
          variant: "destructive",
          title: "Auto-Detection Failed",
          description: errorMessage,
          duration: 10000, // Show for 10 seconds
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

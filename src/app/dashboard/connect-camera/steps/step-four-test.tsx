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
import Hls from "hls.js";

function HLSPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoRef.current || !url) return;

    const video = videoRef.current;
    setLoading(true);
    setError(null);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferSize: 30,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch((err) => {
          console.warn("Autoplay prevented:", err);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(`Stream error: ${data.type}`);
          setLoading(false);
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch((err) => {
          console.warn("Autoplay prevented:", err);
        });
      });
      video.addEventListener('error', () => {
        setError('Failed to load stream');
        setLoading(false);
      });
    } else {
      setError('HLS not supported in this browser');
      setLoading(false);
    }
  }, [url]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover" 
        controls 
        playsInline 
        muted
      />
    </div>
  );
}

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
      // EZVIZ CLOUD MODE: Get HLS stream from Ezviz Cloud
      if (state.connectionMethod === "ezviz") {
        if (!state.ezvizSession || !state.selectedEzvizDevice) {
          toast({
            variant: "destructive",
            title: "Ezviz Setup Incomplete",
            description: "Please log in to Ezviz and select a camera first.",
          });
          setIsTesting(false);
          return;
        }

        toast({ 
          title: "Connecting to Ezviz Cloud...", 
          description: "Getting live stream URL for your camera." 
        });

        const streamResponse = await fetch("/api/ezviz/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: state.ezvizSession.sessionId,
            deviceSerial: state.selectedEzvizDevice.deviceSerial,
            region: state.ezvizSession.region,
          }),
        });

        const streamResult = await streamResponse.json();

        if (streamResult.success && streamResult.streamUrl) {
          dispatch({ type: "SET_CONNECTION_TESTED", payload: { 
            tested: true, 
            streamUrl: streamResult.streamUrl
          }});

          setPreviewUrl(streamResult.streamUrl);
          setShowPreview(true);
          setVideoReady(true);

          toast({
            title: "✓ Connected to Ezviz Camera!",
            description: `Streaming ${state.selectedEzvizDevice.deviceName} via cloud`,
          });
        } else {
          dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
          setVideoReady(false);

          toast({
            variant: "destructive",
            title: "Ezviz Stream Failed",
            description: streamResult.error || "Could not get stream URL. The camera may be offline or the session may have expired.",
            duration: 10000,
          });
        }
        
        setIsTesting(false);
        return;
      }

      // BRIDGE MODE: Use Camera Bridge for local network cameras
      if (state.connectionMethod === "bridge") {
        if (!user) {
          toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "You must be logged in to use the Camera Bridge.",
          });
          setIsTesting(false);
          return;
        }

        toast({ 
          title: "Connecting via Camera Bridge...", 
          description: "Auto-detecting camera port and stream path on your local network." 
        });

        const authToken = await user.getIdToken();
        const bridgeResponse = await fetch("/api/bridge/add-camera", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({
            bridgeId: state.bridgeId,
            cameraIp: state.selectedIp,
            username: '',
            password: '',
            autoDetect: true,
          }),
        });

        if (!bridgeResponse.ok) {
          const errorData = await bridgeResponse.json().catch(() => ({ error: 'Network error' }));
          dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
          setVideoReady(false);
          setIsTesting(false);

          toast({
            variant: "destructive",
            title: "Bridge Connection Failed",
            description: errorData.error || `Bridge returned error (${bridgeResponse.status}). Please check:\n1. Bridge is running and accessible\n2. Camera is powered on\n3. IP address is correct\n4. You're on the same network`,
            duration: 10000,
          });
          return;
        }

        const bridgeResult = await bridgeResponse.json();

        if (bridgeResult.success && bridgeResult.camera) {
          dispatch({ type: "SET_CONNECTION_TESTED", payload: { 
            tested: true, 
            streamUrl: bridgeResult.camera.streamUrl
          }});

          setPreviewUrl(bridgeResult.camera.streamUrl);
          setShowPreview(true);
          setVideoReady(true);

          toast({
            title: "Camera Connected via Bridge!",
            description: `Camera detected: ${bridgeResult.camera.manufacturer} ${bridgeResult.camera.model}\nLive preview available when on same network.`,
          });
        } else {
          dispatch({ type: "SET_CONNECTION_TESTED", payload: { tested: false } });
          setVideoReady(false);

          toast({
            variant: "destructive",
            title: "Bridge Connection Failed",
            description: bridgeResult.error || "Could not connect to camera via bridge. Please check:\n1. Camera is powered on\n2. IP address is correct\n3. You're on the same network as the camera\n4. Bridge is running and accessible",
            duration: 10000,
          });
        }
        
        setIsTesting(false);
        return;
      }

      // DIRECT MODE: Auto-detect RTSP URL from IP address
      toast({ 
        title: "Auto-detecting camera...", 
        description: "Scanning ports and testing RTSP paths. This may take up to 60 seconds." 
      });

      const autoDetectResponse = await fetch("/api/camera/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: state.selectedIp,
          username: state.streamUser || '',
          password: state.streamPass || '',
        }),
      });

      const autoDetectResult = await autoDetectResponse.json();

      if (autoDetectResult.success && autoDetectResult.rtspUrl) {
        // Successfully discovered RTSP stream!
        dispatch({ type: "SET_CONNECTION_TESTED", payload: { 
          tested: true, 
          streamUrl: autoDetectResult.rtspUrl
        } });
        
        setVideoReady(true);
        
        toast({
          title: "✓ Camera Auto-Detected!",
          description: `Found RTSP stream on port ${autoDetectResult.port}\nPath: ${autoDetectResult.path}\nConnection ready!`,
          duration: 5000,
        });
        
        // Note: Live preview won't work in browser for RTSP streams
        // User will see this when they add the camera to the system
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
            ) : showPreview && previewUrl && state.connectionMethod === "ezviz" ? (
              <HLSPlayer url={previewUrl} />
            ) : showPreview && previewUrl ? (
              <LiveCameraPreview url={previewUrl} />
            ) : (
              <div className="text-center p-6">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {state.cameraType === "usb"
                    ? "Webcam preview should appear here"
                    : state.connectionMethod === "ezviz"
                    ? "Live preview will appear here after connecting to Ezviz Cloud."
                    : "Live preview will appear here after a successful test."}
                </p>
                {state.connectionMethod === "ezviz" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ezviz streams work from anywhere in the world via cloud.
                  </p>
                )}
                {state.cameraType !== "usb" && state.connectionMethod !== "ezviz" && (
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

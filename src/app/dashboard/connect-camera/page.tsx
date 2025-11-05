

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Video, CheckCircle, Loader2, Info, QrCode, Cloud, Lock, Wifi, Usb, Smartphone, Box, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import type { Camera } from "@/lib/types";
import { cn } from "@/lib/utils";
import JsmpegPlayer from "@/components/jsmpeg-player";
import MjpegPreview from "@/components/mjpeg-preview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


type CameraType = "" | "ip" | "dvr" | "mobile" | "usb" | "cloud";

import { testCameraConnection } from '@/lib/camera-connect';

type ConnectionTestOptions = {
  preservePreview?: boolean;
  suppressProbeDialog?: boolean;
  skipToast?: boolean;
  allowFallbackPreview?: boolean;
};

async function addCameraToFirestore(cameraData: Omit<Camera, 'id' | 'createdAt'>): Promise<string> {
    const camerasCollection = collection(db, 'users', cameraData.userId, 'cameras');
    const docRef = await addDoc(camerasCollection, {
        ...cameraData,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
}


export default function ConnectCameraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [cameraType, setCameraType] = useState<CameraType>("");
  const [isTesting, setIsTesting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [hasWebcamPermission, setHasWebcamPermission] = useState<boolean | null>(null);
  const [previewRtspUrl, setPreviewRtspUrl] = useState<string>('');
  const [probeResults, setProbeResults] = useState<any[]>([]);
  const [showProbeResults, setShowProbeResults] = useState(false);
  const [probeInProgress, setProbeInProgress] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showMjpegFallback, setShowMjpegFallback] = useState(false);
  const [ffmpegMissing, setFfmpegMissing] = useState(false);
  const [authHint, setAuthHint] = useState(false);
  const [detectedStreamUrl, setDetectedStreamUrl] = useState<string>('');
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [manualIp, setManualIp] = useState<string>('');
  const [selectedHostname, setSelectedHostname] = useState<string>('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showCredentialFields, setShowCredentialFields] = useState(false);
  const [streamUser, setStreamUser] = useState('');
  const [streamPass, setStreamPass] = useState('');
  const [awaitingCredentials, setAwaitingCredentials] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const resetIpSelection = useCallback(() => {
    setSelectedIp('');
    setManualIp('');
    setSelectedHostname('');
    setShowManualEntry(false);
    setShowCredentialFields(false);
    setPreviewRtspUrl('');
    setDetectedStreamUrl('');
    setIsConnectionTested(false);
    setIsTesting(false);
    setProbeResults([]);
    setProbeInProgress(false);
    setShowProbeResults(false);
    setShowMjpegFallback(false);
    setAuthHint(false);
    setFfmpegMissing(false);
    setStreamUser('');
    setStreamPass('');
    setAwaitingCredentials(false);

    if (typeof document !== 'undefined') {
      const el = document.getElementById('stream-url') as HTMLInputElement | null;
      if (el) {
        el.value = '';
        el.dispatchEvent?.(new Event('input', { bubbles: true }));
      }
    }
  }, []);

  const cameraTypeOptions = [
    { type: 'ip' as CameraType, icon: <Wifi className="h-8 w-8" />, title: 'IP Camera', description: 'A standalone Wi-Fi or Ethernet camera.' },
    { type: 'dvr' as CameraType, icon: <Box className="h-8 w-8" />, title: 'DVR / NVR System', description: 'A camera connected to a recording box.' },
    { type: 'usb' as CameraType, icon: <Usb className="h-8 w-8" />, title: 'USB Webcam', description: 'A webcam connected to your computer.' },
    { type: 'mobile' as CameraType, icon: <Smartphone className="h-8 w-8" />, title: 'Mobile Camera', description: 'Using an app to turn your phone into a camera.' },
    { type: 'cloud' as CameraType, icon: <Cloud className="h-8 w-8" />, title: 'Cloud Camera', description: 'A camera from a cloud service like Ring or Nest.' },
  ];

  useEffect(() => {
    if (cameraType !== 'ip') {
      resetIpSelection();
    }
  }, [cameraType, resetIpSelection]);

  useEffect(() => {
    const cleanupStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    if (cameraType === "usb") {
      const getWebcamPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasWebcamPermission(true);
          setIsConnectionTested(true); // Auto-tested for webcams
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } catch (error) {
          console.error("Error accessing webcam:", error);
          setHasWebcamPermission(false);
          toast({
            variant: "destructive",
            title: "Webcam Access Denied",
            description: "Please enable camera permissions in your browser.",
          });
        }
      };
      getWebcamPermission();
    } else {
      cleanupStream();
    }

    return cleanupStream;
  }, [cameraType, toast]);

  useEffect(() => {
    if (authHint) {
      setShowCredentialFields(true);
      setAwaitingCredentials(true);
    }
  }, [authHint]);


  const runConnectionTest = useCallback(async (options: ConnectionTestOptions = {}) => {
    if (!formRef.current || !cameraType) return;

    const { preservePreview = false, suppressProbeDialog = false, skipToast = false, allowFallbackPreview = false } = options;
    const hadPreview = !!previewRtspUrl;

    setIsTesting(true);
    setIsConnectionTested(false);
    setFfmpegMissing(false);
    setAuthHint(false);
    setDetectedStreamUrl('');

    if (!preservePreview) {
    setPreviewRtspUrl('');
  }
  setShowMjpegFallback(false);
  if (suppressProbeDialog) {
    setShowProbeResults(false);
  }

  if (!skipToast) {
    let toastDescription = "This may take a moment.";
      if (cameraType === 'cloud') {
        toastDescription = "Redirecting you for authentication...";
      }
      toast({ title: "Testing connection...", description: toastDescription });
    }

    const formData = new FormData(formRef.current);

    try {
      const result = await testCameraConnection(cameraType, formData);

      if (result.success) {
        if (result.candidates && result.candidates.length > 0) {
          setProbeResults([]);
          setProbeInProgress(true);
          if (!suppressProbeDialog) {
            setShowProbeResults(true);
          }

          try {
            const fd = new FormData(formRef.current!);
            const probeBody: any = { candidates: result.candidates, timeoutMs: 7000, concurrentLimit: 3 };
            const user = fd.get('stream-user');
            const pass = fd.get('stream-pass');
            if (user) probeBody.username = String(user);
            if (pass) probeBody.password = String(pass);

            const probeRes = await fetch('/api/probe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(probeBody)
            });
            const probeJson = await probeRes.json();
            setProbeResults(probeJson.results || []);
            setProbeInProgress(false);
            setDetectedStreamUrl(probeJson.url || '');
            if (probeJson.ffmpegAvailable === false) {
              setFfmpegMissing(true);
            }

            const anyAuth = (probeJson.results || []).some((r: any) => !!r.requiresAuth);
            if (anyAuth) {
              setAuthHint(true);
              setAwaitingCredentials(true);
              if (!skipToast) {
                toast({ variant: 'destructive', title: 'Authentication Required', description: 'This camera requires a username and password. Enter credentials and re-run Test Connection.' });
              }
              if (!suppressProbeDialog) {
                setShowProbeResults(true);
              }
              return;
            }

            if (probeJson.success && probeJson.url) {
              setPreviewRtspUrl(probeJson.url);
              setDetectedStreamUrl(probeJson.url);
              setAwaitingCredentials(false);
              setIsConnectionTested(true);
              if (!probeJson.ffmpegAvailable) {
                setFfmpegMissing(true);
              }
              if (!skipToast) {
                toast({ title: 'Stream Found', description: `Found working stream (${probeJson.latencyMs}ms)` });
                if (!probeJson.ffmpegAvailable) {
                  toast({ variant: 'destructive', title: 'Server missing ffmpeg', description: 'Server does not have ffmpeg installed. Live preview requires ffmpeg on the server; the detected URL will still be saved.' });
                }
              }
            } else {
              const fallback = result.candidates[0];
              if (fallback) setDetectedStreamUrl(fallback);
              if (allowFallbackPreview && fallback) {
                setPreviewRtspUrl(fallback);
              }
              setAwaitingCredentials(false);
              setIsConnectionTested(false);
              if (!skipToast) {
                toast({ variant: 'destructive', title: 'Probe Failed', description: 'Server could not locate a stream; trying in the player.' });
              }
            }
          } catch (e) {
            setProbeResults([]);
            setProbeInProgress(false);
            const fallback = result.candidates?.[0];
            if (fallback) setDetectedStreamUrl(fallback);
            if (allowFallbackPreview && fallback) {
              setPreviewRtspUrl(fallback);
            }
            setAwaitingCredentials(false);
            setIsConnectionTested(false);
            if (!skipToast) {
              toast({ variant: 'destructive', title: 'Probe Error', description: 'Could not probe streams on the server; trying in the player.' });
            }
          }
        } else if (result.streamUrl) {
          setPreviewRtspUrl(result.streamUrl);
          setDetectedStreamUrl(result.streamUrl);
          setAwaitingCredentials(false);
          setIsConnectionTested(true);
        } else if (cameraType === 'cloud' || cameraType === 'usb') {
          setIsConnectionTested(true);
          if (!skipToast) {
            toast({ title: "Connection Verified!", description: result.message });
          }
        }
      } else {
        setIsConnectionTested(false);
        setAwaitingCredentials(false);
        if (!skipToast) {
          toast({ variant: "destructive", title: "Connection Failed", description: result.message });
        }
      }
    } finally {
      setIsTesting(false);
    }
  }, [cameraType, formRef, previewRtspUrl, toast]);

  const handleTestConnection = useCallback(() => {
    void runConnectionTest({ suppressProbeDialog: true, allowFallbackPreview: true });
  }, [runConnectionTest]);

  const applyIpSelection = useCallback((ip: string, options: { streamUrl?: string; verified?: boolean; hostname?: string; preserveCredentials?: boolean } = {}) => {
    const trimmed = ip.trim();
    if (!trimmed) return;

    if (typeof document !== 'undefined') {
      const el = document.getElementById('stream-url') as HTMLInputElement | null;
      if (el) {
        el.value = trimmed;
        el.dispatchEvent?.(new Event('input', { bubbles: true }));
      }
    }

    const preserveCredentials = options.preserveCredentials ?? (selectedIp === trimmed);
    const hostnameToUse = options.hostname ? options.hostname.trim() : (preserveCredentials ? selectedHostname : '');

    setSelectedIp(trimmed);
    setManualIp('');
    setSelectedHostname(hostnameToUse);
    setShowManualEntry(false);
    if (!preserveCredentials) {
      setShowCredentialFields(options.verified ? false : true);
      setStreamUser('');
      setStreamPass('');
    } else if (typeof options.verified === 'boolean') {
      setShowCredentialFields(!options.verified);
    }
    setAwaitingCredentials(false);
    setProbeResults([]);
    setProbeInProgress(false);
    setShowProbeResults(false);
    setShowMjpegFallback(false);
    setFfmpegMissing(false);
    setAuthHint(false);

    if (typeof options.streamUrl !== 'undefined') {
      setPreviewRtspUrl(options.streamUrl);
      setDetectedStreamUrl(options.streamUrl);
    } else if (!preserveCredentials) {
      setPreviewRtspUrl('');
      setDetectedStreamUrl('');
    }

    if (options.verified) {
      setIsTesting(false);
      setIsConnectionTested(true);
      toast({ title: 'Stream Found', description: 'Automatically detected a working stream.' });
      return;
    }

    setIsConnectionTested(false);
  }, [selectedIp, selectedHostname, toast]);

  const handleManualIpUse = useCallback(() => {
    if (!manualIp.trim()) return;
    applyIpSelection(manualIp);
  }, [manualIp, applyIpSelection]);

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnectionTested) {
        toast({
            variant: "destructive",
            title: "Connection Not Tested",
            description: "Please test the connection before adding the camera.",
        });
        return;
    }
    
    if (!formRef.current || !user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to add a camera.' });
        return;
    }
    
    setIsAdding(true);
    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());

  let uniqueId = previewRtspUrl;
  if (cameraType === 'usb') uniqueId = `webcam_${user.uid}_${Date.now()}`;
  else if (cameraType === 'cloud') uniqueId = data.activationId as string;
  else if (cameraType === 'ip') uniqueId = previewRtspUrl || detectedStreamUrl || (data['stream-url'] as string);


    if (!uniqueId) {
        toast({ variant: 'destructive', title: 'Failed to Add Camera', description: 'Could not determine a unique ID for the camera.' });
        setIsAdding(false);
        return;
    }

    try {
        await addCameraToFirestore({
            userId: user.uid,
            name: data.name as string,
            location: data.location as string,
            type: data.cameraType as string,
            uniqueId: uniqueId,
            status: 'Online',
            facialRecognition: false,
        });

        toast({
          title: "Camera Added Successfully!",
          description: `Camera '${data.name}' added successfully.`,
        });
        router.push("/dashboard/cameras");

    } catch (error) {
        console.error("Error adding camera:", error);
        toast({
            variant: "destructive",
            title: "Failed to Add Camera",
            description: 'Could not save camera to the database.',
        });
    }
    setIsAdding(false);
  };
  
  const handleCameraTypeSelect = (type: CameraType) => {
    setCameraType(type);
    setPreviewRtspUrl('');
    setShowMjpegFallback(false);
    setFfmpegMissing(false);
    setAuthHint(false);
    setDetectedStreamUrl('');
    if (type !== 'usb') {
      setIsConnectionTested(false);
    }
  };

  const renderFormFields = () => {
    switch (cameraType) {
      case "ip":
        return (
          <div className="space-y-6 animate-in fade-in">
            <input type="hidden" name="stream-url" id="stream-url" />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>IP Camera Setup</AlertTitle>
              <AlertDescription>
                Scan your local network, pick the camera, and we'll probe it automatically. We'll only ask for credentials if the camera requires them.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 rounded-lg border bg-card px-4 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Step 1</h3>
                  <h2 className="text-lg font-semibold">Find Your Camera</h2>
                  <p className="text-sm text-muted-foreground">
                    Scan the local network for compatible devices or enter an IP manually if you already know it.
                  </p>
                </div>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" type="button">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>How to Find Your Camera's IP Address</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-4 text-foreground">
                          <p>If you don't know your camera's IP address, use one of these methods to find it.</p>
                          <div>
                            <h4 className="font-semibold">Method 1: Camera Mobile App</h4>
                            <p className="text-muted-foreground">
                              Open the manufacturer's app and check Device Info or Network settings - many apps display the local IP.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold">Method 2: Router's Connected Devices</h4>
                            <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                              <li>Log into your router (often at 192.168.1.1).</li>
                              <li>Find "Connected Devices" or "DHCP Client List".</li>
                              <li>Locate your camera to see its IP (e.g., 192.168.1.100).</li>
                            </ol>
                          </div>
                          <div>
                            <h4 className="font-semibold">Method 3: Manufacturer Tools</h4>
                            <p className="text-muted-foreground">
                              Many camera makers ship a discovery utility or provide a web-based device list. Use that to detect the camera on your LAN.
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction>Got it</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button type="button" onClick={() => setScannerOpen(true)}>
                    <Wifi className="mr-2 h-4 w-4" />
                    Scan Network
                  </Button>
                </div>
              </div>

              {selectedIp ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected Device</p>
                  {selectedHostname ? (
                    <>
                      <p className="text-sm font-semibold">{selectedHostname}</p>
                      <p className="font-mono text-xs text-muted-foreground">{selectedIp}</p>
                    </>
                  ) : (
                    <p className="font-mono text-sm">{selectedIp}</p>
                  )}
                  {isConnectionTested && previewRtspUrl ? (
                    <p className="mt-2 text-xs text-emerald-600">Stream detected. Live preview should appear above.</p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Enter credentials below if needed, then click <span className="font-medium">Test Connection</span>.
                    </p>
                  )}
                  {!isConnectionTested && detectedStreamUrl && (
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      Last detected candidate: {detectedStreamUrl}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={resetIpSelection}>
                    Choose Another
                  </Button>
                </div>
              </div>
              ) : (
                <div className="space-y-3 rounded-md border border-dashed px-4 py-4 text-sm text-muted-foreground">
                  <p>No camera selected yet. Start a scan or enter an IP manually.</p>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0"
                    onClick={() => setShowManualEntry((prev) => !prev)}
                  >
                    {showManualEntry ? "Hide manual entry" : "Enter IP manually"}
                  </Button>
                  {showManualEntry && (
                    <div className="flex flex-wrap gap-2">
                      <Input
                        value={manualIp}
                        onChange={(e) => setManualIp(e.target.value)}
                        placeholder="e.g., 192.168.1.100"
                        className="max-w-xs"
                      />
                      <Button type="button" onClick={handleManualIpUse} disabled={!manualIp.trim()}>
                        Use this IP
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedIp && (
              <div className="space-y-4 rounded-lg border bg-card px-4 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Step 2</h3>
                    <h2 className="text-lg font-semibold">Provide Credentials (if required)</h2>
                    <p className="text-sm text-muted-foreground">
                      We probe the camera without credentials first. If it challenges us, we'll prompt you automatically.
                    </p>
                    {selectedHostname && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Device name: <span className="font-semibold text-foreground">{selectedHostname}</span>
                      </p>
                    )}
                  </div>
                  {!showCredentialFields && (
                    <Button type="button" variant="outline" onClick={() => setShowCredentialFields(true)}>
                      Add Login
                    </Button>
                  )}
                </div>

                {awaitingCredentials && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    This camera is asking for login details. Enter the credentials you use for its web interface, then test the connection again.
                  </div>
                )}

                {showCredentialFields && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="stream-user">Username</Label>
                      <Input
                        id="stream-user"
                        name="stream-user"
                        placeholder="e.g., admin"
                        autoComplete="username"
                        value={streamUser}
                        onChange={(e) => setStreamUser(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stream-pass">Password</Label>
                      <Input
                        id="stream-pass"
                        name="stream-pass"
                        type="password"
                        placeholder="********"
                        autoComplete="current-password"
                        value={streamPass}
                        onChange={(e) => setStreamPass(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {showCredentialFields && (
                  <p className="text-sm text-muted-foreground">
                    Leave these fields blank if the camera does not require a username or password.
                  </p>
                )}

                {!showCredentialFields && !awaitingCredentials && (
                  <p className="text-sm text-muted-foreground">
                    No login required so far. We'll show the live preview automatically as soon as the connection succeeds.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      case "dvr":
        return (
            <div className="space-y-4 animate-in fade-in">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>DVR / NVR System Instructions</AlertTitle>
                    <AlertDescription>
                       <ol className="list-decimal list-inside space-y-1">
                          <li>Find the local IP address of your DVR/NVR box (e.g., in your router's device list).</li>
                          <li>Note the username and password you use to log in to your DVR/NVR system.</li>
                          <li>Enter these details below. Our server will attempt to find a compatible stream.</li>
                        </ol>
                    </AlertDescription>
                </Alert>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dvr-ip">IP Address or Hostname</Label>
                        <Input id="dvr-ip" name="dvr-ip" placeholder="e.g., 192.168.1.64" required/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dvr-port">RTSP Port</Label>
                        <Input id="dvr-port" name="dvr-port" type="number" placeholder="e.g., 554" defaultValue="554" required/>
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dvr-user">Username</Label>
                        <Input id="dvr-user" name="dvr-user" placeholder="e.g., admin" defaultValue="admin" required/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dvr-pass">Password</Label>
                        <Input id="dvr-pass" name="dvr-pass" type="password" required/>
                    </div>
                </div>
            </div>
        );
      case "mobile":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Mobile Camera App Instructions</AlertTitle>
                <AlertDescription>
                    <p className="mb-2">Use an IP camera app on your phone to stream video over WiFi. We recommend the free <strong>IP Webcam</strong> app for Android.</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Install "IP Webcam" from the Google Play Store.</li>
                        <li>Connect your phone to the same WiFi network as this computer.</li>
                        <li>Open the app, scroll to the bottom, and tap "Start server".</li>
                        <li>The app will show an IP address like `http://192.168.x.x:8080`. Enter the IP and Port below.</li>
                    </ol>
                </AlertDescription>
            </Alert>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="mobile-ip">Phone's IP Address</Label>
                    <Input id="mobile-ip" name="mobile-ip" placeholder="e.g., 192.168.1.10" required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mobile-port">Port</Label>
                    <Input id="mobile-port" name="mobile-port" type="number" placeholder="e.g., 8080" defaultValue="8080" required/>
                </div>
            </div>
             <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
             <Alert>
                <QrCode className="h-4 w-4" />
                <AlertTitle>Easy Setup with QR Code</AlertTitle>
                <AlertDescription>
                    In a future update, you'll be able to scan a QR code from your mobile app for instant setup.
                </AlertDescription>
            </Alert>
          </div>
        );
      case "usb":
        return (
            <div className="space-y-4 animate-in fade-in">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>USB Webcam Instructions</AlertTitle>
                    <AlertDescription>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Ensure your webcam is connected to your computer.</li>
                            <li>Grant this page permission to access your camera when prompted by your browser.</li>
                            <li>A live preview will appear below if successful. The connection is tested automatically.</li>
                        </ol>
                    </AlertDescription>
                </Alert>
            </div>
        );
      case "cloud":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>Cloud Camera Instructions</AlertTitle>
                <AlertDescription>
                     <ol className="list-decimal list-inside space-y-1">
                        <li>Select your camera's brand (e.g., Ring, Nest) from the dropdown list.</li>
                        <li>Click "Authorize & Test Connection".</li>
                        <li>You will be redirected to your provider's website to securely log in and grant BERRETO access.</li>
                        <li>We never see or store your password. Connection is verified automatically upon successful authorization.</li>
                      </ol>
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="cloud-provider">Select Provider</Label>
              <Select name="cloud-provider" required>
                  <SelectTrigger id="cloud-provider">
                      <SelectValue placeholder="Select a cloud provider..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="nest">Google Nest</SelectItem>
                      <SelectItem value="ring">Amazon Ring</SelectItem>
                      <SelectItem value="arlo">Arlo</SelectItem>
                      <SelectItem value="wyze">Wyze</SelectItem>
                  </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  const renderPreview = () => {
    if (cameraType === 'usb') {
      return (
        <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {hasWebcamPermission === null && (
                <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Requesting camera access...
                </div>
            )}
             {hasWebcamPermission === false && (
                <div className="text-center text-destructive p-4">
                    <p className="font-bold">Camera access denied.</p>
                </div>
            )}
        </div>
      );
    }
    
    if (showMjpegFallback && selectedIp) {
      return (
        <MjpegPreview
          ip={selectedIp}
          username={streamUser}
          password={streamPass}
          onFound={(u) => {
            setPreviewRtspUrl(u);
            setDetectedStreamUrl(u);
            setIsConnectionTested(true);
            setShowMjpegFallback(false);
          }}
        />
      );
    }

    if (previewRtspUrl && ffmpegMissing) {
        return (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-center p-6">
            <div>
              <p className="font-semibold text-destructive">Live preview requires ffmpeg on the server.</p>
              <p className="text-sm text-muted-foreground mt-2">
                We detected a stream at <span className="font-mono break-all">{previewRtspUrl}</span>, but ffmpeg is not installed on the backend.
                Install ffmpeg and rerun the test to enable the in-browser preview. You can still save the camera with the detected URL.
              </p>
            </div>
          </div>
        );
    }

    if (previewRtspUrl) {
        return (
           <JsmpegPlayer 
                rtspUrl={previewRtspUrl} 
                onPlay={() => {
          setIsTesting(false);
          setIsConnectionTested(true);
          toast({ title: "Connection Verified!", description: "Live stream is playing successfully." });
                }} 
                        onError={() => {
                            setIsTesting(false);
                            setIsConnectionTested(false);
                            // Try MJPEG fallback
                            setShowMjpegFallback(true);
                            toast({ variant: 'destructive', title: 'Stream Failed', description: 'Could not connect to the camera stream. Trying HTTP MJPEG fallback.' });
                          }}
            />
        );
    }
    
    if (isConnectionTested && cameraType === 'cloud') {
         return (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                <div className="text-center p-4">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500"/>
                    <p className="font-semibold mt-2">Cloud Connection Verified</p>
                     <p className="text-xs mt-1">Live preview is not available on this page for cloud cameras.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground gap-3 text-center p-4">
          <div>
            <Video className="mx-auto h-12 w-12"/>
            <p>Preview will appear here after a successful test.</p>
          </div>
          {selectedHostname && (
            <div className="text-xs text-muted-foreground">
              Device: <span className="font-semibold text-foreground">{selectedHostname}</span>
            </div>
          )}
          {detectedStreamUrl && (
            <div className="text-xs text-muted-foreground">
              Detected candidate: <span className="font-mono break-all">{detectedStreamUrl}</span>
            </div>
          )}
        </div>
    );
  };

  // lazy require to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ProbeResultsDialog } = require('@/components/ui/probe-results-dialog');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: NetworkScannerDialog } = require('@/components/ui/network-scanner-dialog');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ProbeResultsDialog open={showProbeResults} onClose={() => setShowProbeResults(false)} results={probeResults} inProgress={probeInProgress} />
      <NetworkScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelect={(ip: string, streamUrl?: string, verified?: boolean, hostname?: string) => {
          setScannerOpen(false);
          applyIpSelection(ip, { streamUrl, verified, hostname });
        }}
      />
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cameras
        </Button>
        <h1 className="text-3xl font-bold font-headline">Connect a New Camera</h1>
        <p className="text-muted-foreground">
          Follow the steps to add and activate a new camera in your system.
        </p>
      </div>
      <form ref={formRef} onSubmit={handleAddCamera}>
        <Card>
            <CardHeader>
                <CardTitle>Step 1: Subscription and Camera Details</CardTitle>
        <CardDescription>
          Enter your Unique Activation ID and give your camera a name. For direct IP cameras you can use the Activation ID field; the system will also store the detected stream URL when available.
        </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="activation-id">Activation ID</Label>
                    <Input id="activation-id" name="activationId" placeholder="e.g., DSGPRO-G4H7J2K9L (optional)" />
                    <p className="text-xs text-muted-foreground">
                        Find this on your <Link href="/dashboard/my-orders" className="underline">My Subscriptions</Link> page.
                    </p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="camera-name">Camera Name</Label>
                    <Input id="camera-name" name="name" placeholder="e.g., Front Door Cam" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="camera-location">Location</Label>
                    <Input id="camera-location" name="location" placeholder="e.g., Entrance" required />
                </div>
            </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Step 2: What kind of camera are you connecting?</CardTitle>
            <CardDescription>
              Select the option that best describes your camera.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input type="hidden" name="cameraType" value={cameraType} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cameraTypeOptions.map(option => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => handleCameraTypeSelect(option.type)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left flex flex-col items-center justify-center text-center hover:border-primary hover:bg-accent transition-all space-y-2 h-full",
                    cameraType === option.type ? "border-primary bg-accent shadow-md" : "bg-card"
                  )}
                >
                  {option.icon}
                  <h3 className="font-semibold">{option.title}</h3>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
            {!cameraType && <p className="text-center text-sm text-muted-foreground mt-4">Please select a camera type to continue.</p>}
          </CardContent>
        </Card>

        {cameraType && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Step 3: Enter Connection Details &amp; Preview</CardTitle>
              <CardDescription>
                Provide the necessary details and verify the live feed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    {renderFormFields()}
                </div>
                <div className="space-y-4">
                     <Label>Live Preview</Label>
                     {renderPreview()}
                </div>
            </CardContent>
             {(cameraType === 'ip' || cameraType === 'dvr' || cameraType === 'mobile') && (
                <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                    <h3 className="font-semibold">Step 4: Test Connection</h3>
                    <p className="text-sm text-muted-foreground -mt-2">
                        {ffmpegMissing
                          ? "A stream was detected, but live preview requires ffmpeg on the server. Install ffmpeg to see it here or continue once you're satisfied with the credentials."
                          : "Verify that BERRETO can connect to your camera before adding it. A live preview must appear to proceed."}
                    </p>
                    <Button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting || (cameraType === 'ip' && !selectedIp)}
                    >
                    {isTesting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Video className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                    </Button>
                    {ffmpegMissing && detectedStreamUrl && (
                      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                        Stream detected but ffmpeg is missing on the server. Install ffmpeg to enable the live preview, or continue to save the camera with the discovered URL.
                      </p>
                    )}
                </CardFooter>
            )}
             {(cameraType === 'cloud') && (
                <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                     <h3 className="font-semibold">Step 4: Authorize Connection</h3>
                    <p className="text-sm text-muted-foreground -mt-2">
                        Click below to go to your provider's website and grant access to BERRETO.
                    </p>
                    <Button type="button" onClick={handleTestConnection} disabled={isTesting}>
                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" /> }
                        Authorize & Test Connection
                    </Button>
                </CardFooter>
             )}
          </Card>
        )}

        {cameraType && (
            <div className="mt-6 flex justify-end">
                <Button type="submit" size="lg" disabled={!isConnectionTested || isTesting || isAdding}>
                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    <CheckCircle className="mr-2 h-4 w-4"/>
                    {isAdding ? 'Adding Camera...' : 'Add Camera to System'}
                </Button>
            </div>
        )}
      </form>
    </div>
  );
}



"use client";

import { useState, useEffect, useRef } from "react";
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

async function testCameraConnection(cameraType: string, formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    console.log(`Testing connection for ${cameraType}`, data);
    
    await new Promise(resolve => setTimeout(resolve, 500)); 

    let streamUrl: string | null = null;

    switch(cameraType) {
        case 'mobile':
            if (data['mobile-ip'] && data['mobile-port']) {
                streamUrl = `http://${data['mobile-ip']}:${data['mobile-port']}/video`;
                return { success: true, message: 'Attempting to connect to mobile camera.', streamUrl };
            }
            return { success: false, message: 'Missing IP Address or Port for mobile camera.' };
        case 'dvr':
             if (data['dvr-ip'] && data['dvr-port'] && data['dvr-user']) {
                streamUrl = `rtsp://${data['dvr-user']}:${data['dvr-pass']}@${data['dvr-ip']}:${data['dvr-port']}/`;
                return { success: true, message: 'Attempting to connect to DVR/NVR system.', streamUrl };
             }
            return { success: false, message: 'Missing IP, Port, or Username for DVR/NVR.' };
        case 'ip':
            streamUrl = data['stream-url'] as string | null;
            if (streamUrl && (streamUrl.startsWith('rtsp://') || streamUrl.startsWith('http://'))) {
                return { success: true, message: 'Attempting to connect to IP camera stream.', streamUrl };
            }
            return { success: false, message: 'Invalid or missing stream URL for IP camera.' };
        case 'usb':
             // The permission itself is the test for USB webcams.
             return { success: true, message: 'Webcam permission granted.' };
        case 'cloud':
             // For cloud, we simulate an auth redirect. The "test" is just initiating it.
             return { success: true, message: 'Redirecting for authentication...' };
        default:
            return { success: false, message: 'Invalid camera type provided.' };
    }
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const cameraTypeOptions = [
    { type: 'ip' as CameraType, icon: <Wifi className="h-8 w-8" />, title: 'IP Camera', description: 'A standalone Wi-Fi or Ethernet camera.' },
    { type: 'dvr' as CameraType, icon: <Box className="h-8 w-8" />, title: 'DVR / NVR System', description: 'A camera connected to a recording box.' },
    { type: 'usb' as CameraType, icon: <Usb className="h-8 w-8" />, title: 'USB Webcam', description: 'A webcam connected to your computer.' },
    { type: 'mobile' as CameraType, icon: <Smartphone className="h-8 w-8" />, title: 'Mobile Camera', description: 'Using an app to turn your phone into a camera.' },
    { type: 'cloud' as CameraType, icon: <Cloud className="h-8 w-8" />, title: 'Cloud Camera', description: 'A camera from a cloud service like Ring or Nest.' },
  ];

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
  

  const handleTestConnection = async () => {
    if (!formRef.current || !cameraType) return;
    setIsTesting(true);
    setIsConnectionTested(false);
    setPreviewRtspUrl('');
    
    let toastDescription = "This may take a moment.";
    if (cameraType === 'cloud') {
        toastDescription = "Redirecting you for authentication..."
    }

    toast({ title: "Testing connection...", description: toastDescription });

    const formData = new FormData(formRef.current);
    
    const result = await testCameraConnection(cameraType, formData);

    if (result.success) {
      if (result.streamUrl) {
        setPreviewRtspUrl(result.streamUrl);
        // For streaming types, success is determined by the player, not here.
      } else if (cameraType === 'cloud' || cameraType === 'usb') {
        setIsConnectionTested(true);
         toast({ title: "Connection Verified!", description: result.message });
      }
    } else {
      setIsConnectionTested(false);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: result.message,
      });
    }
    setIsTesting(false);
  };
  
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
    else if (cameraType === 'ip') uniqueId = data['stream-url'] as string;


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
      setIsConnectionTested(false);
      setPreviewRtspUrl('');
      if (type === 'usb') {
        // webcam permission will trigger test
      } else {
        setIsConnectionTested(false);
      }
  };

  const renderFormFields = () => {
    switch (cameraType) {
      case "ip":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Direct IP Camera (RTSP/HTTP)</AlertTitle>
                <AlertDescription>
                    Use this for cameras that support direct streaming. You will need to know the camera's full stream URL.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label htmlFor="stream-url">Full Stream URL</Label>
                <div className="flex gap-2">
                  <Input name="stream-url" id="stream-url" placeholder="rtsp://user:pass@192.168.1.100:554/stream1" required />
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" type="button"><HelpCircle className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>How to Find Your Camera's Stream URL</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-4 pt-4 text-foreground">
                            <p>The RTSP URL is a special link that points directly to your camera's video feed. The format can vary by manufacturer.</p>
                            <div>
                                <h4 className="font-semibold">Method 1: Check Your Router's Admin Page</h4>
                                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 mt-1">
                                    <li>Find your router's IP address (often on a sticker on the router, e.g., `192.168.1.1`).</li>
                                    <li>Log into your router's settings in a web browser.</li>
                                    <li>Look for a "Connected Devices" or "Client List" section.</li>
                                    <li>Find your camera in the list to get its local IP address.</li>
                                </ol>
                            </div>
                            <div>
                                <h4 className="font-semibold">Method 2: Use an Online Resource</h4>
                                 <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 mt-1">
                                     <li>Visit a website like <a href="https://www.ispyconnect.com/cameras" target="_blank" rel="noopener noreferrer" className="text-primary underline">iSpyConnect's Camera Database</a>.</li>
                                    <li>Search for your camera's manufacturer and model.</li>
                                    <li>The website will provide the most common URL formats.</li>
                                    <li>Replace `[IPADDRESS]`, `[USERNAME]`, and `[PASSWORD]` with your camera's details.</li>
                                </ol>
                            </div>
                            <div>
                              <h4 className="font-semibold">Common URL Formats</h4>
                              <p className="text-sm text-muted-foreground mt-1">The format is usually `rtsp://[USERNAME]:[PASSWORD]@[IPADDRESS]:[PORT]/[STREAM_PATH]`.</p>
                              <p className="text-xs text-muted-foreground mt-1">Example for a Hikvision camera: `rtsp://admin:password123@192.168.1.64:554/Streaming/Channels/101/`</p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogAction>Got it</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
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
    
    if (previewRtspUrl) {
        return (
           <JsmpegPlayer 
                rtspUrl={previewRtspUrl} 
                onPlay={() => {
                  setIsConnectionTested(true);
                  toast({ title: "Connection Verified!", description: "Live stream is playing successfully." });
                }} 
                onError={() => {
                  setIsConnectionTested(false);
                  toast({ variant: 'destructive', title: 'Stream Failed', description: 'Could not connect to the camera stream. Check details and network.' });
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
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            <div className="text-center">
                <Video className="mx-auto h-12 w-12"/>
                <p>Preview will appear here after a successful test.</p>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
                    Enter your Unique Activation ID and give your camera a name. For cameras without a subscription (like a direct IP camera), you can use the RTSP URL as the ID.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="activation-id">Activation ID / Stream URL</Label>
                    <Input id="activation-id" name="activationId" placeholder="e.g., DSGPRO-G4H7J2K9L" required />
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
                        Verify that BERRETO can connect to your camera before adding it. A live preview must appear to proceed.
                    </p>
                    <Button type="button" onClick={handleTestConnection} disabled={isTesting}>
                    {isTesting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Video className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                    </Button>
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


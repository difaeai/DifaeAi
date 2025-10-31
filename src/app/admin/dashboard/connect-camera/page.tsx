
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
import { ArrowLeft, Video, CheckCircle, Loader2, Info, QrCode, Cloud, Lock, Wifi, Usb, Smartphone, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import type { Camera } from "@/lib/types";
import { cn } from "@/lib/utils";
import JsmpegPlayer from "@/components/jsmpeg-player";

type CameraType = "" | "ip" | "dvr" | "mobile" | "usb" | "cloud";

async function testCameraConnection(cameraType: string, formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    console.log(`Testing connection for ${cameraType}`, data);
    
    await new Promise(resolve => setTimeout(resolve, 500)); 

    switch(cameraType) {
        case 'mobile':
            if (data['mobile-ip'] && data['mobile-port']) {
                const streamUrl = `http://${data['mobile-ip']}:${data['mobile-port']}/video`;
                return { success: true, message: 'Attempting to connect to mobile camera.', streamUrl };
            }
            return { success: false, message: 'Missing IP Address or Port for mobile camera.' };
        case 'dvr':
             if (data['dvr-ip'] && data['dvr-port'] && data['dvr-user']) {
                const streamUrl = `rtsp://${data['dvr-user']}:${data['dvr-pass']}@${data['dvr-ip']}:${data['dvr-port']}/`;
                return { success: true, message: 'Attempting to connect to DVR/NVR system.', streamUrl };
             }
            return { success: false, message: 'Missing IP, Port, or Username for DVR/NVR.' };
        case 'ip':
            const streamUrl = data['stream-url'] as string | null;
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

async function addCamera(cameraData: Omit<Camera, 'id' | 'createdAt'>): Promise<string> {
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
    { type: 'ip' as CameraType, icon: <Wifi className="h-8 w-8" />, title: 'IP Camera', description: 'Is it a standalone Wi-Fi or Ethernet camera?' },
    { type: 'dvr' as CameraType, icon: <Box className="h-8 w-8" />, title: 'DVR / NVR System', description: 'Is your camera part of a system with a recording box?' },
    { type: 'usb' as CameraType, icon: <Usb className="h-8 w-8" />, title: 'USB Webcam', description: 'Is it a webcam connected to your computer via USB?' },
    { type: 'mobile' as CameraType, icon: <Smartphone className="h-8 w-8" />, title: 'Mobile Camera', description: 'Are you using an app to turn your phone into a camera?' },
    { type: 'cloud' as CameraType, icon: <Cloud className="h-8 w-8" />, title: 'Cloud Camera', description: 'Is your camera from a cloud service like Ring, Nest, or Arlo?' },
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
        // Success for streaming types is now determined by the player's onPlay callback
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
    
    if (!formRef.current) {
        toast({ variant: 'destructive', title: 'Form Error', description: 'An unexpected form error occurred.' });
        return;
    }
    
    setIsAdding(true);
    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());

     let uniqueId;
    if (cameraType === 'ip') uniqueId = data['stream-url'] as string;
    else if (cameraType === 'dvr' || cameraType === 'mobile') uniqueId = previewRtspUrl;
    else if (cameraType === 'usb') uniqueId = `webcam_${data.userId}_${Date.now()}`;
    else uniqueId = data.activationId as string;

    if (!uniqueId) {
        toast({ variant: 'destructive', title: 'Failed to Add Camera', description: 'Could not determine a unique ID for the camera.' });
        setIsAdding(false);
        return;
    }

    try {
        await addCamera({
            userId: data.userId as string,
            name: data.name as string,
            location: data.location as string,
            type: data.cameraType as string,
            uniqueId: uniqueId,
            status: 'Online',
            facialRecognition: false,
        });

        toast({
          title: "Camera Added Successfully!",
          description: `Camera '${data.name}' added to user's account.`,
        });
        router.push("/admin/dashboard/cameras");
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Failed to Add Camera",
        description: "Could not save camera to database.",
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
                    Use this for cameras that support direct streaming over your local Wi-Fi, without needing the manufacturer's app. You will need to know the camera's specific stream URL.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label htmlFor="stream-url">Full Stream URL</Label>
                <Input name="stream-url" id="stream-url" placeholder="rtsp://user:pass@192.168.1.100:554/stream1" required />
                <p className="text-xs text-muted-foreground">
                    Include username and password in the URL if your camera requires authentication.
                </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm hover:no-underline">Common URL Formats & Examples</AccordionTrigger>
                    <AccordionContent>
                        <div className="text-xs text-muted-foreground space-y-2 pt-2">
                            <p><strong>TP-Link:</strong> <code className="font-code">rtsp://ip:554/stream1</code></p>
                            <p><strong>D-Link:</strong> <code className="font-code">http://ip/video.cgi</code></p>
                            <p><strong>Foscam:</strong> <code className="font-code">rtsp://ip:88/videoMain</code></p>
                            <p><strong>MJPEG Stream:</strong> <code className="font-code">http://ip/mjpeg.cgi</code></p>
                            <p><strong>Generic H.264:</strong> <code className="font-code">http://ip/videostream.cgi</code></p>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </div>
        );
      case "dvr":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>DVR / NVR System</AlertTitle>
                <AlertDescription>
                    Connect to a recording system. We support most major brands like Hikvision, Dahua, CP Plus, Godrej, and other ONVIF-compliant devices.
                </AlertDescription>
            </Alert>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dvr-ip">IP Address or Hostname</Label>
                    <Input id="dvr-ip" name="dvr-ip" placeholder="e.g., 192.168.1.64" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dvr-port">RTSP Port</Label>
                    <Input id="dvr-port" name="dvr-port" type="number" placeholder="e.g., 554" required />
                </div>
            </div>
             <div className="grid sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="dvr-user">Username</Label>
                    <Input id="dvr-user" name="dvr-user" placeholder="e.g., admin" defaultValue="admin" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dvr-pass">Password</Label>
                    <Input id="dvr-pass" name="dvr-pass" type="password" required />
                </div>
            </div>
             <p className="text-xs text-muted-foreground">
                We will attempt to auto-detect the brand and specific stream path during connection testing.
            </p>
          </div>
        );
      case "mobile":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Mobile Camera App Instructions</AlertTitle>
                <AlertDescription>
                    <p className="mb-2">Use an IP camera app on your phone (like <strong>IP Webcam</strong>, <strong>DroidCam</strong>, or <strong>iVCam</strong>) to stream video over WiFi.</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Install an IP camera app on your phone.</li>
                        <li>Connect your phone to the same WiFi network as your computer.</li>
                        <li>Start the server in the mobile app. It will show you an IP address and port.</li>
                        <li>Enter the details below to connect.</li>
                    </ol>
                </AlertDescription>
            </Alert>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="mobile-ip">Phone's IP Address</Label>
                    <Input id="mobile-ip" name="mobile-ip" placeholder="e.g., 192.168.1.10" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mobile-port">Port</Label>
                    <Input id="mobile-port" name="mobile-port" type="number" placeholder="e.g., 8080" defaultValue="8080" required />
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
            <div className="flex flex-col items-center gap-2 text-center p-4 border rounded-lg bg-muted/50">
                <QrCode className="h-8 w-8 text-primary" />
                <h4 className="font-semibold">Easy Setup with QR Code</h4>
                <p className="text-xs text-muted-foreground">In a future update, you'll be able to scan a QR code from your mobile app for instant setup.</p>
                
            </div>
          </div>
        );
      case "usb":
        return (
            <div className="space-y-4 animate-in fade-in">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>USB Webcam</AlertTitle>
                    <AlertDescription>
                        Using your connected webcam. Connection is tested automatically upon selection.
                    </AlertDescription>
                </Alert>
            </div>
        );
      case "cloud":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>Cloud Camera System (e.g. Ring, Wyze)</AlertTitle>
                <AlertDescription>
                    Use this option if your camera is already connected to a manufacturer's app (like Ring, Google Nest, Arlo, etc.). You will be securely redirected to their website to grant BERRETO permission. 
                    <strong>We never see or store your password.</strong>
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
                onPlay={() => setIsConnectionTested(true)} 
                onError={() => setIsConnectionTested(false)} 
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
                <CardTitle>Step 1: Enter Activation ID</CardTitle>
                <CardDescription>
                    Enter the Unique Activation ID from your approved purchase to begin.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="activation-id">Activation ID</Label>
                    <Input id="activation-id" name="activationId" placeholder="e.g., DSGPRO-G4H7J2K9L" required />
                    <p className="text-xs text-muted-foreground">
                        Find this on your <Link href="/dashboard/my-orders" className="underline">My Subscriptions</Link> page.
                    </p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="user-id">User ID</Label>
                    <Input id="user-id" name="userId" placeholder="Enter the user's unique ID" required />
                </div>
            </CardContent>
        </Card>
        
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Step 2: Camera Details</CardTitle>
                <CardDescription>
                    Give your camera a descriptive name and specify its location.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="camera-name">Camera Name</Label>
                        <Input id="camera-name" name="name" placeholder="e.g., Front Door Cam" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="camera-location">Location</Label>
                        <Input id="camera-location" name="location" placeholder="e.g., Entrance" required />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Step 3: What kind of camera are you connecting?</CardTitle>
            <CardDescription>
              Select the option that best describes your camera.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <input type="hidden" name="cameraType" value={cameraType} />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <CardTitle>Step 4: Enter Connection Details &amp; Preview</CardTitle>
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
                    <h3 className="font-semibold">Step 5: Test Connection</h3>
                    <p className="text-sm text-muted-foreground -mt-2">
                        Verify that BERRETO can connect to your camera before adding it.
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
                     <h3 className="font-semibold">Step 5: Authorize Connection</h3>
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

    
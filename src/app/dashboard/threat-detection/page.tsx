
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Download, FileText, Flame, History, Loader2, Shield, Video, Bot, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { realTimeThreatDetection } from "@/ai/flows/real-time-threat-detection";
// Removed broken server-side calls
// import { getTrainingImages, isMatch } from "@/lib/services/threat-recognition";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Threat = {
  threatType: "Suspicious Movement" | "Fire Hazard" | "Weapon" | "Theft" | "Recognized Threat" | "Prohibited Object" | "Person";
  alertMessage: string;
  timestamp: string;
};

const alertLog: { time: string; type: string; details: string; status: string }[] = [];

const recentReports: { date: string; summary: string }[] = [];

export default function ThreatDetectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [threat, setThreat] = useState<Threat | null>(null);
  // Removed state for training images as the service is broken
  // const [trainingImages, setTrainingImages] = useState<string[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [prohibitedObjectsInput, setProhibitedObjectsInput] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // useEffect(() => {
  //   const fetchTrainingData = async () => {
  //       try {
  //           // This service is broken due to missing admin SDK config
  //           // const urls = await getTrainingImages('training_images/threats');
  //           // setTrainingImages(urls);
  //       } catch (error) {
  //           console.error("Failed to fetch training images:", error);
  //           toast({ variant: 'destructive', title: 'Could not load AI training data.' });
  //       }
  //   };
  //   fetchTrainingData();
  // }, [toast]);

  const drawDetectionBox = useCallback(() => {
    // No-op function to remove drawing logic. The AI analyzes the whole frame.
  }, []);
  
  const clearDetectionBox = useCallback(() => {
    const canvas = canvasRef.current;
     if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
  }, []);

  const handleScan = useCallback(async (isManualScan: boolean = false) => {
    if (!hasCameraPermission || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
    }

    if (isManualScan) {
        setIsLoading(true);
        toast({ title: 'Manual scan initiated...' });
    }

    clearDetectionBox();

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    
    if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const cameraFeedDataUri = canvas.toDataURL('image/jpeg');

        // The logic for checking against trained images is removed because the underlying service is broken.
        
        try {
          const prohibitedObjects = prohibitedObjectsInput.split(',').map(s => s.trim()).filter(Boolean);
          const result = await realTimeThreatDetection({ cameraFeedDataUri, prohibitedObjects });
          
          if (result.threatDetected) {
            const newThreat: Threat = {
                threatType: result.threatType as Threat['threatType'],
                alertMessage: result.alertMessage,
                timestamp: new Date().toLocaleTimeString(),
            };
            setThreat(newThreat);
            drawDetectionBox();
            if (isManualScan) {
                 toast({
                    variant: "destructive",
                    title: `Threat Detected: ${newThreat.threatType}`,
                    description: newThreat.alertMessage,
                });
            }
          } else {
             setThreat(null);
             clearDetectionBox();
             if (isManualScan) {
                 toast({ title: 'All Clear', description: 'No threats detected in the manual scan.' });
             }
          }
    
        } catch (error) {
          console.error("Scan failed", error);
          if (isManualScan) {
              toast({
                variant: "destructive",
                title: "Scan Failed",
                description: "Could not analyze the camera feed.",
              });
          }
        }
    }
     if (isManualScan) setIsLoading(false);
  }, [hasCameraPermission, toast, prohibitedObjectsInput, drawDetectionBox, clearDetectionBox]);
  
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             setIsInitializing(false);
             if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
             // Automatically start scanning after camera is ready
             handleScan(true); 
             scanIntervalRef.current = setInterval(() => handleScan(false), 5000); // Continue scanning every 5 seconds
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsInitializing(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);


  return (
    <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="font-headline">Live Feed</CardTitle>
                    <CardDescription>Your Primary Camera - Real-Time Threat Monitoring is Active</CardDescription>
                </div>
                 <Button onClick={() => handleScan(true)} disabled={isLoading || hasCameraPermission === false}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Video className="mr-2 h-4 w-4" />
                    )}
                    Scan Threats Now
                </Button>
            </CardHeader>
            <CardContent>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                    {isInitializing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="ml-2">Requesting camera access...</p>
                        </div>
                    )}
                </div>
                {hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        BERRETO needs permission to access your camera. Please enable it in your browser's site settings to use this feature.
                    </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            </Card>
        </div>
        <div>
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">Threat Analysis</CardTitle>
                <CardDescription>Results from the real-time monitoring.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        <p className="mt-2">Performing manual scan...</p>
                    </div>
                )}
                {!isLoading && threat && (
                    <Alert variant="destructive">
                        {threat.threatType === 'Fire Hazard' ? <Flame className="h-4 w-4" /> : 
                         threat.threatType === 'Recognized Threat' ? <Bot className="h-4 w-4" /> : 
                         threat.threatType === 'Prohibited Object' ? <Ban className="h-4 w-4" /> : 
                         <AlertTriangle className="h-4 w-4" />}
                        <AlertTitle className="font-headline">{threat.threatType}</AlertTitle>
                        <AlertDescription>
                            <p>{threat.alertMessage}</p>
                            <p className="text-xs text-right mt-2">Detected at {threat.timestamp}</p>
                        </AlertDescription>
                    </Alert>
                )}
                {!isLoading && !threat && (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <Shield className="h-8 w-8 text-green-500"/>
                        <p className="mt-2 font-medium">All Clear</p>
                        <p className="text-sm text-center">No threats detected. Monitoring is active.</p>
                    </div>
                )}
            </CardContent>
            </Card>
        </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Custom Model Training</CardTitle>
                <CardDescription>Define a list of prohibited objects for the AI to detect in the live feed. This acts as your custom-trained model.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="prohibited-objects">Prohibited Objects (comma-separated)</Label>
                    <Input 
                        id="prohibited-objects"
                        placeholder="e.g., knife, gun, person in red shirt"
                        value={prohibitedObjectsInput}
                        onChange={(e) => setProhibitedObjectsInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">The AI will now specifically scan for these items and alert you if they are detected.</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><History /> Alert Log</CardTitle>
                <CardDescription>A log of recent threat detection events from this camera.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alertLog.length > 0 ? alertLog.map((log, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-mono text-xs">{log.time}</TableCell>
                                <TableCell>
                                    <Badge variant={log.status === "Critical" ? "destructive" : log.status === "Warning" ? "secondary" : "default"} className={log.status === "OK" ? "bg-green-500 hover:bg-green-600" : ""}>{log.type}</Badge>
                                </TableCell>
                                <TableCell>{log.details}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No alerts have been logged yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><FileText /> Recent Reports</CardTitle>
                <CardDescription>Quick access to your latest daily security summaries.</CardDescription>
            </CardHeader>
            <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Summary</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentReports.length > 0 ? recentReports.map((report, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{report.date}</TableCell>
                                <TableCell>{report.summary}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No reports are available yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

    
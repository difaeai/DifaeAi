
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  ScanFace,
  BrainCircuit,
  Loader2,
  Camera,
  CircleX,
  Ban,
  Users,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Save,
  Trash2,
  Video,
  PlusCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { realTimeThreatDetection, RealTimeThreatDetectionOutput } from "@/ai/flows/real-time-threat-detection";
import { facialRecognition, FacialRecognitionOutput } from "@/ai/flows/facial-recognition-flow";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { RedditIcon, PinterestIcon } from "@/components/icons";
import { Textarea } from "@/components/ui/textarea";
import { getProhibitedObjects, saveProhibitedObjects } from "@/lib/services/agent";
import { LearnedBehavior, Camera as CameraType } from "@/lib/types";
import { getLearnedBehaviors, saveLearnedBehavior, deleteLearnedBehavior } from "@/lib/services/behaviors";
import { analyzeVideo, VideoAnalysisOutput } from "@/ai/flows/video-analysis-flow";
import { Checkbox } from "@/components/ui/checkbox";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Socials = FacialRecognitionOutput['socials'];
type DetectionResult = RealTimeThreatDetectionOutput & { timestamp: string };
type RecognizedPerson = FacialRecognitionOutput & { timestamp: string };


function TrainAgentPageContents() {
    const { toast } = useToast();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const cameraId = searchParams.get('cameraId');

    const [camera, setCamera] = useState<CameraType | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
    const [identifiedObjects, setIdentifiedObjects] = useState<DetectionResult[]>([]);
    const [recognizedPeople, setRecognizedPeople] = useState<RecognizedPerson[]>([]);
    const [prohibitedObjectsInput, setProhibitedObjectsInput] = useState("");
    
    const [learnedBehaviors, setLearnedBehaviors] = useState<LearnedBehavior[]>([]);
    const [isSavingBehavior, setIsSavingBehavior] = useState(false);
    const [activeBehaviorIds, setActiveBehaviorIds] = useState<string[]>([]);

    // State for Video Analysis
    const [videoUrl, setVideoUrl] = useState("");
    const [videoAnalysisPrompt, setVideoAnalysisPrompt] = useState("");
    const [analysisResult, setAnalysisResult] = useState<VideoAnalysisOutput | null>(null);
    const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
    
    const [behaviorPrompt, setBehaviorPrompt] = useState("");

    const fetchBehaviors = useCallback(async () => {
        if (user && cameraId) {
            try {
                const behaviors = await getLearnedBehaviors(user.uid, cameraId);
                setLearnedBehaviors(behaviors);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error loading behaviors' });
            }
        }
    }, [user, cameraId, toast]);

    useEffect(() => {
        const fetchCameraDetails = async () => {
            if (user && cameraId) {
                const camDocRef = doc(db, 'users', user.uid, 'cameras', cameraId);
                const camDocSnap = await getDoc(camDocRef);
                if (camDocSnap.exists()) {
                    setCamera({ id: camDocSnap.id, ...camDocSnap.data() } as CameraType);
                } else {
                     toast({ variant: "destructive", title: "Camera not found" });
                }
            }
        };
        if(user && cameraId) {
            fetchCameraDetails();
        }
    }, [user, cameraId, toast]);

    const drawDetectionBox = useCallback((detection: DetectionResult) => {
        // This function is kept for potential future use with dynamic bounding boxes,
        // but for now, we are not drawing a fixed box. The AI analyzes the whole frame.
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
        if (!videoRef.current?.srcObject || videoRef.current.paused || videoRef.current.ended) return;

        if(isManualScan) setIsScanning(true);

        const video = videoRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const context = tempCanvas.getContext('2d');
        if (!context) {
            if(isManualScan) setIsScanning(false);
            return;
        }

        context.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        const frameDataUri = tempCanvas.toDataURL('image/jpeg');

        try {
            const prohibitedObjects = prohibitedObjectsInput.split(',').map(s => s.trim()).filter(Boolean);
            
            const activeBehaviors = learnedBehaviors.filter(b => activeBehaviorIds.includes(b.id));
            let combinedBehaviorPrompt = "";
            if (activeBehaviors.length > 0) {
                combinedBehaviorPrompt = activeBehaviors.map((b, i) => `${i + 1}. ${b.prompt}`).join('\n');
            }

            const result = await realTimeThreatDetection({ 
                cameraFeedDataUri: frameDataUri, 
                prohibitedObjects,
                customBehaviorPrompt: combinedBehaviorPrompt
            });
            const newDetection: DetectionResult = { ...result, timestamp: new Date().toLocaleTimeString() };
            
            setDetectionResult(newDetection);
            if (result.threatDetected) {
                setTimeout(() => setDetectionResult(null), 5000);
            }

            if (result.threatDetected) {
                setIdentifiedObjects(prev => [newDetection, ...prev].slice(0, 10));
                drawDetectionBox(newDetection);
                 if (isManualScan) {
                    toast({
                        variant: "destructive",
                        title: `Threat Detected: ${result.detectedObjectName || result.threatType}`,
                        description: result.alertMessage
                    });
                }
            }
            
            if (result.isPersonDetected) {
                if (!result.threatDetected) {
                    setIdentifiedObjects(prev => [newDetection, ...prev].slice(0, 10));
                    drawDetectionBox(newDetection);
                }
                
                const frResult = await facialRecognition({ faceImageDataUri: frameDataUri });
                if (frResult.name !== 'Unknown') {
                    const newPerson: RecognizedPerson = { ...frResult, timestamp: new Date().toLocaleTimeString() };
                    setRecognizedPeople(prev => [newPerson, ...prev.filter(p => p.name !== newPerson.name)].slice(0, 5));
                    toast({ title: 'Person Identified', description: `Detected: ${frResult.name}` });
                }
            }
            
            if (!result.threatDetected && !result.isPersonDetected) {
                setDetectionResult(null);
                clearDetectionBox();
                if (isManualScan) {
                    toast({ title: 'Scan Complete', description: 'No significant objects detected.' });
                }
            }
        } catch (error) {
            console.error("Error during threat detection:", error);
        } finally {
            if(isManualScan) setIsScanning(false);
        }
    }, [toast, drawDetectionBox, clearDetectionBox, prohibitedObjectsInput, learnedBehaviors, activeBehaviorIds]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            if (user && cameraId) {
                try {
                    const prohibited = await getProhibitedObjects(user.uid, cameraId);
                    setProhibitedObjectsInput(prohibited.join(', '));
                    await fetchBehaviors();
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error loading settings' });
                }
            }
        };

        const getCameraPermission = async () => {
            if (typeof window !== 'undefined' && navigator.mediaDevices) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    setHasCameraPermission(true);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        streamRef.current = stream;
                    }
                } catch (error) {
                    console.error("Error accessing camera:", error);
                    setHasCameraPermission(false);
                    toast({
                        variant: "destructive",
                        title: "Camera Access Denied",
                        description: "Please enable camera permissions in your browser settings to use this app.",
                    });
                }
            }
        };

        getCameraPermission();
        fetchInitialData();

        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
        };
    }, [toast, user, cameraId, fetchBehaviors]);

    const handleClearDetections = () => {
        setIdentifiedObjects([]);
        setDetectionResult(null);
        clearDetectionBox();
        toast({ title: 'Detection log cleared.' });
    };

    const handleSaveBehavior = async (promptToSave: string) => {
        if (!user || !cameraId || !promptToSave.trim()) {
            toast({ variant: 'destructive', title: 'Cannot Save', description: 'Select a camera and ensure the behavior prompt is not empty.' });
            return;
        }
        setIsSavingBehavior(true);

        try {
            const newBehavior = await saveLearnedBehavior(user.uid, cameraId, promptToSave);
            setLearnedBehaviors(prev => [newBehavior, ...prev]);
            setBehaviorPrompt("");
            await fetchBehaviors();
            toast({ title: 'Behavior Saved', description: 'The new behavior has been added to your learned behaviors.' });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save the new behavior.' });
        } finally {
            setIsSavingBehavior(false);
        }
    };

    const handleDeleteBehavior = async (behaviorId: string) => {
        if (!user || !cameraId) return;
        try {
            await deleteLearnedBehavior(user.uid, cameraId, behaviorId);
            await fetchBehaviors(); 
            setActiveBehaviorIds(prev => prev.filter(id => id !== behaviorId));
            toast({ title: 'Behavior Deleted' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed' });
        }
    }

    const handleToggleActiveBehavior = (behaviorId: string) => {
        setActiveBehaviorIds(prev => 
            prev.includes(behaviorId) 
                ? prev.filter(id => id !== behaviorId) 
                : [...prev, behaviorId]
        );
    };
    
    const handleSaveSettings = async () => {
        if (!user || !cameraId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Camera not specified.' });
            return;
        }
        setIsSaving(true);
        const objects = prohibitedObjectsInput.split(',').map(s => s.trim()).filter(Boolean);

        try {
            // Save the objects to the camera document itself
            await saveProhibitedObjects(objects, user.uid, cameraId);
            
            // Also, treat each object as a learned behavior
            const savePromises = objects.map(obj => saveLearnedBehavior(user.uid, cameraId!, `A prohibited object: ${obj}`));
            await Promise.all(savePromises);

            toast({ title: 'Settings Saved', description: 'Prohibited objects have been updated and saved as behaviors.' });
            await fetchBehaviors(); // Refresh the behaviors list from the database
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save new settings.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAnalyzeVideo = async () => {
      if (!videoUrl || !videoAnalysisPrompt) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please provide both a video URL and a prompt.",
        });
        return;
      }
      
      setIsAnalyzingVideo(true);
      setAnalysisResult(null);
      toast({
        title: "Starting Video Analysis...",
        description: "The AI is processing the video. This may take a few moments.",
      });
  
      try {
        const result = await analyzeVideo({ videoUrl, prompt: videoAnalysisPrompt });
        setAnalysisResult(result);
        
        if (result.isLearnedBehavior) {
            toast({
              title: "Behavior Ready to Save!",
              description: "The AI derived a new behavior from the video. Click 'Add this Behaviour' to save it.",
            });
        } else {
             toast({
              title: "Analysis Complete!",
              description: "The video has been successfully summarized.",
            });
        }

      } catch (error) {
        console.error("Video analysis error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        setAnalysisResult({ analysis: `Error: ${errorMessage}`, isLearnedBehavior: false });
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "Could not process the video. Check the URL and your network connection.",
        });
      } finally {
        setIsAnalyzingVideo(false);
      }
    };

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Train Your DIFAE AI Agent</h1>
                    <p className="text-muted-foreground">
                        This is the general agent training area. Select a camera to load or save its specific settings.
                    </p>
                </div>
      
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Camera className="h-6 w-6 text-primary" />
                        Live Training Feed
                    </CardTitle>
                    <CardDescription>
                        Use your webcam to provide a live video stream. The AI will scan this feed based on your custom settings below.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                            {hasCameraPermission === null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <p className="ml-2">Requesting camera access...</p>
                                </div>
                            )}
                            {detectionResult?.threatDetected && (
                                <Badge variant="destructive" className="absolute top-2 left-2 text-base animate-pulse">
                                    {detectionResult.threatType === 'Prohibited Object' ? <Ban className="mr-2 h-4 w-4"/> : <AlertTriangle className="mr-2 h-4 w-4"/>}
                                    THREAT DETECTED: {detectionResult.detectedObjectName || detectionResult.threatType}
                                </Badge>
                            )}
                            {detectionResult && !detectionResult.threatDetected && detectionResult.isPersonDetected && (
                                <Badge variant="secondary" className="absolute top-2 left-2 text-base bg-blue-500 text-white">
                                    <ScanFace className="mr-2 h-4 w-4"/>
                                    PERSON DETECTED
                                </Badge>
                            )}
                        </div>
                        {hasCameraPermission === false && (
                            <Alert variant="destructive" className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser settings to use this feature for live training.
                            </AlertDescription>
                            </Alert>
                        )}
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="prohibited-objects">Custom Prohibited Objects (comma-separated)</Label>
                                <Input 
                                    id="prohibited-objects"
                                    placeholder="e.g., cup, phone, fire"
                                    value={prohibitedObjectsInput}
                                    onChange={(e) => setProhibitedObjectsInput(e.target.value)}
                                    disabled={!cameraId}
                                />
                                <p className="text-xs text-muted-foreground">The AI will flag these items as "Prohibited Object" threats.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="behavior-prompt">Custom Behavior Prompt</Label>
                                <div className="flex gap-2">
                                    <Textarea
                                        id="behavior-prompt"
                                        placeholder="e.g., a person looking into a window"
                                        value={behaviorPrompt}
                                        onChange={(e) => setBehaviorPrompt(e.target.value)}
                                        rows={1}
                                        disabled={!cameraId}
                                    />
                                    <Button onClick={() => handleSaveBehavior(behaviorPrompt)} disabled={isSavingBehavior || !behaviorPrompt.trim() || !cameraId} size="sm">
                                        {isSavingBehavior ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                                        <span className="sr-only">Save Behavior</span>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Describe a behavior to save it to your list of learned behaviors.</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button onClick={() => handleScan(true)} disabled={hasCameraPermission !== true || isScanning}>
                            {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                            {isScanning ? 'Scanning...' : 'Manual Scan'}
                        </Button>
                        <Button onClick={handleSaveSettings} disabled={isSaving || !cameraId}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Camera Selection</CardTitle>
                        <CardDescription>
                            {cameraId ? `You are currently training "${camera?.name}".` : "Select a camera to train."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {cameraId ? (
                            <div className="space-y-2">
                                <p className="font-semibold">{camera?.name}</p>
                                <p className="text-sm text-muted-foreground">{camera?.location}</p>
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground">
                                This is the general agent training interface. To manage settings for a specific camera, please go to the camera management page and select "Train".
                            </p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/dashboard/cameras">Go to My Cameras</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Video-based AI Training</CardTitle>
            <CardDescription>
              Provide a public video URL (e.g., from YouTube) and instruct the AI on what to learn or analyze.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isAnalyzingVideo || !cameraId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-prompt">Analysis Prompt</Label>
              <Textarea
                id="video-prompt"
                placeholder="e.g., 'Summarize the key events in this video.' or 'Learn to identify the red car as a 'sports car' object.'"
                value={videoAnalysisPrompt}
                onChange={(e) => setVideoAnalysisPrompt(e.target.value)}
                rows={3}
                disabled={isAnalyzingVideo || !cameraId}
              />
            </div>
            {videoUrl.includes("youtube.com") && (
                 <div className="aspect-video">
                    <iframe
                        className="w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${new URL(videoUrl).searchParams.get("v")}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                 </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnalyzeVideo} disabled={isAnalyzingVideo || !videoUrl || !videoAnalysisPrompt || !cameraId}>
              {isAnalyzingVideo ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="mr-2 h-4 w-4" />
              )}
              {isAnalyzingVideo ? 'Analyzing Video...' : 'Start AI Analysis'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">AI Analysis Result</CardTitle>
            <CardDescription>
              The AI's summary or learning confirmation will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px] flex flex-col justify-center">
            {isAnalyzingVideo && (
              <div className="text-center text-muted-foreground space-y-2">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p>Analyzing... this may take some time for longer videos.</p>
              </div>
            )}
            {!isAnalyzingVideo && analysisResult && (
              <div className="prose prose-sm dark:prose-invert max-w-none w-full text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
                {analysisResult.analysis}
              </div>
            )}
            {!isAnalyzingVideo && !analysisResult && (
              <div className="text-center text-muted-foreground space-y-2">
                <Video className="mx-auto h-8 w-8" />
                <p>Analysis results will be shown here.</p>
              </div>
            )}
          </CardContent>
           {analysisResult && !isAnalyzingVideo && analysisResult.isLearnedBehavior && (
            <CardFooter>
                <Button onClick={() => handleSaveBehavior(analysisResult.analysis)} disabled={isSavingBehavior || !cameraId}>
                    {isSavingBehavior ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Add this Behaviour
                </Button>
            </CardFooter>
           )}
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Learned Behaviors for {camera ? `"${camera.name}"` : 'Selected Camera'}</CardTitle>
            <CardDescription>A list of custom behaviors you have taught the AI. Activate one or more to use them in the live scan.</CardDescription>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">Active</TableHead>
                        <TableHead>Prompt</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {learnedBehaviors.length > 0 ? (
                        learnedBehaviors.map((behavior) => (
                            <TableRow key={behavior.id} data-state={activeBehaviorIds.includes(behavior.id) ? 'selected' : ''}>
                                <TableCell>
                                    <Checkbox
                                        checked={activeBehaviorIds.includes(behavior.id)}
                                        onCheckedChange={() => handleToggleActiveBehavior(behavior.id)}
                                        id={`behavior-${behavior.id}`}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Label htmlFor={`behavior-${behavior.id}`} className="cursor-pointer">{behavior.prompt}</Label>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-1 justify-end">
                                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteBehavior(behavior.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                {cameraId ? "No behaviors saved for this camera yet." : "Select a camera to view its behaviors."}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Objects Identified</CardTitle>
                    <CardDescription>A log of all threats or persons detected from your live feed.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearDetections} disabled={identifiedObjects.length === 0}>
                    <CircleX className="mr-2 h-4 w-4" />
                    Clear Log
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>AI Alert Message</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {identifiedObjects.length > 0 ? (
                            identifiedObjects.map((item, index) => (
                                <TableRow key={index} className={item.threatDetected ? "bg-destructive/10" : ""}>
                                    <TableCell className="font-mono text-xs">{item.timestamp}</TableCell>
                                    <TableCell><Badge variant={item.threatDetected ? "destructive" : "secondary"}>{item.detectedObjectName || item.threatType}</Badge></TableCell>
                                    <TableCell>{item.alertMessage}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    No objects identified yet. Point the camera at a scene to begin detection.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Users />Recognized People</CardTitle>
                <CardDescription>A log of people identified by the AI in your live feed.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Social Profiles</TableHead>
                            <TableHead>Last Seen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recognizedPeople.length > 0 ? (
                            recognizedPeople.map((person, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8"><AvatarFallback>{person.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                            <span className="font-medium">{person.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {person.socials.facebook && <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href={person.socials.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4" /><span className="sr-only">Facebook</span></Link></Button>}
                                            {person.socials.linkedin && <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href={person.socials.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4" /><span className="sr-only">LinkedIn</span></Link></Button>}
                                            {person.socials.twitter && <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href={person.socials.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-4 w-4" /><span className="sr-only">Twitter</span></Link></Button>}
                                            {person.socials.instagram && <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href={person.socials.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4" /><span className="sr-only">Instagram</span></Link></Button>}
                                            {person.socials.reddit && <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href={person.socials.reddit} target="_blank" rel="noopener noreferrer"><RedditIcon className="h-4 w-4" /><span className="sr-only">Reddit</span></Link></Button>}
                                            {person.socials.pinterest && <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href={person.socials.pinterest} target="_blank" rel="noopener noreferrer"><PinterestIcon className="h-4 w-4" /><span className="sr-only">Pinterest</span></Link></Button>}
                                            {Object.values(person.socials).every(s => !s) && <span className="text-xs text-muted-foreground">None found</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{person.timestamp}</div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    No one has been recognized yet.
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


export default function UserTrainAgentPage() {
    return (
        <Suspense fallback={<div>Loading Camera...</div>}>
            <TrainAgentPageContents />
        </Suspense>
    );
}

    
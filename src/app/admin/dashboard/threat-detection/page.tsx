
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Shield, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { realTimeThreatDetection } from "@/ai/flows/real-time-threat-detection";

type Threat = {
  threatType: string;
  alertMessage: string;
  timestamp: string;
};

export default function ThreatDetectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [threat, setThreat] = useState<Threat | null>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    setIsLoading(true);
    setThreat(null);
    toast({ title: "Scanning for threats..." });

    try {
      // The following line is commented out as it would call a real AI flow.
      // const result = await realTimeThreatDetection({ cameraFeedDataUri: '...' });
      
      // Simulate API call and a random threat detection
      await new Promise(resolve => setTimeout(resolve, 2000));
      const isThreatDetected = Math.random() > 0.5;

      if (isThreatDetected) {
        const newThreat = {
            threatDetected: true,
            threatType: "Suspicious Movement",
            alertMessage: "Unidentified person detected near the main entrance. Recommend immediate review.",
        };
        setThreat({
            ...newThreat,
            timestamp: new Date().toLocaleTimeString(),
        });
        toast({
            variant: "destructive",
            title: "Threat Detected!",
            description: newThreat.threatType,
        });
      } else {
        setThreat(null);
        toast({
            title: "All Clear",
            description: "No threats were detected in the selected feed.",
        });
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Could not analyze the feed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Global Live Feed</CardTitle>
            <CardDescription>Select any camera feed across the system to monitor and analyze for threats.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
                <Select>
                  <SelectTrigger id="camera-select" className="flex-1">
                    <SelectValue placeholder="Choose a camera to view..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Cameras would be dynamically populated */}
                  </SelectContent>
                </Select>
                <Button onClick={handleScan} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Video className="mr-2 h-4 w-4" />
                    )}
                    Scan for Threats
                </Button>
            </div>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Video className="mx-auto h-12 w-12"/>
                <p>Live feed will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Threat Analysis</CardTitle>
            <CardDescription>Results from the latest scan.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
                 <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    <p className="mt-2">Analyzing feed...</p>
                 </div>
            )}
            {!isLoading && threat && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
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
                    <p className="text-sm text-center">No threats detected. Select a camera and click "Scan for Threats" to analyze the feed.</p>
                 </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

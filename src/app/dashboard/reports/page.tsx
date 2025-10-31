
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Loader2, HardDrive, Info, ExternalLink, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import type { Camera } from "@/lib/types";
import { getCamerasForUser } from "@/lib/services/cameras";
import Link from "next/link";

const pastReports: { date: string; alerts: number; summary: string }[] = [];

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoadingCameras, setIsLoadingCameras] = useState(true);

  useEffect(() => {
    async function fetchUserCameras() {
        if (!user) {
            setIsLoadingCameras(false);
            return;
        }
        try {
            const userCameras = await getCamerasForUser(user.uid);
            setCameras(userCameras);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load cameras" });
        } finally {
            setIsLoadingCameras(false);
        }
    }
    fetchUserCameras();
  }, [user, toast]);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    toast({
      title: "Generating Report...",
      description: "This may take a moment. Please wait.",
    });

    try {
      // Mock data for the AI flow
      const mockInput = {
        date: new Date().toISOString().split("T")[0],
        events: [
          {
            timestamp: new Date().toISOString(),
            alertType: "Suspicious Movement",
            screenshotDataUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // 1x1 black pixel
            details: "Movement detected near the garage at 3:15 AM.",
          },
        ],
      };
      
      // The following line is commented out as it would call a real AI flow.
      // const result = await generateSecurityReport(mockInput);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      // const pdfData = result.report; // This would be the base64 PDF string.
      
      toast({
        title: "Report Generated Successfully!",
        description: "Your new security report is ready for download.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Generating Report",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewRecordings = () => {
    toast({
        title: "Feature Coming Soon",
        description: "A secure, in-app viewer for your cloud-connected recordings is in development."
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Daily Audit Reports</h1>
        <Button onClick={handleGenerateReport} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Generate Today's Report
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Past Reports</CardTitle>
          <CardDescription>
            Download and review previously generated security reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastReports.length > 0 ? (
                pastReports.map((report) => (
                  <TableRow key={report.date}>
                    <TableCell className="font-medium">{report.date}</TableCell>
                    <TableCell>{report.alerts}</TableCell>
                    <TableCell>{report.summary}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No past reports found.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <HardDrive />
            Stored Footage
          </CardTitle>
          <CardDescription>
            Access recordings stored on your camera's local memory card or your secure cloud storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Accessing Your Recordings</AlertTitle>
              <AlertDescription>
                <p>For your privacy and security, your video footage is stored directly on your hardware. Access methods vary depending on your camera type.</p>
              </AlertDescription>
            </Alert>
             <div className="mt-4 space-y-2">
                {isLoadingCameras ? (
                    <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Loading cameras...</div>
                ) : cameras.length > 0 ? (
                    cameras.map(camera => {
                        const isBerretoCamera = camera.uniqueId.startsWith('DSG');
                        return (
                            <div key={camera.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                <div>
                                    <p className="font-semibold">{camera.name}</p>
                                    <p className="text-xs text-muted-foreground">{camera.location}</p>
                                </div>
                                {isBerretoCamera ? (
                                    <Button variant="secondary" size="sm" onClick={handleViewRecordings}>
                                        <Video className="mr-2 h-4 w-4"/>
                                        View Recordings
                                    </Button>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-right">
                                        Please use your camera provider's app or software to view local recordings.
                                    </p>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <p className="text-center text-sm text-muted-foreground p-4">You have no cameras connected.</p>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}


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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PlusCircle, ShieldCheck, Trash, History, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import type { Camera } from "@/lib/types";
import { getCamerasForUser } from "@/lib/services/cameras";
import Link from "next/link";
// import { smartTheftAlert } from "@/ai/flows/smart-theft-alerts";

const activeAlerts: { id: number; object: string; camera: string; status: string }[] = [];

const theftAlertLog: { time: string; type: string; details: string; status: string }[] = [];

const recentReports: { date: string; summary: string }[] = [];

export default function TheftAlertsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoadingCameras, setIsLoadingCameras] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchCameras() {
        if (!user) return;
        setIsLoadingCameras(true);
        try {
            const userCameras = await getCamerasForUser(user.uid);
            setCameras(userCameras);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to load cameras.' });
        } finally {
            setIsLoadingCameras(false);
        }
    }
    fetchCameras();
  }, [user, toast]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    toast({
      title: "Creating Alert...",
      description: "Setting up the new theft alert.",
    });

    try {
      // The following line is commented out as it would call a real AI flow.
      // await smartTheftAlert({ ... });
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Alert Created!",
        description: "The new smart theft alert is now active.",
      });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Failed to Create Alert",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">New Theft Alert</CardTitle>
                    <CardDescription>
                    Monitor an object and get an alert if it's moved.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="object-description">Object Description</Label>
                        <Input
                        id="object-description"
                        placeholder="e.g., My red bicycle"
                        required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="camera-select">Select Camera</Label>
                        <Select required disabled={isLoadingCameras || cameras.length === 0}>
                            <SelectTrigger id="camera-select">
                                <SelectValue placeholder={isLoadingCameras ? "Loading cameras..." : "Choose a camera"} />
                            </SelectTrigger>
                            <SelectContent>
                                {cameras.map(camera => (
                                    <SelectItem key={camera.id} value={camera.id}>
                                        {camera.name} ({camera.location})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         {cameras.length === 0 && !isLoadingCameras && (
                            <p className="text-xs text-muted-foreground">
                                You have no cameras. <Link href="/dashboard/cameras" className="underline text-primary">Add a camera</Link> to create an alert.
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Monitoring Period</Label>
                        <div className="flex gap-2">
                        <Input type="time" required />
                        <Input type="time" required />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || cameras.length === 0}>
                        {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                        )}
                        Create Alert
                    </Button>
                    </form>
                </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Active Alerts</CardTitle>
                    <CardDescription>
                    A list of currently monitored objects.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {activeAlerts.length > 0 ? (
                            activeAlerts.map(alert => (
                                <li key={alert.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <ShieldCheck className="h-6 w-6 text-primary" />
                                        <div>
                                            <p className="font-semibold">{alert.object}</p>
                                            <p className="text-sm text-muted-foreground">{alert.camera}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-green-600">{alert.status}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                    </div>
                                </li>
                            ))
                        ) : (
                             <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                                <ShieldCheck className="h-8 w-8 mb-2" />
                                <p className="font-medium">No Active Theft Alerts</p>
                                <p className="text-sm">
                                    Use the form to monitor a valuable object.
                                </p>
                            </div>
                        )}
                    </ul>
                </CardContent>
                </Card>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><History /> Theft Alert Log</CardTitle>
                <CardDescription>A log of recent theft-related events and alerts.</CardDescription>
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
                        {theftAlertLog.length > 0 ? (
                            theftAlertLog.map((log, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-mono text-xs">{log.time}</TableCell>
                                    <TableCell>
                                        <Badge variant={log.status === "Critical" ? "destructive" : log.status === "Warning" ? "secondary" : "default"} className={log.status === "OK" ? "bg-green-500 hover:bg-green-600" : ""}>{log.type}</Badge>
                                    </TableCell>
                                    <TableCell>{log.details}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                No theft alert history.
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
                        {recentReports.length > 0 ? (
                            recentReports.map((report, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{report.date}</TableCell>
                                    <TableCell>{report.summary}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                No recent reports.
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

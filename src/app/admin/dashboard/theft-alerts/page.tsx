
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PlusCircle, ShieldCheck, Trash, ScanLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { smartTheftAlert } from "@/ai/flows/smart-theft-alerts";

const activeAlerts: {
  id: number;
  object: string;
  camera: string;
  user: string;
  status: string;
}[] = [];

type ScannedObject = {
  id: string;
  description: string;
  user: string;
  camera: string;
};

export default function TheftAlertsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedObjects, setScannedObjects] = useState<ScannedObject[]>([]);
  const { toast } = useToast();

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    toast({
      title: "Creating Alert...",
      description: "Setting up the new theft alert for the selected user.",
    });

    try {
      // The following line is commented out as it would call a real AI flow.
      // await smartTheftAlert({ ... });
      await new Promise((resolve) => setTimeout(resolve, 1500));
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
  
  const handleScanScene = async () => {
    setIsScanning(true);
    setScannedObjects([]);
    toast({
      title: "Scanning Scene...",
      description: "AI is analyzing the camera feed for objects. This may take a moment.",
    });

    try {
      // Simulate AI scan
      await new Promise(resolve => setTimeout(resolve, 2500));
      // In a real app, this would be populated by the AI.
      setScannedObjects([]); 
      toast({
        title: "Scan Complete",
        description: "No objects were detected in the selected camera feed.",
      });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Scan Failed",
            description: "Could not analyze the scene. Please try again.",
        });
    } finally {
        setIsScanning(false);
    }
  };

  const handleSetWatch = (objectDescription: string) => {
    // This would call the `smartTheftAlert` flow with the object details and times from the form.
    toast({
        title: "Watch Set!",
        description: `Now monitoring '${objectDescription}'. You will be alerted if it moves.`,
    });
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><ScanLine /> Live Scene Monitoring</CardTitle>
                <CardDescription>
                    Scan a camera feed to identify all major objects. Set a watch on any object to get an alert if it's moved within a specific time frame.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a camera to scan..." />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Camera options would be populated dynamically */}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleScanScene} disabled={isScanning} className="w-full sm:w-auto">
                        {isScanning ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ScanLine className="mr-2 h-4 w-4" />
                        )}
                        Scan Scene for Objects
                    </Button>
                </div>
                
                {isScanning && (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <p>AI is analyzing the scene...</p>
                    </div>
                )}
                
                {scannedObjects.length > 0 && (
                    <div className="border rounded-lg mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Detected Object</TableHead>
                                    <TableHead>Monitoring Period (Start / End)</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scannedObjects.map(obj => (
                                    <TableRow key={obj.id}>
                                        <TableCell className="font-medium">
                                            <div>{obj.description}</div>
                                            <div className="text-xs text-muted-foreground">{obj.camera} ({obj.user})</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <Input type="time" className="w-full sm:w-auto" defaultValue="22:00" />
                                                <Input type="time" className="w-full sm:w-auto" defaultValue="06:00" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleSetWatch(obj.description)}>Set Watch</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                 {scannedObjects.length === 0 && !isScanning && (
                    <div className="flex items-center justify-center p-8 text-muted-foreground border-dashed border-2 rounded-lg mt-4">
                        <p>Scan a camera feed to see detected objects here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Manual Theft Alert</CardTitle>
                    <CardDescription>
                    Monitor an object for any user and get an alert if it's moved.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="object-description">Object Description</Label>
                        <Input
                        id="object-description"
                        placeholder="e.g., User's red bicycle"
                        required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="user-select">Select User</Label>
                        <Select required>
                        <SelectTrigger id="user-select">
                            <SelectValue placeholder="Choose a user account" />
                        </SelectTrigger>
                        <SelectContent>
                           {/* User options would be populated dynamically */}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="camera-select">Select Camera</Label>
                        <Select required>
                        <SelectTrigger id="camera-select">
                            <SelectValue placeholder="Choose a camera" />
                        </SelectTrigger>
                        <SelectContent>
                           {/* Camera options would be populated dynamically */}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Monitoring Period</Label>
                        <div className="flex gap-2">
                        <Input type="time" required />
                        <Input type="time" required />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                        )}
                        Create Alert for User
                    </Button>
                    </form>
                </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">All Active Alerts</CardTitle>
                    <CardDescription>
                    A list of currently monitored objects across all user accounts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                    {activeAlerts.length > 0 ? (
                        activeAlerts.map((alert) => (
                        <li
                            key={alert.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                            <div className="flex items-center gap-4">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-semibold">{alert.object}</p>
                                <p className="text-sm text-muted-foreground">
                                {alert.camera} ({alert.user})
                                </p>
                            </div>
                            </div>
                            <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-green-600">
                                {alert.status}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                            </div>
                        </li>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                        <ShieldCheck className="h-8 w-8 mb-2" />
                        <p className="font-medium">No Active Alerts</p>
                        <p className="text-sm">
                            Create a new alert to start monitoring an object for a user.
                        </p>
                        </div>
                    )}
                    </ul>
                </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

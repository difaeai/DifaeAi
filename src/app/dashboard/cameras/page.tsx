
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
import { MoreHorizontal, PlusCircle, Loader2, BrainCircuit, Video } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { Camera } from "@/lib/types";
import { getCamerasForUser, deleteCameraForUser, updateCameraForUser } from "@/lib/services/cameras";
import JsmpegPlayer from "@/components/jsmpeg-player";

type CameraWithBilling = Camera & {
  monthlyCost: number;
  facialRecognitionBill: number;
};

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraWithBilling[]>([]);
  const [cameraToConfirm, setCameraToConfirm] = useState<CameraWithBilling | null>(null);
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null);
  const [cameraToEdit, setCameraToEdit] = useState<Camera | null>(null);
  const [cameraToView, setCameraToView] = useState<Camera | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchCameras = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const userCameras = await getCamerasForUser(user.uid);
        const camerasWithBilling = userCameras.map(c => ({
            ...c,
            monthlyCost: 300, 
            facialRecognitionBill: 0 
        }))
        setCameras(camerasWithBilling);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Failed to load cameras' });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    fetchCameras();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  useEffect(() => {
    const timer = setInterval(() => {
      setCameras(prevCameras =>
        prevCameras.map(camera =>
          camera.facialRecognition && camera.status === 'Online'
            ? { ...camera, facialRecognitionBill: camera.facialRecognitionBill + 1 }
            : camera
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  const handleToggleFacialRecognition = (cameraId: string) => {
    const cameraToUpdate = cameras.find(c => c.id === cameraId);
    if (!cameraToUpdate) return;

    setCameras(currentCameras =>
      currentCameras.map(camera =>
        camera.id === cameraId
          ? { ...camera, facialRecognition: !camera.facialRecognition }
          : camera
      )
    );
    
    toast({
        title: "Facial Recognition Updated",
        description: `Facial recognition for ${cameraToUpdate.name} is now ${!cameraToUpdate.facialRecognition ? "enabled" : "disabled"}.`
    });
  };

  const handleFacialRecognitionToggleAttempt = (camera: Camera) => {
    if (!camera.facialRecognition && camera.status === 'Online') {
       if (!camera.uniqueId.startsWith('DSGVIS')) {
            toast({
                variant: 'destructive',
                title: 'Upgrade Required',
                description: 'Facial recognition requires a BERRETO DSG Vision camera subscription.',
            });
            return;
        }
      setCameraToConfirm(camera as CameraWithBilling);
    } else if (camera.facialRecognition) {
      handleToggleFacialRecognition(camera.id);
    }
  };

  const handleConfirmToggle = () => {
    if (cameraToConfirm) {
      handleToggleFacialRecognition(cameraToConfirm.id);
    }
    setCameraToConfirm(null);
  };

  const handleToggleStatus = (cameraId: string) => {
    const cameraToUpdate = cameras.find((c) => c.id === cameraId);
    if (!cameraToUpdate) return;

    const newStatus =
      cameraToUpdate.status === "Online" ? "Offline" : "Online";

    setCameras((currentCameras) =>
      currentCameras.map((camera) =>
        camera.id === cameraId ? { ...camera, status: newStatus } : camera
      )
    );

    toast({
      title: "Camera Status Updated",
      description: `${cameraToUpdate.name} is now ${newStatus}.`,
    });
  };
  
  const handleDeleteConfirmation = async () => {
    if (!cameraToDelete || !user) return;
    try {
        await deleteCameraForUser(user.uid, cameraToDelete.id);
        toast({ title: "Camera Deleted", description: `"${cameraToDelete.name}" has been removed.` });
        setCameras(prev => prev.filter(c => c.id !== cameraToDelete.id));
    } catch(e) {
        toast({ variant: 'destructive', title: 'Deletion Failed' });
    }
    setCameraToDelete(null);
  };
  
  const handleEditSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!cameraToEdit || !user) return;
      
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const location = formData.get("location") as string;
      
      try {
        await updateCameraForUser(user.uid, cameraToEdit.id, { name, location });
        toast({ title: "Camera Updated", description: "Your camera details have been saved." });
        setCameras(prev => prev.map(c => c.id === cameraToEdit.id ? {...c, name, location} : c));
        setCameraToEdit(null);
      } catch (e) {
         toast({ variant: 'destructive', title: 'Update Failed' });
      }
  }


  return (
    <div className="space-y-6">
       <AlertDialog open={!!cameraToConfirm} onOpenChange={(open) => !open && setCameraToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Facial Recognition?</AlertDialogTitle>
            <AlertDialogDescription>
              Activating this feature will incur a usage-based charge of Rs 1 per second. This advanced service provides real-time identification but will result in additional costs on your bill. Do you wish to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCameraToConfirm(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle}>Enable Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
       <AlertDialog open={!!cameraToDelete} onOpenChange={(open) => !open && setCameraToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the camera <span className="font-bold">"{cameraToDelete?.name}"</span> and its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCameraToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmation}>Delete Camera</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={!!cameraToEdit} onOpenChange={(open) => !open && setCameraToEdit(null)}>
        <DialogContent>
            <form onSubmit={handleEditSave}>
                <DialogHeader>
                    <DialogTitle>Edit Camera Details</DialogTitle>
                    <DialogDescription>Update the name and location for your camera.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" name="name" defaultValue={cameraToEdit?.name} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">Location</Label>
                        <Input id="location" name="location" defaultValue={cameraToEdit?.location} className="col-span-3" required />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!cameraToView} onOpenChange={(open) => !open && setCameraToView(null)}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Live Feed: {cameraToView?.name}</DialogTitle>
                <DialogDescription>{cameraToView?.location}</DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg">
                {cameraToView?.uniqueId && !!cameraToView ? (
                  <JsmpegPlayer rtspUrl={cameraToView.uniqueId} />
                ) : (
                  <div className="aspect-video flex items-center justify-center text-muted-foreground">
                    <Video className="h-12 w-12" />
                    <p className="ml-4">No camera stream URL available.</p>
                  </div>
                )}
            </div>
        </DialogContent>
      </Dialog>


      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Cameras</h1>
         <Button asChild>
            <Link href="/dashboard/connect-camera">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Camera
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Connected Cameras</CardTitle>
          <CardDescription>
            A list of all CCTV cameras connected to your BERRETO account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Activation ID</TableHead>
                <TableHead className="text-right">Facial Recognition</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : cameras.length > 0 ? (
                cameras.map((camera) => (
                  <TableRow key={camera.id}>
                    <TableCell className="font-medium">{camera.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`status-toggle-${camera.id}`}
                          checked={camera.status === "Online"}
                          onCheckedChange={() => handleToggleStatus(camera.id)}
                          aria-label={`Toggle status for ${camera.name}`}
                        />
                        <Label
                          htmlFor={`status-toggle-${camera.id}`}
                          className={cn(
                            "cursor-pointer font-semibold",
                            camera.status === "Online"
                              ? "text-green-600"
                              : "text-destructive"
                          )}
                        >
                          {camera.status}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>{camera.location}</TableCell>
                     <TableCell className="font-mono text-xs">{camera.uniqueId}</TableCell>
                    <TableCell className="text-right">
                       <Switch
                        checked={camera.facialRecognition}
                        onCheckedChange={() => handleFacialRecognitionToggleAttempt(camera)}
                        disabled={camera.status === "Offline"}
                        aria-label={`Toggle facial recognition for ${camera.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => setCameraToEdit(camera)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setCameraToView(camera)}>View Feed</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setCameraToDelete(camera)} className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No cameras connected. Add your first camera to get started.
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
            <BrainCircuit />
            Train Cameras
          </CardTitle>
          <CardDescription>
            Improve recognition accuracy by providing new training data. Select a camera to begin training.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {cameras.length > 0 ? (
                <div className="space-y-4">
                    {cameras.map(camera => (
                        <div key={camera.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <div>
                                <h4 className="font-semibold">{camera.name}</h4>
                                <p className="text-xs text-muted-foreground">{camera.location}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" size="sm" onClick={() => setCameraToView(camera)}>
                                    <Video className="mr-2 h-4 w-4"/>
                                    See Live Feed
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={`/dashboard/train-agent?cameraId=${camera.id}`}>
                                        <BrainCircuit className="mr-2 h-4 w-4"/>
                                        Train Camera
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Connect a camera first to enable training.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}


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
import { MoreHorizontal, PlusCircle, Info, BrainCircuit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { collectionGroup, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

type CameraStatus = "Online" | "Offline";

type Camera = {
  id: string;
  name: string;
  location: string;
  status: CameraStatus;
  userId: string;
  userEmail?: string;
  facialRecognition: boolean;
  monthlyCost: number;
  facialRecognitionBill: number;
};

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collectionGroup(db, 'cameras'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const camerasData: Camera[] = [];
        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            const parentUserRef = docSnap.ref.parent.parent;
            let userEmail = 'Unknown';
            if (parentUserRef) {
                const userSnap = await getDoc(parentUserRef);
                if (userSnap.exists()) {
                    userEmail = userSnap.data().email;
                }
            }

            camerasData.push({
                id: docSnap.id,
                name: data.name,
                location: data.location,
                status: data.status,
                userId: parentUserRef?.id || 'unknown',
                userEmail: userEmail,
                facialRecognition: data.facialRecognition || false,
                monthlyCost: 300,
                facialRecognitionBill: 0,
            });
        }
        setCameras(camerasData);
    });

    return () => unsubscribe();
  }, []);


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

  const handleAddCamera = (e: React.FormEvent) => {
      e.preventDefault();
      // This functionality should be done via a secure server action
      // For now, we just show a toast.
      toast({ title: "Action Not Implemented", description: "Adding cameras is handled through user subscriptions."});
      setIsDialogOpen(false);
  };
  
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

  const handleToggleStatus = (cameraId: string) => {
    const cameraToUpdate = cameras.find((c) => c.id === cameraId);
    if (!cameraToUpdate) return;

    const newStatus: CameraStatus =
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage All Cameras</h1>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Camera
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddCamera}>
              <DialogHeader>
                <DialogTitle>Provision New Camera</DialogTitle>
                <DialogDescription>
                  Manually add a new camera to a user's account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" name="name" className="col-span-3" placeholder="e.g., Main Office Cam" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input id="location" name="location" className="col-span-3" placeholder="e.g., Reception" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user" className="text-right">
                    User Email
                  </Label>
                  <Input id="user" name="user" type="email" className="col-span-3" placeholder="user@example.com" required />
                </div>
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Subscription Update</AlertTitle>
                <AlertDescription>
                  Adding a new camera costs{" "}
                  <strong>Rs 300 per month</strong>. This will be added to the user's bill.
                </AlertDescription>
              </Alert>
              <DialogFooter className="mt-6">
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Add Camera</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">All Connected Cameras</CardTitle>
          <CardDescription>
            A list of all CCTV cameras across all user accounts. Control status and features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Facial Recognition</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cameras.length > 0 ? (
                cameras.map((camera) => (
                  <TableRow key={camera.id}>
                    <TableCell className="font-medium">{camera.name}</TableCell>
                    <TableCell>{camera.userEmail}</TableCell>
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
                    <TableCell>
                       <Switch
                        checked={camera.facialRecognition}
                        onCheckedChange={() => handleToggleFacialRecognition(camera.id)}
                        disabled={camera.status === "Offline"}
                        aria-label={`Toggle facial recognition for ${camera.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex gap-2 justify-end">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/dashboard/agent?cameraId=${camera.id}&userId=${camera.userId}`}>
                                <BrainCircuit className="mr-2 h-4 w-4"/>
                                Train
                            </Link>
                        </Button>
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View Feed</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No cameras found.
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

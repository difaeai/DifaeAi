
"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, CheckCircle, Loader2, Search, XCircle, Users, Facebook, Twitter, Linkedin, Instagram, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RedditIcon, PinterestIcon } from "@/components/icons";
// import { visualSearch } from "@/ai/flows/visual-search";

type SearchResult = {
  found: boolean;
  lastKnownLocation?: string;
  visualConfirmationDataUri?: string;
};

type Socials = {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    reddit?: string;
    pinterest?: string;
};

type RecognizedIndividual = {
    name: string;
    avatar: string;
    socials: Socials;
    camera: string;
    user: string;
    timestamp: string;
};

const initialRecognizedIndividuals: RecognizedIndividual[] = [];

export default function VisualSearchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();
  
  const [recognizedIndividuals, setRecognizedIndividuals] = useState<RecognizedIndividual[]>(initialRecognizedIndividuals);
  const [isEditPersonDialogOpen, setIsEditPersonDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<RecognizedIndividual | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
    }
  };

  const handleSearch = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file selected", description: "Please upload an image to search." });
      return;
    }
    setIsLoading(true);
    setResult(null);
    toast({ title: "Starting global visual search..." });

    try {
      // const base64Image = preview; // This would be sent to the AI flow
      // const result = await visualSearch({ itemPhotoDataUri: base64Image, cameraIds: ["CAM-001", "CAM-002", "ALL_USER_CAMS"] });
      
      // Simulate API call and random result
      await new Promise(resolve => setTimeout(resolve, 2500));
      const isFound = Math.random() > 0.4;
      const searchResult: SearchResult = isFound ? {
        found: true,
        lastKnownLocation: "Seen near Bob's Backyard Cam at 2:30 PM",
        visualConfirmationDataUri: "https://picsum.photos/seed/2/600/400"
      } : {
        found: false
      };

      setResult(searchResult);
      toast({ title: "Search Complete!", description: isFound ? "Item found." : "Item not found." });
    } catch (error) {
      toast({ variant: "destructive", title: "Search Failed", description: "An error occurred during the search." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditPerson = (person: RecognizedIndividual) => {
    setEditingPerson(person);
    setIsEditPersonDialogOpen(true);
  };
  
  const handleSavePersonChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (!editingPerson) return;
    
    const updatedPerson: RecognizedIndividual = {
        ...editingPerson,
        name: formData.get("name") as string,
        socials: {
            facebook: formData.get("facebook") as string || undefined,
            linkedin: formData.get("linkedin") as string || undefined,
            twitter: formData.get("twitter") as string || undefined,
            instagram: formData.get("instagram") as string || undefined,
            reddit: formData.get("reddit") as string || undefined,
            pinterest: formData.get("pinterest") as string || undefined,
        }
    };

    setRecognizedIndividuals(prev => prev.map(p => p.timestamp === editingPerson.timestamp && p.camera === editingPerson.camera ? updatedPerson : p));

    toast({
        title: "Information Updated",
        description: `Details for ${updatedPerson.name} have been saved.`,
    });
    setIsEditPersonDialogOpen(false);
  };

  return (
    <div className="space-y-6">
       <Dialog open={isEditPersonDialogOpen} onOpenChange={setIsEditPersonDialogOpen}>
        <DialogContent>
            <form onSubmit={handleSavePersonChanges}>
                <DialogHeader>
                    <DialogTitle>Edit Recognized Individual</DialogTitle>
                    <DialogDescription>
                        Update the name and social media links for this person.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" name="name" defaultValue={editingPerson?.name} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="facebook" className="text-right">Facebook</Label>
                        <Input id="facebook" name="facebook" defaultValue={editingPerson?.socials.facebook} className="col-span-3" placeholder="https://facebook.com/..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="linkedin" className="text-right">LinkedIn</Label>
                        <Input id="linkedin" name="linkedin" defaultValue={editingPerson?.socials.linkedin} className="col-span-3" placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="twitter" className="text-right">Twitter</Label>
                        <Input id="twitter" name="twitter" defaultValue={editingPerson?.socials.twitter} className="col-span-3" placeholder="https://x.com/..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="instagram" className="text-right">Instagram</Label>
                        <Input id="instagram" name="instagram" defaultValue={editingPerson?.socials.instagram} className="col-span-3" placeholder="https://instagram.com/..." />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reddit" className="text-right">Reddit</Label>
                        <Input id="reddit" name="reddit" defaultValue={editingPerson?.socials.reddit} className="col-span-3" placeholder="https://reddit.com/u/..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pinterest" className="text-right">Pinterest</Label>
                        <Input id="pinterest" name="pinterest" defaultValue={editingPerson?.socials.pinterest} className="col-span-3" placeholder="https://pinterest.com/..." />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Difae EYE - Global Visual Search</CardTitle>
              <CardDescription>
                Upload a photo of an item to find its last known location across ALL user cameras.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Alert>
                  <Users className="h-4 w-4" />
                  <AlertTitle>Community-Powered Search</AlertTitle>
                  <AlertDescription>
                    This tool scans the entire DIFAE network to find your item. If a match is found on another user's camera, you'll receive the location and a confirmation image. No private footage is ever shared.
                  </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="item-photo">Item Photo</Label>
                <Input id="item-photo" type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              {preview && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <Image src={preview} alt="Item preview" width={400} height={225} className="object-contain h-full w-full"/>
                </div>
              )}
              <Button onClick={handleSearch} disabled={isLoading || !file} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Find Item Across All Accounts
              </Button>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="min-h-[480px]">
            <CardHeader>
              <CardTitle className="font-headline">Search Results</CardTitle>
              <CardDescription>Findings from all connected cameras in the system.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
              {isLoading && (
                <div className="text-center text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                  <p className="mt-4">Searching across all camera feeds...</p>
                </div>
              )}
              {!isLoading && result?.found && result.visualConfirmationDataUri && (
                  <div className="space-y-4 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <h3 className="text-xl font-semibold">Item Found!</h3>
                      <p className="text-muted-foreground">{result.lastKnownLocation}</p>
                      <Image src={result.visualConfirmationDataUri} alt="Visual confirmation" width={300} height={180} className="rounded-lg mx-auto border" />
                  </div>
              )}
              {!isLoading && result && !result.found && (
                  <div className="space-y-4 text-center">
                      <XCircle className="h-12 w-12 text-destructive mx-auto" />
                      <h3 className="text-xl font-semibold">Item Not Found</h3>
                      <p className="text-muted-foreground">The item was not detected in any camera feeds across the system.</p>
                  </div>
              )}
              {!isLoading && !result && (
                <div className="text-center text-muted-foreground">
                  <Camera className="h-10 w-10 mx-auto" />
                  <p className="mt-4">Upload an image and start a search to see results.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Users /> Globally Recognized Individuals</CardTitle>
          <CardDescription>A log of individuals identified across all user cameras with facial recognition enabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Last Camera Location</TableHead>
                <TableHead>Social Profiles</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recognizedIndividuals.length > 0 ? (
                recognizedIndividuals.map((person, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={person.avatar} alt={person.name} />
                          <AvatarFallback>{person.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{person.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{person.camera}</div>
                        <div className="text-xs text-muted-foreground">{person.user}</div>
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
                    <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleEditPerson(person)}>Edit</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No individuals have been recognized yet.
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

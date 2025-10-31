
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
import { Camera, CheckCircle, Loader2, Search, XCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { visualSearch } from "@/ai/flows/visual-search";

type SearchResult = {
  found: boolean;
  lastKnownLocation?: string;
  visualConfirmationDataUri?: string;
};

export default function VisualSearchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();

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
    toast({ title: "Starting community search..." });

    try {
      // const base64Image = preview; // This would be sent to the AI flow
      // In a real app, this would pass all relevant camera IDs from the network.
      // const result = await visualSearch({ itemPhotoDataUri: base64Image, cameraIds: ["ALL_CAMERAS"] });
      
      // Simulate API call and random result
      await new Promise(resolve => setTimeout(resolve, 2500));
      const isFound = Math.random() > 0.4;
      const searchResult: SearchResult = isFound ? {
        found: true,
        lastKnownLocation: "Item seen near 'Office Lobby Cam' (user: other@example.com)",
        visualConfirmationDataUri: "https://picsum.photos/seed/1/600/400"
      } : {
        found: false
      };

      setResult(searchResult);
      toast({ title: "Search Complete!", description: isFound ? "Item found!" : "Item not found across the network." });
    } catch (error) {
      toast({ variant: "destructive", title: "Search Failed", description: "An error occurred during the search." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Difae EYE - Community Search</CardTitle>
            <CardDescription>
              Lost something important? Upload a photo, and the DIFAE AI agent will securely scan the entire BERRETO camera network to help you find it. This powerful feature leverages our community to help recover lost or stolen property.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>How Community Search Works</AlertTitle>
                <AlertDescription>
                  Your search is anonymous. If a match is found on another user's camera, only the location and a confirmation image are returned to you. No private footage is ever shared.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="item-photo">Photo of Lost Item</Label>
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
              Start Community Search
            </Button>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card className="min-h-[550px]">
          <CardHeader>
            <CardTitle className="font-headline">Search Results</CardTitle>
            <CardDescription>Findings from the BERRETO camera network.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-full">
            {isLoading && (
              <div className="text-center text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                <p className="mt-4">Searching across all network camera feeds...</p>
              </div>
            )}
            {!isLoading && result?.found && (
                <div className="space-y-4 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <h3 className="text-xl font-semibold">Item Found!</h3>
                    <p className="text-muted-foreground">{result.lastKnownLocation}</p>
                    <Image src={result.visualConfirmationDataUri!} data-ai-hint="found object" alt="Visual confirmation" width={300} height={180} className="rounded-lg mx-auto border" />
                </div>
            )}
            {!isLoading && result && !result.found && (
                <div className="space-y-4 text-center">
                    <XCircle className="h-12 w-12 text-destructive mx-auto" />
                    <h3 className="text-xl font-semibold">Item Not Found</h3>
                    <p className="text-muted-foreground">The item was not detected in any camera feeds across the network.</p>
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
  );
}

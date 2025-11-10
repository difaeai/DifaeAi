"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizard } from "../page";
import Link from "next/link";

export default function StepOneDetails() {
  const { state, dispatch } = useWizard();
  const [activationId, setActivationId] = useState(state.activationId);
  const [cameraName, setCameraName] = useState(state.cameraName);
  const [location, setLocation] = useState(state.location);

  const handleNext = () => {
    if (!cameraName.trim() || !location.trim()) {
      return;
    }
    dispatch({
      type: "SET_CAMERA_DETAILS",
      payload: { activationId, cameraName, location },
    });
    dispatch({ type: "NEXT_STEP" });
  };

  const isValid = cameraName.trim().length > 0 && location.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Step 1: Subscription and Camera Details</CardTitle>
        <CardDescription>
          Enter your Unique Activation ID and give your camera a name. For direct IP cameras you can use the Activation ID field;
          the system will also store the detected stream URL when available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="activation-id">Activation ID</Label>
            <Input
              id="activation-id"
              type="text"
              placeholder="e.g., DSGPRO-G4H7J2K9L (optional)"
              value={activationId}
              onChange={(e) => setActivationId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this on your <Link href="/dashboard/my-orders" className="text-primary hover:underline">My Subscriptions</Link> page.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="camera-name">Camera Name</Label>
            <Input
              id="camera-name"
              type="text"
              placeholder="e.g., Front Door Cam"
              value={cameraName}
              onChange={(e) => setCameraName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            placeholder="e.g., Entrance"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleNext} disabled={!isValid} size="lg">
          Continue to Camera Type
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, Box, Usb, Smartphone, Cloud } from "lucide-react";
import { useWizard } from "../page";

type CameraType = "ip" | "dvr" | "usb" | "mobile" | "cloud";

export default function StepTwoType() {
  const { state, dispatch } = useWizard();

  const cameraTypes = [
    { type: "ip" as CameraType, icon: <Wifi className="h-8 w-8" />, title: "IP Camera", description: "A standalone Wi-Fi or Ethernet camera." },
    { type: "dvr" as CameraType, icon: <Box className="h-8 w-8" />, title: "DVR / NVR System", description: "A camera connected to a recording box." },
    { type: "usb" as CameraType, icon: <Usb className="h-8 w-8" />, title: "USB Webcam", description: "A webcam connected to your computer." },
    { type: "mobile" as CameraType, icon: <Smartphone className="h-8 w-8" />, title: "Mobile Camera", description: "Using an app to turn your phone into a camera." },
    { type: "cloud" as CameraType, icon: <Cloud className="h-8 w-8" />, title: "Cloud Camera", description: "A camera from a cloud service like Ring or Nest." },
  ];

  const handleSelectType = (type: CameraType) => {
    dispatch({ type: "SET_CAMERA_TYPE", payload: type });
    // Auto-advance for USB (no connection details needed)
    if (type === "usb") {
      setTimeout(() => dispatch({ type: "GO_TO_STEP", payload: 4 }), 100);
    } else {
      setTimeout(() => dispatch({ type: "NEXT_STEP" }), 100);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Step 2: What kind of camera are you connecting?</CardTitle>
        <CardDescription>Select the option that best describes your camera.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameraTypes.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => handleSelectType(option.type)}
              className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary hover:bg-primary/5 ${
                state.cameraType === option.type ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="text-primary">{option.icon}</div>
                <h3 className="font-semibold">{option.title}</h3>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
        {!state.cameraType && (
          <p className="text-center text-sm text-muted-foreground mt-6">Please select a camera type to continue.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => dispatch({ type: "PREV_STEP" })}>
          Back
        </Button>
      </CardFooter>
    </Card>
  );
}

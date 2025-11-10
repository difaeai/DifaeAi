"use client";

import { useState, useReducer, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Wizard State Management
type CameraType = "" | "ip" | "dvr" | "mobile" | "usb" | "cloud";

type WizardStep = 1 | 2 | 3 | 4;

interface WizardState {
  currentStep: WizardStep;
  activationId: string;
  cameraName: string;
  location: string;
  cameraType: CameraType;
  selectedIp: string;
  selectedHostname: string;
  streamUrl: string;
  streamUser: string;
  streamPass: string;
  isConnectionTested: boolean;
  detectedStreamUrl: string;
}

type WizardAction =
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; payload: WizardStep }
  | { type: "SET_CAMERA_DETAILS"; payload: { activationId: string; cameraName: string; location: string } }
  | { type: "SET_CAMERA_TYPE"; payload: CameraType }
  | { type: "SET_CONNECTION_DETAILS"; payload: { selectedIp?: string; selectedHostname?: string; streamUrl?: string; streamUser?: string; streamPass?: string } }
  | { type: "SET_CONNECTION_TESTED"; payload: { tested: boolean; streamUrl?: string } }
  | { type: "RESET" };

const initialState: WizardState = {
  currentStep: 1,
  activationId: "",
  cameraName: "",
  location: "",
  cameraType: "",
  selectedIp: "",
  selectedHostname: "",
  streamUrl: "",
  streamUser: "",
  streamPass: "",
  isConnectionTested: false,
  detectedStreamUrl: "",
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "NEXT_STEP":
      if (state.currentStep < 4) {
        return { ...state, currentStep: (state.currentStep + 1) as WizardStep };
      }
      return state;
    case "PREV_STEP":
      if (state.currentStep > 1) {
        return { ...state, currentStep: (state.currentStep - 1) as WizardStep };
      }
      return state;
    case "GO_TO_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_CAMERA_DETAILS":
      return { ...state, ...action.payload };
    case "SET_CAMERA_TYPE":
      return { ...state, cameraType: action.payload, isConnectionTested: action.payload === "usb" };
    case "SET_CONNECTION_DETAILS":
      return { ...state, ...action.payload };
    case "SET_CONNECTION_TESTED":
      return {
        ...state,
        isConnectionTested: action.payload.tested,
        detectedStreamUrl: action.payload.streamUrl || state.detectedStreamUrl,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// Context
const WizardContext = createContext<{
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
} | null>(null);

function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within WizardProvider");
  }
  return context;
}

// Step Components
import StepOneDetails from "./steps/step-one-details";
import StepTwoType from "./steps/step-two-type";
import StepThreeConnection from "./steps/step-three-connection";
import StepFourTest from "./steps/step-four-test";

export default function ConnectCameraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const handleComplete = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to add a camera.",
      });
      return;
    }

    if (!state.isConnectionTested) {
      toast({
        variant: "destructive",
        title: "Connection Not Tested",
        description: "Please test the connection before adding the camera.",
      });
      return;
    }

    // Import and save camera
    const { db } = await import("@/lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");

    let uniqueId = state.detectedStreamUrl || state.streamUrl;
    if (state.cameraType === "usb") uniqueId = `webcam_${user.uid}_${Date.now()}`;
    else if (state.cameraType === "cloud") uniqueId = state.activationId;

    if (!uniqueId) {
      toast({ variant: "destructive", title: "Failed to Add Camera", description: "Could not determine a unique ID for the camera." });
      return;
    }

    try {
      const camerasCollection = collection(db, "users", user.uid, "cameras");
      await addDoc(camerasCollection, {
        userId: user.uid,
        name: state.cameraName,
        location: state.location,
        type: state.cameraType,
        uniqueId: uniqueId,
        status: "Online",
        facialRecognition: false,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Camera Added Successfully!",
        description: `Camera '${state.cameraName}' added successfully.`,
      });

      router.push("/dashboard/cameras");
    } catch (error) {
      console.error("Error adding camera:", error);
      toast({
        variant: "destructive",
        title: "Failed to Add Camera",
        description: "Could not save camera to the database.",
      });
    }
  };

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/dashboard/cameras" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cameras
          </Link>
          <h1 className="text-3xl font-bold font-headline">Connect a New Camera</h1>
          <p className="text-muted-foreground">Follow the steps to add and activate a new camera in your system.</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    state.currentStep === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : state.currentStep > step
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      state.currentStep > step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${state.currentStep === 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Camera Details
            </span>
            <span className={`text-xs ${state.currentStep === 2 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Camera Type
            </span>
            <span className={`text-xs ${state.currentStep === 3 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Connection
            </span>
            <span className={`text-xs ${state.currentStep === 4 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Test & Add
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {state.currentStep === 1 && <StepOneDetails />}
          {state.currentStep === 2 && <StepTwoType />}
          {state.currentStep === 3 && <StepThreeConnection />}
          {state.currentStep === 4 && <StepFourTest onComplete={handleComplete} />}
        </div>
      </div>
    </WizardContext.Provider>
  );
}

export { useWizard };

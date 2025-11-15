"use client";

import { createContext, useContext } from "react";

export type CameraType = "" | "ip" | "dvr" | "mobile" | "usb" | "cloud";

export type WizardStep = 1 | 2 | 3 | 4;

export interface WizardState {
  currentStep: WizardStep;
  activationId: string;
  cameraName: string;
  location: string;
  cameraType: CameraType;
  connectionMode: "standard" | "localRunner";
  localIp: string;
  selectedIp: string;
  streamUrl: string;
  streamUser: string;
  streamPass: string;
  streamPort: string;
  rtspPath: string;
  isConnectionTested: boolean;
  detectedStreamUrl: string;
  windowsAgentDownloadUrl: string;
}

export type WizardAction =
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; payload: WizardStep }
  | { type: "SET_CAMERA_DETAILS"; payload: { activationId: string; cameraName: string; location: string } }
  | { type: "SET_CAMERA_TYPE"; payload: CameraType }
  | {
      type: "SET_CONNECTION_DETAILS";
      payload: {
        selectedIp?: string;
        connectionMode?: "standard" | "localRunner";
        localIp?: string;
        streamUrl?: string;
        streamUser?: string;
        streamPass?: string;
        streamPort?: string;
        rtspPath?: string;
        windowsAgentDownloadUrl?: string;
      };
    }
  | { type: "SET_CONNECTION_TESTED"; payload: { tested: boolean; streamUrl?: string } }
  | { type: "RESET" };

export const WizardContext = createContext<{
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
} | null>(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within WizardProvider");
  }
  return context;
}

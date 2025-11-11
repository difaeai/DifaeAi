"use client";

import { createContext, useContext } from "react";

export type CameraType = "" | "ip" | "dvr" | "mobile" | "usb" | "cloud";

export type WizardStep = 1 | 2 | 3 | 4;

export type ConnectionMethod = "manual" | "bridge" | "ezviz";

export interface EzvizDevice {
  deviceSerial: string;
  deviceName: string;
  status: number;
  deviceType: string;
  localIp?: string;
  verifyCode?: string;
}

export interface EzvizSession {
  sessionId: string;
  expiry: number;
  region: string;
}

export interface WizardState {
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
  useBridge: boolean;
  bridgeId: string;
  bridgeName: string;
  bridgeUrl: string;
  bridgeApiKey: string;
  // Ezviz Cloud integration
  connectionMethod: ConnectionMethod;
  ezvizSession: EzvizSession | null;
  ezvizDevices: EzvizDevice[];
  selectedEzvizDevice: EzvizDevice | null;
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
        selectedHostname?: string;
        streamUrl?: string;
        streamUser?: string;
        streamPass?: string;
        useBridge?: boolean;
        bridgeId?: string;
        bridgeName?: string;
        bridgeUrl?: string;
        bridgeApiKey?: string;
      };
    }
  | { type: "SET_CONNECTION_TESTED"; payload: { tested: boolean; streamUrl?: string } }
  | { type: "SET_CONNECTION_METHOD"; payload: ConnectionMethod }
  | { 
      type: "SET_EZVIZ_SESSION"; 
      payload: { session: EzvizSession; devices: EzvizDevice[] } 
    }
  | { type: "SELECT_EZVIZ_DEVICE"; payload: EzvizDevice }
  | { type: "CLEAR_EZVIZ_SESSION" }
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

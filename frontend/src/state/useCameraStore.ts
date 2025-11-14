import { create } from 'zustand';

export type CameraType = 'ip' | 'dvr' | 'nvr' | 'usb' | 'mobile' | 'cloud';

export interface NetworkDeviceCandidate {
  mac: string;
  ip: string;
  hostname?: string;
  vendor?: string;
  isSimulated?: boolean;
}

interface CameraState {
  cameraType: CameraType;
  ipAddress: string;
  publicIpAddress?: string;
  selectedMacAddress?: string;
  networkDevices: NetworkDeviceCandidate[];
  username?: string;
  password?: string;
  selectedStreamUrl?: string;
  setCameraType: (type: CameraType) => void;
  setIpAddress: (ip: string) => void;
  setPublicIpAddress: (ip?: string) => void;
  setSelectedMacAddress: (mac?: string) => void;
  setNetworkDevices: (devices: NetworkDeviceCandidate[]) => void;
  setCredentials: (username?: string, password?: string) => void;
  setSelectedStreamUrl: (url?: string) => void;
  reset: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  cameraType: 'ip',
  ipAddress: '',
  publicIpAddress: undefined,
  selectedMacAddress: undefined,
  networkDevices: [],
  username: undefined,
  password: undefined,
  selectedStreamUrl: undefined,
  setCameraType: (cameraType) => set({ cameraType }),
  setIpAddress: (ipAddress) => set({ ipAddress }),
  setPublicIpAddress: (publicIpAddress) => set({ publicIpAddress }),
  setSelectedMacAddress: (selectedMacAddress) => set({ selectedMacAddress }),
  setNetworkDevices: (networkDevices) => set({ networkDevices }),
  setCredentials: (username, password) => set({ username, password }),
  setSelectedStreamUrl: (selectedStreamUrl) => set({ selectedStreamUrl }),
  reset: () =>
    set({
      cameraType: 'ip',
      ipAddress: '',
      publicIpAddress: undefined,
      selectedMacAddress: undefined,
      networkDevices: [],
      username: undefined,
      password: undefined,
      selectedStreamUrl: undefined,
    }),
}));

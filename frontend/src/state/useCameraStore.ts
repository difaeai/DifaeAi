import { create } from 'zustand';

export type CameraType = 'ip' | 'dvr' | 'nvr' | 'usb' | 'mobile' | 'cloud';

interface CameraState {
  cameraType: CameraType;
  ipAddress: string;
  username?: string;
  password?: string;
  selectedStreamUrl?: string;
  setCameraType: (type: CameraType) => void;
  setIpAddress: (ip: string) => void;
  setCredentials: (username?: string, password?: string) => void;
  setSelectedStreamUrl: (url?: string) => void;
  reset: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  cameraType: 'ip',
  ipAddress: '',
  username: undefined,
  password: undefined,
  selectedStreamUrl: undefined,
  setCameraType: (cameraType) => set({ cameraType }),
  setIpAddress: (ipAddress) => set({ ipAddress }),
  setCredentials: (username, password) => set({ username, password }),
  setSelectedStreamUrl: (selectedStreamUrl) => set({ selectedStreamUrl }),
  reset: () => set({ cameraType: 'ip', ipAddress: '', username: undefined, password: undefined, selectedStreamUrl: undefined }),
}));

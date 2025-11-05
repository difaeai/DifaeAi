export type CameraType = "rtsp" | "onvif" | "p2p";

export interface DeviceCredentials {
  username?: string;
  password?: string;
  rtspUrl?: string;
}

export interface DeviceRecord {
  id: string;
  name: string;
  type: CameraType;
  vendor?: string;
  model?: string;
  siteId?: string;
  ip?: string;
  notes?: string;
  credentials: DeviceCredentials;
  createdAt: string;
  updatedAt: string;
  status: DeviceStatus;
}

export interface DeviceStatus {
  ingestState: "idle" | "starting" | "running" | "stopping" | "error";
  fps: number;
  bitrateKbps: number;
  lastKeyframeTs?: string;
  lastError?: string;
  targets: Array<"webrtc" | "hls">;
  lastHeartbeat?: string;
}

export interface IngestCommand {
  deviceId: string;
  profile?: "main" | "sub";
  targets: Array<"webrtc" | "hls">;
}

export interface PlaybackTokenPayload {
  cameraId: string;
  scope: Array<"webrtc" | "hls">;
}

export type PublicDevice = Omit<DeviceRecord, "credentials"> & {
  credentials: Omit<DeviceCredentials, "password">;
};

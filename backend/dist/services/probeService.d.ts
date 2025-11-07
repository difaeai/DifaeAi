export interface ProbeRequest {
    ip: string;
    type: 'ip' | 'dvr' | 'nvr' | 'usb' | 'mobile' | 'cloud';
    includeOnvif?: boolean;
}
export interface ProbeCandidate {
    protocol: 'rtsp' | 'mjpeg' | 'onvif';
    url: string;
    confidence: number;
    verified: boolean;
    verificationMethod: 'ffprobe' | 'http-head' | 'onvif-ping' | 'none';
    latencyMs?: number;
    notes?: string;
    requiresAuth?: boolean;
}
export declare function probeCameraEndpoints(request: ProbeRequest): Promise<ProbeCandidate[]>;

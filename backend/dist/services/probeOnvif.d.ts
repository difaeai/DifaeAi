export declare function probeOnvifService(host: string): Promise<{
    protocol: "onvif";
    url: string;
    confidence: number;
    verified: boolean;
    verificationMethod: "onvif-ping";
    notes: string;
    requiresAuth: boolean;
} | null>;

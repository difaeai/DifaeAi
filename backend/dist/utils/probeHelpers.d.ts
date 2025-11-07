export declare function checkStreamWithFfprobe(url: string, timeoutMs: number): Promise<boolean>;
export declare function headRequest(url: string, timeoutMs: number): Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    requiresAuth: boolean;
}>;

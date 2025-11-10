"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wifi, Loader2, CheckCircle } from "lucide-react";

interface Device {
  ip: string;
  hostname: string;
  manufacturer?: string;
  model?: string;
}

interface NetworkScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDevice: (ip: string, hostname: string) => void;
}

export default function NetworkScannerDialog({
  open,
  onOpenChange,
  onSelectDevice,
}: NetworkScannerDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanComplete, setScanComplete] = useState(false);

  const handleStartScan = useCallback(async () => {
    setIsScanning(true);
    setScanComplete(false);
    setDevices([]);

    try {
      const response = await fetch("/api/scan-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        setScanComplete(true);
      } else {
        console.error("Network scan failed");
        setDevices([]);
        setScanComplete(true);
      }
    } catch (error) {
      console.error("Network scan error:", error);
      setDevices([]);
      setScanComplete(true);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleUseDevice = (device: Device) => {
    onSelectDevice(device.ip, device.hostname);
    onOpenChange(false);
    // Reset dialog state
    setDevices([]);
    setScanComplete(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            Network Scanner
          </DialogTitle>
          <DialogDescription>
            Scanning your local network for IP cameras. This may take a few seconds...
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {!isScanning && !scanComplete && devices.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Wifi className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Ready to Scan</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click the button below to scan your network for IP cameras.
                </p>
              </div>
              <Button onClick={handleStartScan}>Start Network Scan</Button>
            </div>
          )}

          {isScanning && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Scanning network for cameras...</p>
              <p className="text-xs text-muted-foreground">This typically takes 3-5 seconds</p>
            </div>
          )}

          {scanComplete && devices.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Wifi className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No Cameras Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No ONVIF cameras detected on your network.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Try entering the IP address manually if you know it.
                </p>
              </div>
            </div>
          )}

          {devices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Found {devices.length} device(s) on your network</span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {devices.map((device, index) => (
                  <div
                    key={`${device.ip}-${index}`}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{device.hostname || "Unknown Device"}</p>
                      <p className="text-sm text-muted-foreground font-mono">{device.ip}</p>
                      {device.manufacturer && (
                        <p className="text-xs text-muted-foreground mt-1">{device.manufacturer}</p>
                      )}
                    </div>
                    <Button onClick={() => handleUseDevice(device)} size="sm">
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {scanComplete && devices.length === 0 && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Enter IP Manually
            </Button>
          )}
          {!isScanning && devices.length > 0 && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

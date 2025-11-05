"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { Loader2 } from "lucide-react";

type ScanResult = { ip: string; openPorts: number[]; httpHits: string[]; hostname?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  // onSelect receives the chosen IP and optionally a best-guess stream URL
  onSelect: (ip: string, streamUrl?: string, verified?: boolean, hostname?: string) => void;
};

export function NetworkScannerDialog({ open, onClose, onSelect }: Props) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [subnet, setSubnet] = useState<string>('');
  const subnetRef = useRef(subnet);
  useEffect(() => {
    subnetRef.current = subnet;
  }, [subnet]);

  const startScan = useCallback(async () => {
    setScanning(true);
    setResults([]);
    try {
      const currentSubnet = subnetRef.current;
      const body = currentSubnet ? { subnet: currentSubnet } : {};
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const js = await res.json();
      if (js.success && Array.isArray(js.results)) {
        const list = js.results as ScanResult[];
        const sorted = [...list].sort((a, b) => {
          const aLabel = (a.hostname || a.ip || '').toLowerCase();
          const bLabel = (b.hostname || b.ip || '').toLowerCase();
          return aLabel.localeCompare(bLabel);
        });
        setResults(sorted);
      }
    } catch (e) {
      console.error(e);
    }
    setScanning(false);
  }, []);

  const hasAutoScannedRef = useRef(false);
  useEffect(() => {
    if (open && !hasAutoScannedRef.current) {
      hasAutoScannedRef.current = true;
      void startScan();
    }
    if (!open) {
      hasAutoScannedRef.current = false;
    }
  }, [open, startScan]);

  const handleUse = (scan: ScanResult) => {
    const prioritized = [
      `rtsp://${scan.ip}/live/1`,
      `rtsp://${scan.ip}/live/0`,
      `rtsp://${scan.ip}/av0_0`,
      `rtsp://${scan.ip}/videoMain`,
      `rtsp://${scan.ip}/h264`,
      `http://${scan.ip}/media/?action=stream`,
      `http://${scan.ip}/snapshot.jpg`,
    ];

    const first = prioritized[0];
    try {
      onSelect(scan.ip, first, false, scan.hostname);
    } catch (err) {
      console.error(err);
    }
    onClose();

    (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const body = { ip: scan.ip, candidates: prioritized.slice(0, 6), timeoutMs: 3000, concurrentLimit: 2 };
        const res = await fetch('/api/probe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
          const js = await res.json();
            if (js && js.url) {
              try {
              onSelect(scan.ip, js.url, !!js.ffmpegAvailable, scan.hostname);
              } catch (e) {
                console.error(e);
              }
            }
        }
      } catch (e) {
        console.warn('Background quick probe failed', e);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scan Local Network for Cameras</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex gap-2">
            <input className="flex-1 rounded-md border px-2 py-1" placeholder="Optional subnet (e.g. 192.168.1)" value={subnet} onChange={(e) => setSubnet(e.target.value)} />
            <Button onClick={() => void startScan()} disabled={scanning}>{scanning ? <Loader2 className="animate-spin h-4 w-4" /> : 'Scan'}</Button>
          </div>

          <ScrollArea className="h-64 border rounded-md p-2">
            {scanning && <div className="text-sm text-muted-foreground">Scanning... this may take a few seconds.</div>}
            {!scanning && results.length === 0 && <div className="text-sm text-muted-foreground">No devices found yet. Click Scan to start.</div>}

            <div className="space-y-2 mt-2">
              {results.map((r) => (
                <div key={r.ip} className="p-2 border rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">
                        {r.hostname || r.ip}
                      </div>
                      {r.hostname && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {r.ip}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">Ports: {r.openPorts.length ? r.openPorts.join(', ') : 'none'}</div>
                    </div>
                    <div>
                        <Button onClick={() => handleUse(r)} disabled={scanning}>
                          {scanning ? <Loader2 className="animate-spin h-4 w-4" /> : 'Use'}
                        </Button>
                      </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="font-semibold">HTTP hits / hints</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {r.httpHits.length ? r.httpHits.map((h, i) => (
                        <div key={i} className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">{h}</div>
                      )) : <div className="text-xs text-muted-foreground">none</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NetworkScannerDialog;

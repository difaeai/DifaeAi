import { Fragment } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { Alert, AlertDescription } from "./alert";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type ProbeDialogProps = {
  open: boolean;
  onClose: () => void;
  results: Array<{
    ok: boolean;
    url: string;
    stderr: string;
    latencyMs: number;
    requiresAuth?: boolean;
    probeType?: string;
    statusCode?: number;
    contentType?: string;
  }>;
  inProgress?: boolean;
};

export function ProbeResultsDialog({ open, onClose, results, inProgress }: ProbeDialogProps) {
  const hasSuccess = results.some(r => r.ok);
  const ffmpegMissing = results.some(r => r.stderr?.toLowerCase().includes('ffmpeg not available'));

  const formatUrl = (url: string) => {
    try {
      const u = new URL(url);
      // If URL has auth, mask it
      if (u.username || u.password) {
        return url.replace(/\/\/(.*):(.*)@/, '//[credentials]@');
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Camera Stream Probe Results
            {inProgress && 
              <Badge variant="secondary" className="ml-2 animate-pulse">
                Probing...
              </Badge>
            }
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] rounded-md border p-4">
          {results.length === 0 && inProgress && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Probing... please wait</div>
          )}

          {ffmpegMissing && !inProgress && (
            <Alert variant="default" className="mb-4 text-xs text-left border-amber-200 bg-amber-50 text-amber-700">
              <AlertDescription>
                ffmpeg is not installed on the server. Live preview will be unavailable until ffmpeg is available, but you can still use the detected URLs.
              </AlertDescription>
            </Alert>
          )}

          {results.map((result, i) => (
            <Fragment key={i}>
              <div className="flex items-start gap-4 mb-4 last:mb-0">
                <Badge 
                  variant={result.ok ? "success" : "destructive"}
                  className="mt-1 shrink-0"
                >
                  {result.ok ? `✓ ${result.latencyMs}ms` : "✗"}
                </Badge>
                
                <div className="flex-1 space-y-2">
                  <div className="font-mono text-sm break-all">
                    {formatUrl(result.url)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {result.probeType && (
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">{result.probeType}</span>
                    )}
                    {result.statusCode && (
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">{result.statusCode}</span>
                    )}
                    {result.contentType && (
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">{result.contentType}</span>
                    )}
                    {result.requiresAuth && (
                      <span className="px-2 py-1 rounded bg-red-100 text-red-700">Requires auth</span>
                    )}
                  </div>
                  {!result.ok && result.stderr && (
                    <Alert variant="destructive" className="text-xs">
                      <AlertDescription className="font-mono whitespace-pre-wrap">
                        {result.stderr}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </Fragment>
          ))}
          
          {results.length === 0 && !inProgress && (
            <div className="text-center text-muted-foreground">
              No probe results yet
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            variant={hasSuccess ? "outline" : "default"}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, PlayCircle } from "lucide-react";

export default function BridgePlayerPage() {
  const params = useParams<{ bridgeId: string }>();
  const bridgeId = params.bridgeId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const streamUrl = useMemo(() => `/streams/${bridgeId}/index.m3u8`, [bridgeId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const setup = async () => {
      try {
        if (Hls.isSupported()) {
          hls = new Hls({ autoStartLoad: true, enableWorker: true });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              setStatus("error");
            }
          });
          hls.on(Hls.Events.MANIFEST_PARSED, () => setStatus("ready"));
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
          video.addEventListener("loadedmetadata", () => setStatus("ready"));
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Failed to initialize player", error);
        setStatus("error");
      }
    };

    void setup();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl]);

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" /> Bridge Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
            <video ref={videoRef} className="h-full w-full" controls muted />
          </div>
          {status === "loading" && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Waiting for agent…</AlertTitle>
              <AlertDescription>
                Looking for /streams/{bridgeId}/index.m3u8. Start the Windows agent to begin streaming.
              </AlertDescription>
            </Alert>
          )}
          {status === "error" && (
            <Alert variant="destructive">
              <AlertTitle>Stream unavailable</AlertTitle>
              <AlertDescription>
                The playlist could not be loaded. Confirm the agent is running and uploading segments.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function BridgeStreamView() {
  const params = useParams<{ bridgeId: string }>();
  const bridgeId = params.bridgeId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<"waiting" | "streaming" | "error">("waiting");
  const manifestUrl = useMemo(() => `/api/bridges/${bridgeId}/stream/index.m3u8`, [bridgeId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus("waiting");

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true });
      hls.on(Hls.Events.MANIFEST_PARSED, () => setStatus("streaming"));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setStatus("error");
        }
      });
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      const onLoaded = () => setStatus("streaming");
      const onError = () => setStatus("error");
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onError);
      video.src = manifestUrl;
      video.play().catch(() => setStatus("error"));

      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
      };
    }

    setStatus("error");
  }, [manifestUrl]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Bridge Stream</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <video
            ref={videoRef}
            controls
            className="w-full rounded-md border bg-black"
            poster=""
            data-status={status}
          />

          {status === "waiting" && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Waiting for agent…</AlertTitle>
              <AlertDescription>
                Start the Windows agent for bridge <span className="font-mono">{bridgeId}</span> to begin streaming.
              </AlertDescription>
            </Alert>
          )}

          {status === "streaming" && (
            <Alert>
              <AlertTitle>Streaming</AlertTitle>
              <AlertDescription>
                Live HLS video is playing for bridge <span className="font-mono">{bridgeId}</span>.
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertTitle>Error loading stream</AlertTitle>
              <AlertDescription>
                We couldn’t load the HLS feed. Confirm the agent is running and uploading manifest/segments.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

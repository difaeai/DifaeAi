"use client";

import { useEffect, useId, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, VideoOff } from "lucide-react";

type PlayerState = "idle" | "preparing" | "ready" | "error";

export interface LivePreviewPlayerProps {
  rtspUrl: string;
  onReady?: () => void;
  onError?: (message: string) => void;
}

function sanitizeId(raw: string) {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "");
}

export default function LivePreviewPlayer({
  rtspUrl,
  onReady,
  onError,
}: LivePreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [state, setState] = useState<PlayerState>("idle");
  const [error, setError] = useState<string | null>(null);
  const componentId = sanitizeId(useId());

  useEffect(() => {
    if (!rtspUrl) {
      setState("idle");
      setError(null);
      return;
    }

    let cancelled = false;
    let localHls: Hls | null = null;

    const cleanup = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
      if (localHls) {
        try {
          localHls.destroy();
        } catch {
          // ignore
        }
        localHls = null;
      }
    };

    const start = async () => {
      setState("preparing");
      setError(null);
      const newSession = `${componentId}-${Date.now()}`;

      try {
        const params = new URLSearchParams();
        params.set("rtsp", rtspUrl);
        params.set("id", newSession);

        const res = await fetch(`/api/stream?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Stream start failed (${res.status})`);
        }

        const data = (await res.json()) as { ok?: boolean; hls?: string };
        if (!data?.hls) {
          throw new Error("Server did not return an HLS playback URL.");
        }

        if (cancelled) return;

        const hlsUrl = data.hls.includes("?")
          ? `${data.hls}&cb=${Date.now()}`
          : `${data.hls}?cb=${Date.now()}`;

        const video = videoRef.current;
        if (!video) {
          throw new Error("Preview surface not attached yet.");
        }

        const handleReady = () => {
          if (!cancelled) {
            setState("ready");
            onReady?.();
          }
        };

        const handleVideoError = () => {
          if (cancelled) return;
          const err = video.error;
          const message =
            err?.message || `Playback error (${err?.code ?? "unknown"}).`;
          setError(message);
          setState("error");
          onError?.(message);
        };

        video.addEventListener("loadeddata", handleReady, { once: true });
        video.addEventListener("playing", handleReady, { once: true });
        video.addEventListener("error", handleVideoError);

        const detach = () => {
          video.removeEventListener("loadeddata", handleReady);
          video.removeEventListener("playing", handleReady);
          video.removeEventListener("error", handleVideoError);
        };

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = hlsUrl;
          await video.play().catch(() => {
            /* ignore autoplay errors */
          });
          return () => {
            detach();
          };
        }

        if (!Hls.isSupported()) {
          throw new Error("Browser does not support HLS playback.");
        }

        localHls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = localHls;

        localHls.on(Hls.Events.ERROR, (_event, data) => {
          if (cancelled) return;
          if (data.fatal) {
            const message = `HLS error: ${data.type}`;
            setError(message);
            setState("error");
            onError?.(message);
          }
        });

        localHls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (cancelled) return;
          setState("ready");
          onReady?.();
        });

        localHls.loadSource(hlsUrl);
        localHls.attachMedia(video);
        await video.play().catch(() => {
          /* ignore autoplay errors */
        });

        return () => {
          detach();
        };
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unknown stream error";
        setError(message);
        setState("error");
        onError?.(message);
      }
    };

    let detachListeners: (() => void) | undefined;
    void start().then((detach) => {
      detachListeners = detach;
    });

    return () => {
      cancelled = true;
      detachListeners?.();
      cleanup();
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          // ignore
        }
        hlsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rtspUrl]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        muted
        autoPlay
        playsInline
        controls={state === "ready"}
      />
      {state === "preparing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm">Connecting to camera…</p>
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center text-sm text-red-200">
          <VideoOff className="mb-2 h-8 w-8 text-red-300" />
          <p>{error ?? "Unable to play stream."}</p>
        </div>
      )}
    </div>
  );
}

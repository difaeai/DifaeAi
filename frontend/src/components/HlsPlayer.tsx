import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HlsPlayerProps {
  src: string;
}

export function HlsPlayer({ src }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src;
      return;
    }

    if (!Hls.isSupported()) {
      setError('HLS is not supported in this browser');
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
    });
    hls.loadSource(src);
    hls.attachMedia(videoRef.current);

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        setError(data.type);
      }
    });

    return () => {
      hls.destroy();
    };
  }, [src]);

  if (error) {
    return <div className="rounded border border-red-500 bg-red-950/40 px-4 py-3 text-sm text-red-300">Preview error: {error}</div>;
  }

  return (
    <video ref={videoRef} className="aspect-video w-full rounded-lg border border-slate-800 bg-black" controls autoPlay muted playsInline />
  );
}

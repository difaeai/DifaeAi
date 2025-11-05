"use client";
import { useEffect, useState } from "react";

type Props = {
  ip: string;
  username?: string;
  password?: string;
  onFound?: (url: string) => void;
};

const COMMON_PATHS = [
  "/media/?action=stream",
  "/video.cgi",
  "/videostream.cgi",
  "/mjpeg.cgi",
  "/videostream",
  "/live",
  "/video1.mjpg",
  "/snapshot.jpg",
  "/cgi-bin/video.jpg",
  "/axis-cgi/mjpg/video.cgi",
];

export default function MjpegPreview({ ip, username, password, onFound }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      setChecking(true);
      // Try common HTTP ports too
      const ports = ["", ":80", ":8080", ":8000", ":81"]; // blank means no port
      for (const port of ports) {
        for (const p of COMMON_PATHS) {
          if (cancelled) return;
          try {
            const base = `http://${ip}${port}${p}`;
            // HEAD first
            const res = await fetch(base, { method: 'HEAD', cache: 'no-store' });
            if (!res.ok) continue;
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('multipart/x-mixed-replace') || ct.includes('jpeg') || ct.includes('mjpg')) {
              const authPrefix = username ? `${encodeURIComponent(username)}${password ? `:${encodeURIComponent(password)}` : ''}@` : '';
              const urlWithAuth = base.replace(`http://${ip}`, `http://${authPrefix}${ip}`);
              setUrl(urlWithAuth);
              onFound?.(urlWithAuth);
              return;
            }
          } catch (e) {
            // ignore and continue
          }
        }
      }
      setChecking(false);
    };

    probe();
    return () => { cancelled = true; };
  }, [ip, username, password, onFound]);

  if (checking && !url) {
    return <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Searching for HTTP MJPEG stream...</div>;
  }

  if (url) {
    // For MJPEG streams, <img> will render multipart/x-mixed-replace streams.
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
        <img src={url} alt="Camera MJPEG stream" className="w-full h-full object-cover" />
      </div>
    );
  }

  return <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">No MJPEG stream found.</div>;
}

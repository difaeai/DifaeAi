
"use client";

import React, { useEffect, useRef } from 'react';
import { Loader2, VideoOff } from 'lucide-react';

interface JsmpegPlayerProps {
  rtspUrl: string;
  onPlay?: () => void;
  onError?: () => void;
}

const JsmpegPlayer: React.FC<JsmpegPlayerProps> = ({ rtspUrl, onPlay, onError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const [status, setStatus] = React.useState<'connecting' | 'playing' | 'error'>('connecting');

  useEffect(() => {
    // Don't run on server or if rtspUrl is missing
    if (typeof window === 'undefined' || !rtspUrl) {
        setStatus('error');
        onError?.();
        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const websocketUrl = `${protocol}//${host}/stream?rtsp_url=${encodeURIComponent(rtspUrl)}`;

    const initPlayer = async () => {
      if (canvasRef.current) {
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        try {
          // Dynamically import jsmpeg
          const JSMpeg = (await import('jsmpeg')).default;
          
          const player = new JSMpeg.Player(websocketUrl, {
            canvas: canvasRef.current,
            onPlay: () => {
                setStatus('playing');
                onPlay?.();
            },
            onStalled: () => setStatus('connecting'),
            onSourceEstablished: () => {
                setStatus('playing');
                onPlay?.();
            },
            onSourceCompleted: () => {
              setStatus('error');
              onError?.();
              if (playerRef.current) {
                playerRef.current.destroy();
              }
            }
          });

          playerRef.current = player;
        } catch (e) {
          console.error("Failed to load JSMpeg Player", e);
          setStatus('error');
          onError?.();
        }
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [rtspUrl, onPlay, onError]);

  return (
    <div className="relative w-full h-full bg-black aspect-video flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
      {status === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="mt-2">Connecting to stream...</p>
        </div>
      )}
       {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 p-4 text-center">
          <VideoOff className="h-8 w-8 text-destructive" />
          <p className="mt-2">Stream disconnected or could not be loaded.</p>
          <p className="text-xs text-muted-foreground mt-1">Check camera URL, network, and server logs.</p>
        </div>
      )}
    </div>
  );
};

export default JsmpegPlayer;

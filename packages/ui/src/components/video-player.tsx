'use client';

import * as React from 'react';

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title }) => {
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sm text-white/70">
        Video is currently unavailable. Please try again later.
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0B1220]/80">
      <iframe
        title={title}
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
        onError={() => setError(true)}
      />
      {poster ? (
        <div className="absolute inset-0 -z-10">
          <img src={poster} alt={title} className="h-full w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
};

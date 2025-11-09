import { cn } from "@/lib/utils";

interface VideoFrameProps {
  videoId: string;
  title: string;
  className?: string;
}

export function VideoFrame({ videoId, title, className }: VideoFrameProps) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-black shadow-2xl shadow-primary/20",
        className,
      )}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/20 mix-blend-screen" />
    </div>
  );
}

import { Skeleton } from '@difae/ui';

export default function AppLoading() {
  return (
    <div className="section-shell">
      <div className="grid gap-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

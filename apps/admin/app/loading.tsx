import { Skeleton } from '@difae/ui';

export default function AdminLoading() {
  return (
    <div className="space-y-4 p-10">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

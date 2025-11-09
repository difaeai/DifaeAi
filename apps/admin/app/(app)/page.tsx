import { Card, CardDescription, CardHeader, CardTitle, MetricStat } from '@difae/ui';

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Operations overview</h1>
        <p className="text-white/60">High-level metrics to monitor DIFAE deployments.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <MetricStat label="Active users" value="86" trend="Across enterprise tenants" />
        <MetricStat label="Cameras online" value="312" trend="97% uptime this week" />
        <MetricStat label="Incidents open" value="28" trend="18 require follow-up" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity feed</CardTitle>
          <CardDescription>Connect Firebase to populate operations activity.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

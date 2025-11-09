'use client';

import { useState } from 'react';
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@difae/ui';

const mockAlerts = [
  { id: 'al-1', user: 'amina@metro.com', message: 'Intrusion escalated', read: false },
  { id: 'al-2', user: 'bilal@cooperative.pk', message: 'Camera offline', read: true }
];

export default function AlertsPage() {
  const [alerts] = useState(mockAlerts);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <p className="text-sm text-white/60">Dispatch notifications to tenant teams.</p>
        </div>
        <Button>Send test notification</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>ID</TableHeader>
            <TableHeader>User</TableHeader>
            <TableHeader>Message</TableHeader>
            <TableHeader>Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>{alert.id}</TableCell>
              <TableCell>{alert.user}</TableCell>
              <TableCell>{alert.message}</TableCell>
              <TableCell>
                <Badge tone={alert.read ? 'neutral' : 'accent'}>
                  {alert.read ? 'Read' : 'Unread'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Card>
        <CardHeader>
          <CardTitle>Notification channels</CardTitle>
          <CardDescription>Connect Firebase Cloud Messaging to enable production alerts.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

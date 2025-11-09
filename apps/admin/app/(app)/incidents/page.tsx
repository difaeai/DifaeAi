'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@difae/ui';

const mockIncidents = [
  {
    id: 'inc-92',
    camera: 'cam-1',
    type: 'Intrusion',
    severity: 'high',
    status: 'open'
  },
  {
    id: 'inc-93',
    camera: 'cam-2',
    type: 'Theft',
    severity: 'medium',
    status: 'resolved'
  }
];

export default function IncidentsPage() {
  const [incidents] = useState(mockIncidents);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Incidents</h1>
          <p className="text-sm text-white/60">Review and resolve alerts from the field.</p>
        </div>
        <Button>Filter</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>ID</TableHeader>
            <TableHeader>Camera</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Severity</TableHeader>
            <TableHeader>Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell>{incident.id}</TableCell>
              <TableCell>{incident.camera}</TableCell>
              <TableCell>{incident.type}</TableCell>
              <TableCell>
                <Badge tone={incident.severity === 'high' ? 'accent' : 'neutral'}>{incident.severity}</Badge>
              </TableCell>
              <TableCell>{incident.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Card>
        <CardHeader>
          <CardTitle>Resolution playbook</CardTitle>
          <CardDescription>Sync with Firestore to load live notes and escalation history.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

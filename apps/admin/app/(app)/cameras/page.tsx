'use client';

import { useState } from 'react';
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@difae/ui';

const mockCameras = [
  { id: 'cam-1', model: 'DSG Pro', owner: 'Metro Mall', status: 'online' },
  { id: 'cam-2', model: 'DSG Vision', owner: 'SafeCity', status: 'offline' }
];

export default function CamerasPage() {
  const [cameras] = useState(mockCameras);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cameras</h1>
          <p className="text-sm text-white/60">Monitor fleet health and assignments.</p>
        </div>
        <Button>Add camera</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>ID</TableHeader>
            <TableHeader>Model</TableHeader>
            <TableHeader>Owner</TableHeader>
            <TableHeader>Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {cameras.map((camera) => (
            <TableRow key={camera.id}>
              <TableCell>{camera.id}</TableCell>
              <TableCell>{camera.model}</TableCell>
              <TableCell>{camera.owner}</TableCell>
              <TableCell>
                <Badge tone={camera.status === 'online' ? 'accent' : 'neutral'}>{camera.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

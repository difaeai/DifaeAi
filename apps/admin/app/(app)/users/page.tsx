'use client';

import { useState } from 'react';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@difae/ui';

const mockUsers = [
  { id: 'u1', email: 'amina@metro.com', role: 'admin' },
  { id: 'u2', email: 'bilal@cooperative.pk', role: 'operator' }
];

export default function UsersPage() {
  const [users] = useState(mockUsers);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-white/60">Manage tenant roles and onboarding.</p>
        </div>
        <Button>Add user</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Email</TableHeader>
            <TableHeader>Role</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

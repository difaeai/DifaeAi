import { ReactNode } from 'react';
import { Sidebar } from '../../components/sidebar';

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-[#060A15] px-10 py-10">{children}</main>
    </div>
  );
}

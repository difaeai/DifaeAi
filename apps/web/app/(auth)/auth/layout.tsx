import { ReactNode } from 'react';
import '../../globals.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05070F] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#060A15] p-10 text-white shadow-[0_40px_100px_rgba(11,18,32,0.6)]">
        {children}
      </div>
    </div>
  );
}

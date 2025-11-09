import * as React from 'react';
import Image from 'next/image';
import { cn } from '../utils/cn';

export interface LogoMarqueeProps {
  logos: { src: string; alt: string }[];
  className?: string;
}

export const LogoMarquee: React.FC<LogoMarqueeProps> = ({ logos, className }) => {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="animate-[marquee_24s_linear_infinite] flex min-w-full gap-14 [--gap:3.5rem]">
        {logos.concat(logos).map((logo, index) => (
          <div key={`${logo.alt}-${index}`} className="relative h-12 w-40 opacity-70">
            <Image src={logo.src} alt={logo.alt} fill className="object-contain" />
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

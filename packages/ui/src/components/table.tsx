import * as React from 'react';
import { cn } from '../utils/cn';

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table
        ref={ref}
        className={cn('w-full min-w-[600px] border-collapse bg-[#0B1220]/40 text-left text-sm text-white', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <thead
    className={cn('bg-white/5 text-xs uppercase tracking-wide text-white/60', className)}
    {...props}
  />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr className={cn('border-b border-white/10 hover:bg-white/5 transition', className)} {...props} />
);

export const TableHeader: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => <th className={cn('px-5 py-4 font-semibold text-white/70', className)} {...props} />;

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => <td className={cn('px-5 py-4 text-white/80', className)} {...props} />;

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => <tbody className={cn('divide-y divide-white/5', className)} {...props} />;

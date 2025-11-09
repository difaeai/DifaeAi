"use client";

import * as React from 'react';
import { Button } from './button';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageCount,
  onPageChange
}) => {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Previous
      </Button>
      {pages.map((item) => (
        <Button
          key={item}
          variant={item === page ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(item)}
        >
          {item}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
      >
        Next
      </Button>
    </div>
  );
};

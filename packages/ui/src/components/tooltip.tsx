import * as React from 'react';

export interface TooltipProps {
  label: string;
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({ label, children }) => {
  return React.cloneElement(children, {
    title: label,
    'aria-label': label
  });
};

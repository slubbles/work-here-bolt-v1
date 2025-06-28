'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface CustomToggleProps extends React.ComponentPropsWithoutRef<typeof Switch> {
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

export function CustomToggle({
  checked,
  onCheckedChange,
  color = 'green',
  size = 'md',
  className,
  ...props
}: CustomToggleProps) {
  const colorMap = {
    green: {
      bg: 'bg-green-500',
      border: 'border-green-500',
      shadow: 'shadow-green-500/20',
      pulse: 'green-pulse',
    },
    red: {
      bg: 'bg-red-500',
      border: 'border-red-500',
      shadow: 'shadow-red-500/20',
      pulse: 'red-pulse',
    },
    blue: {
      bg: 'bg-blue-500',
      border: 'border-blue-500',
      shadow: 'shadow-blue-500/20',
      pulse: 'blue-pulse',
    },
    yellow: {
      bg: 'bg-yellow-500',
      border: 'border-yellow-500',
      shadow: 'shadow-yellow-500/20',
      pulse: 'yellow-pulse',
    },
    purple: {
      bg: 'bg-purple-500',
      border: 'border-purple-500',
      shadow: 'shadow-purple-500/20',
      pulse: 'purple-pulse',
    },
  };

  const sizeMap = {
    sm: {
      button: 'h-4 w-9',
      thumb: 'h-3 w-3',
      thumbTranslate: 'translate-x-5',
    },
    md: {
      button: 'h-6 w-14',
      thumb: 'h-5 w-5',
      thumbTranslate: 'translate-x-8',
    },
    lg: {
      button: 'h-8 w-20',
      thumb: 'h-7 w-7',
      thumbTranslate: 'translate-x-12',
    },
  };

  const selectedColor = colorMap[color];
  const selectedSize = sizeMap[size];

  return (
    <div className="relative">
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          'peer inline-flex shrink-0 items-center rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
          checked ? selectedColor.bg : 'bg-muted',
          selectedSize.button,
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform',
            checked ? selectedColor.shadow : '',
            checked ? selectedSize.thumbTranslate : 'translate-x-0',
            selectedSize.thumb
          )}
        />
      </Switch>
      {checked && (
        <div 
          className={cn(
            "absolute inset-0 rounded-full transition-all",
            selectedColor.border,
            "opacity-20 animate-ping",
            "pointer-events-none"
          )}
        />
      )}
    </div>
  );
}
'use client';

import React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

type ColorType = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'default';
type SizeType = 'sm' | 'md' | 'lg';

interface CustomToggleProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  color?: ColorType;
  size?: SizeType;
}

export const CustomToggle = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  CustomToggleProps
>(({ className, color = 'default', size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-6 w-12',
    md: 'h-8 w-16', 
    lg: 'h-10 w-20',
  };
  
  const thumbSizeClasses = {
    sm: 'h-4 w-4 translate-x-0.5',
    md: 'h-6 w-6 translate-x-0.5',
    lg: 'h-8 w-8 translate-x-0.5',
  };
  
  const thumbTranslateClasses = {
    sm: 'translate-x-6',
    md: 'translate-x-8',
    lg: 'translate-x-10',
  };
  
  const colorClasses = {
    default: 'data-[state=checked]:bg-primary',
    red: 'data-[state=checked]:bg-red-500',
    green: 'data-[state=checked]:bg-green-500',
    blue: 'data-[state=checked]:bg-blue-500',
    yellow: 'data-[state=checked]:bg-yellow-500',
    purple: 'data-[state=checked]:bg-purple-500',
  };

  return (
    <SwitchPrimitives.Root
      className={cn(
        `peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-muted`,
        colorClasses[color],
        sizeClasses[size],
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:bg-white",
          thumbSizeClasses[size],
          `data-[state=checked]:${thumbTranslateClasses[size]}`
        )}
      />
    </SwitchPrimitives.Root>
  );
});

CustomToggle.displayName = 'CustomToggle';
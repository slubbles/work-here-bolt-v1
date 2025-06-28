'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CustomToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'green' | 'blue' | 'purple' | 'yellow';
}

export function CustomToggle({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  size = 'md',
  color = 'red'
}: CustomToggleProps) {
  const sizeClasses = {
    sm: 'w-12 h-6',
    md: 'w-16 h-8',
    lg: 'w-20 h-10'
  };
  
  const thumbSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9'
  };
  
  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        // Base styles
        'relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2 focus:ring-offset-background',
        // Track styles
        checked ? 'bg-black' : 'bg-gray-300 dark:bg-gray-600',
        // Size
        sizeClasses[size],
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        // Custom classes
        className
      )}
    >
      {/* Toggle thumb */}
      <span
        className={cn(
          // Base thumb styles
          'inline-block rounded-full bg-white transition-all duration-300 ease-in-out shadow-lg',
          // Size
          thumbSizeClasses[size],
          // Position based on state
          checked 
            ? size === 'sm' ? 'translate-x-6' : size === 'md' ? 'translate-x-8' : 'translate-x-10'
            : 'translate-x-0.5',
          // Color when checked
          checked && colorClasses[color],
          // Transform and shadow
          'transform shadow-md',
          // Hover effects
          !disabled && 'hover:shadow-lg'
        )}
      />
      
      {/* Glow effect when checked */}
      {checked && (
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-30 blur-sm',
            colorClasses[color]
          )}
        />
      )}
    </button>
  );
}
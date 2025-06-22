'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingProgressProps {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  colorScheme?: 'default' | 'success' | 'warning' | 'error';
}

export function LoadingProgress({
  isLoading,
  loadingText = 'Loading...',
  progress,
  className,
  size = 'md',
  showPercentage = false,
  colorScheme = 'default'
}: LoadingProgressProps) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (isLoading && progress === undefined) {
      // Auto-increment progress for visual effect
      const interval = setInterval(() => {
        setCurrentProgress((prev) => {
          const increment = Math.random() * 15 + 5;
          const newProgress = Math.min(prev + increment, 90);
          return newProgress;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (progress !== undefined) {
      setCurrentProgress(progress);
    } else if (!isLoading) {
      setCurrentProgress(100);
      // Reset after animation
      setTimeout(() => setCurrentProgress(0), 500);
    }
  }, [isLoading, progress]);

  if (!isLoading && progress === undefined) return null;

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {loadingText && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">{loadingText}</span>
          {showPercentage && (
            <span className="text-muted-foreground font-mono">
              {Math.round(currentProgress)}%
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <Progress 
          value={currentProgress} 
          className={cn(sizeClasses[size], 'bg-muted')}
        />
        <div 
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out',
            colorClasses[colorScheme]
          )}
          style={{ width: `${currentProgress}%` }}
        />
        {/* Animated shine effect */}
        <div 
          className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"
          style={{ 
            left: `${Math.max(0, currentProgress - 8)}%`,
            opacity: isLoading ? 1 : 0
          }}
        />
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'default' | 'white' | 'primary';
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  color = 'default' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    default: 'border-muted-foreground/30 border-t-primary',
    white: 'border-white/30 border-t-white',
    primary: 'border-primary/30 border-t-primary'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export function LoadingDots({ 
  size = 'md', 
  className,
  color = 'default' 
}: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    default: 'bg-muted-foreground',
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
}

interface PulsingDotProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple';
}

export function PulsingDot({ 
  size = 'md', 
  className,
  color = 'green' 
}: PulsingDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      <div
        className={cn(
          'absolute inset-0 rounded-full animate-ping',
          colorClasses[color],
          'opacity-50'
        )}
      />
    </div>
  );
}
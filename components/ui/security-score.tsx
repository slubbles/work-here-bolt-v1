import React from 'react';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function SecurityScore({
  score,
  size = 'md',
  showLabel = true,
  className
}: SecurityScoreProps) {
  // Determine colors based on score
  const getColors = () => {
    if (score >= 80) {
      return {
        text: 'text-green-600',
        bg: 'bg-green-500',
        track: 'bg-green-200',
        icon: CheckCircle
      };
    } else if (score >= 60) {
      return {
        text: 'text-yellow-600',
        bg: 'bg-yellow-500',
        track: 'bg-yellow-200',
        icon: Shield
      };
    } else {
      return {
        text: 'text-red-600',
        bg: 'bg-red-500',
        track: 'bg-red-200',
        icon: AlertTriangle
      };
    }
  };

  // Determine size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-1.5 w-24',
          text: 'text-sm',
          icon: 'w-3 h-3'
        };
      case 'lg':
        return {
          container: 'h-3 w-48',
          text: 'text-lg',
          icon: 'w-5 h-5'
        };
      default:
        return {
          container: 'h-2 w-36',
          text: 'text-base',
          icon: 'w-4 h-4'
        };
    }
  };

  const colors = getColors();
  const sizeClasses = getSizeClasses();
  const IconComponent = colors.icon;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {showLabel && (
        <div className={`flex items-center ${colors.text} mb-1 ${sizeClasses.text} font-semibold`}>
          <IconComponent className={`${sizeClasses.icon} mr-1`} />
          <span>Security Score: {score}/100</span>
        </div>
      )}
      <div className={`${sizeClasses.container} ${colors.track} rounded-full overflow-hidden relative`}>
        <div
          className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      {score < 50 && showLabel && (
        <p className="text-xs text-red-500 mt-1 italic">Exercise caution with this token</p>
      )}
    </div>
  );
}
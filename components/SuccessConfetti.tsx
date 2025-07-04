'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-confetti with error handling
const Confetti = dynamic(() => import('react-confetti').catch(() => {
  // Fallback component if react-confetti fails to load
  return { default: () => null };
}), {
  ssr: false,
  loading: () => null
});

interface SuccessConfettiProps {
  show: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function SuccessConfetti({ 
  show, 
  duration = 5000, 
  onComplete 
}: SuccessConfettiProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isComplete, setIsComplete] = useState(false);

  // Calculate window dimensions
  useEffect(() => {
    if (typeof window !== 'undefined' && show) {
      const updateDimensions = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);

      // Set timer to stop confetti
      const timer = setTimeout(() => {
        setIsComplete(true);
        if (onComplete) onComplete();
      }, duration);

      return () => {
        window.removeEventListener('resize', updateDimensions);
        clearTimeout(timer);
      };
    }
  }, [show, duration, onComplete]);

  if (!show || isComplete || dimensions.width === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Confetti
        width={dimensions.width}
        height={dimensions.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.2}
        colors={['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']}
        confettiSource={{
          x: dimensions.width / 2,
          y: dimensions.height / 3,
          w: 0,
          h: 0
        }}
      />
    </div>
  );
}
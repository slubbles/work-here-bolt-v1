'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen app-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-card p-8 space-y-6">
          {/* Error Icon */}
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          {/* Error Content */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
            <p className="text-muted-foreground">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left mt-4 p-4 bg-muted/30 rounded-lg">
                <summary className="cursor-pointer text-sm font-semibold mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-500 whitespace-pre-wrap break-words">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={reset}
              className="bg-red-500 hover:bg-red-600 text-white flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
          
          {/* Support Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support with error ID: {error.digest}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
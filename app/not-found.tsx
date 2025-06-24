import { Button } from '@/components/ui/button';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen app-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-card p-8 space-y-6">
          {/* 404 Icon */}
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          
          {/* 404 Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-foreground">404</h1>
              <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
            </div>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          {/* Navigation Options */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="flex-1">
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="flex-1 border-border text-foreground hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
            
            {/* Quick Links */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Popular pages:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/create">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Create Token
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/tokenomics">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Tokenomics
                  </Button>
                </Link>
                <Link href="/verify">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Verify
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
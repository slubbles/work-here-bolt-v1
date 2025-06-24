'use client';

export default function Loading() {
  return (
    <div className="min-h-screen app-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Snarbles Logo Animation */}
        <div className="relative">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div className="absolute inset-0 w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 to-red-600 opacity-50 animate-ping mx-auto"></div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Loading Snarbles</h2>
          <p className="text-muted-foreground">Preparing your token creation platform...</p>
        </div>
        
        {/* Loading Bar */}
        <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
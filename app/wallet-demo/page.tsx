'use client';

import WalletConnectDemo from '@/components/WalletConnectDemo';

export default function WalletDemoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto p-6">
        <div className="border border-border rounded-lg p-8 shadow-sm bg-card">
          <WalletConnectDemo />
        </div>
      </div>
    </div>
  );
}
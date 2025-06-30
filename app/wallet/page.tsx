'use client';

import MinimalistWalletConnect from '@/components/MinimalistWalletConnect';

export default function WalletPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto p-6">
        <div className="border border-border rounded-lg p-8 shadow-sm bg-card">
          <MinimalistWalletConnect />
        </div>
      </div>
    </div>
  );
}
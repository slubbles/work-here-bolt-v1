import './globals.css';
import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import dynamic from 'next/dynamic';

// Dynamically import components that use browser APIs
const Navbar = dynamic(() => import('@/components/layout/Navbar'), {
  ssr: false,
  loading: () => <div className="h-16 bg-background border-b" />
});

const WalletContextProvider = dynamic(() => import('@/components/providers/WalletProvider'), {
  ssr: false,
  loading: () => <div />
});

export const metadata: Metadata = {
  title: 'Snarbles - Create Your Own Token in 30 Seconds',
  description: 'Launch your cryptocurrency token instantly with Snarbles. No coding required.',
  keywords: 'token creation, cryptocurrency, blockchain, solana, defi, web3',
  authors: [{ name: 'Snarbles Team' }],
  creator: 'Snarbles',
  publisher: 'Snarbles',
  openGraph: {
    title: 'Snarbles - Create Your Own Token in 30 Seconds',
    description: 'Launch your cryptocurrency token instantly with Snarbles. No coding required.',
    url: 'https://snarbles.xyz',
    siteName: 'Snarbles',
    images: [
      {
        url: '/pSsNHPck_400x400.jpg',
        width: 400,
        height: 400,
        alt: 'Snarbles Token Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snarbles - Create Your Own Token in 30 Seconds',
    description: 'Launch your cryptocurrency token instantly with Snarbles. No coding required.',
    images: ['/pSsNHPck_400x400.jpg'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" href="/pSsNHPck_400x400.jpg" />
        <link rel="apple-touch-icon" href="/pSsNHPck_400x400.jpg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#EF4444" />
      </head>
      <body className="font-inter antialiased">
        <WalletContextProvider>
          <div className="relative min-h-screen">
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </WalletContextProvider>
      </body>
    </html>
  );
}
import { NextResponse } from 'next/server';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    build: process.env.CUSTOM_BUILD_ID || 'local',
    environment: process.env.NODE_ENV || 'development',
    services: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')),
      solana: Boolean(process.env.NEXT_PUBLIC_RPC_ENDPOINT),
    }
  };

  return NextResponse.json(healthCheck, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
import { NextResponse } from 'next/server';

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
    NODE_ENV: process.env.NODE_ENV || 'Not set',
  };

  const allSet = Object.values(env).every(val => val !== 'Missing');

  return NextResponse.json({
    status: allSet ? 'OK' : 'Missing environment variables',
    environment: env,
    recommendation: !allSet ? 'Please create a .env.local file with the required Supabase credentials' : null
  });
} 
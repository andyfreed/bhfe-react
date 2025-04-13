import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is not set');
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
  }
  
  // Redact credentials if they exist
  const redactedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
  console.log('DATABASE_URL exists and is set to:', redactedUrl);
  
  return NextResponse.json({ 
    message: 'DATABASE_URL is set', 
    redactedUrl 
  });
} 
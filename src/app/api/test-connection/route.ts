import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // Test connection with anon key
    console.log('Testing Supabase connection with anon key...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: anonData, error: anonError } = await supabase.from('courses').select('count').limit(1);
    
    // Test connection with service role key
    console.log('Testing Supabase connection with service role key...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);
    const { data: adminData, error: adminError } = await supabaseAdmin.from('courses').select('count').limit(1);
    
    return NextResponse.json({
      status: 'success',
      anon_connection: anonError ? 'failed' : 'success',
      anon_error: anonError ? anonError.message : null,
      admin_connection: adminError ? 'failed' : 'success',
      admin_error: adminError ? adminError.message : null,
      supabase_url: supabaseUrl,
      keys_available: {
        anon_key: !!supabaseKey,
        service_role_key: !!supabaseAdminKey
      }
    });
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return NextResponse.json(
      { error: 'Failed to test Supabase connection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
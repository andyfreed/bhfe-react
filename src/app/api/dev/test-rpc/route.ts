import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAdminKey);
    
    // Test if exec_sql RPC exists
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: "SELECT 'exec_sql function test' as message;" 
    });
    
    if (error) {
      console.error('RPC test failed:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'exec_sql RPC function exists and is working',
      data
    });
  } catch (error) {
    console.error('Error testing RPC function:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
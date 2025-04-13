import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Execute a raw SQL query to temporarily disable the problematic RLS policy
    const { error } = await supabase.rpc('disable_profile_policies');
    
    if (error) {
      console.error('Error disabling RLS policies:', error);
      return NextResponse.json(
        { error: `Failed to disable RLS policies: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'RLS policies temporarily disabled' });
  } catch (error: any) {
    console.error('Error in bypass-rls endpoint:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
} 
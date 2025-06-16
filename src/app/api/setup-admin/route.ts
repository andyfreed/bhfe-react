import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET: Add admin user
export async function GET() {
  try {
    // Create a server-side Supabase client (with service role key)
    const supabase = await createServerSupabaseClient();
    
    // Check if the admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'a.freed@outlook.com')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error checking for admin user:', checkError);
      return NextResponse.json(
        { error: checkError.message || 'Failed to check for admin user' },
        { status: 500 }
      );
    }
    
    // If user already exists, return it
    if (existingUser) {
      return NextResponse.json({
        message: 'Admin user already exists',
        user: existingUser
      });
    }
    
    // Add the admin user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'a.freed@outlook.com',
        name: 'Admin User (A. Freed)'
      })
      .select();
    
    if (error) {
      console.error('Error adding admin user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to add admin user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Admin user added successfully',
      user: data[0]
    });
  } catch (error: any) {
    console.error('Unexpected error in setup-admin:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
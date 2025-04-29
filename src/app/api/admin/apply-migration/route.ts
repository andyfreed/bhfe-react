import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Verify admin authorization
async function verifyAuth(supabase: any) {
  // Allow everything in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      return false;
    }

    const userId = data.session.user.id;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return false;
    }

    return profile.role === 'admin';
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify admin access
    const isAdmin = await verifyAuth(supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get migration name from request
    const data = await request.json();
    const { migrationName } = data;
    
    if (!migrationName) {
      return NextResponse.json(
        { error: 'Migration name is required' },
        { status: 400 }
      );
    }
    
    // Ensure the migration filename is safe
    const safeMigrationName = migrationName.replace(/[^a-zA-Z0-9_-]/g, '');
    const migrationPath = path.join(process.cwd(), 'src', 'sql', `${safeMigrationName}.sql`);
    
    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { error: `Migration file ${safeMigrationName}.sql not found` },
        { status: 404 }
      );
    }
    
    // Read migration file
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (migrationError) {
      console.error('Migration error:', migrationError);
      return NextResponse.json(
        { error: `Failed to apply migration: ${migrationError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: `Migration ${safeMigrationName} applied successfully` });
  } catch (error) {
    console.error('Error in apply-migration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 
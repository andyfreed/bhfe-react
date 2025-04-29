import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parse } from 'papaparse';

// Define the expected CSV column structure
interface UserImportRow {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  role?: string;
  billing_street?: string;
  billing_street_2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  billing_country?: string;
  shipping_street?: string;
  shipping_street_2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  ea_otrp_license?: string;
  cfp_license?: string;
  cpa_license?: string;
  erpa_license?: string;
  cdfa_license?: string;
}

// Map license column names to license types
const LICENSE_COLUMN_MAP: Record<string, string> = {
  'ea_otrp_license': 'EA',
  'cfp_license': 'CFP',
  'cpa_license': 'CPA',
  'erpa_license': 'ERPA',
  'cdfa_license': 'CDFA'
};

// Verify admin authorization
async function verifyAuth(supabase: SupabaseClient) {
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
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }
    
    // Read the file content
    const fileContent = await file.text();
    
    // Parse CSV
    const { data, errors } = parse<UserImportRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase()
    });
    
    if (errors.length > 0) {
      return NextResponse.json(
        { error: `CSV parsing error: ${errors[0].message}` },
        { status: 400 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No valid user data found in the CSV file' },
        { status: 400 }
      );
    }
    
    // Process each row
    const results = {
      success: 0,
      errors: [] as { row: number; email: string; error: string }[],
      total: data.length
    };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowIndex = i + 2; // Adding 2 to account for 1-indexing and header row
      
      try {
        // Validate required fields
        if (!row.email || !row.email.includes('@')) {
          throw new Error('Valid email is required');
        }
        
        // Generate a password if none provided
        if (!row.password) {
          // Generate a random 10-character password
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
          let password = '';
          for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          row.password = password;
        } else if (row.password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', row.email)
          .single();
        
        if (existingUser) {
          throw new Error('A user with this email already exists');
        }
        
        // Create the user account via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: row.email,
          password: row.password,
          email_confirm: true,
        });
        
        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }
        
        if (!authData.user) {
          throw new Error('Failed to create user');
        }
        
        const userId = authData.user.id;
        
        // Update the user's profile
        const role = row.role?.toLowerCase() === 'admin' ? 'admin' : 'user';
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            company: row.company || '',
            phone: row.phone || '',
            role: role,
            // Billing address fields
            billing_street: row.billing_street || '',
            billing_street_2: row.billing_street_2 || '',
            billing_city: row.billing_city || '',
            billing_state: row.billing_state || '',
            billing_zip: row.billing_zip || '',
            billing_country: row.billing_country || '',
            // Shipping address fields
            shipping_street: row.shipping_street || '',
            shipping_street_2: row.shipping_street_2 || '',
            shipping_city: row.shipping_city || '',
            shipping_state: row.shipping_state || '',
            shipping_zip: row.shipping_zip || '',
            shipping_country: row.shipping_country || ''
          })
          .eq('id', userId);
        
        if (profileError) {
          console.warn(`User created but profile update failed: ${profileError.message}`);
        }
        
        // Process license information
        const licenses = [];
        for (const [column, licenseType] of Object.entries(LICENSE_COLUMN_MAP)) {
          const licenseNumber = row[column as keyof UserImportRow];
          if (licenseNumber && typeof licenseNumber === 'string' && licenseNumber.trim() !== '') {
            licenses.push({
              user_id: userId,
              license_type: licenseType,
              license_number: licenseNumber.trim()
            });
          }
        }
        
        // Insert licenses if any exist
        if (licenses.length > 0) {
          const { error: licenseError } = await supabase
            .from('user_licenses')
            .insert(licenses);
            
          if (licenseError) {
            console.warn(`User created but license insertion failed: ${licenseError.message}`);
          }
        }
        
        results.success++;
      } catch (error) {
        results.errors.push({
          row: rowIndex,
          email: row.email || `Row ${rowIndex}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in import-users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 
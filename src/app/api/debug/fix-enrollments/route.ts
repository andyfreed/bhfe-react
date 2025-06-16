import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

/**
 * GET /api/debug/fix-enrollments
 * An endpoint to fix the enrollments for a user by email
 */
export async function GET(request: NextRequest) {
  console.log('Fix enrollments endpoint called');
  
  const supabase = createServerSupabaseClient() as any;
  
  try {
    // Get query parameters
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    console.log(`Fixing enrollments for email: ${email}`);
    
    // 1. Find the user in the auth system
    console.log(`1. Finding user ID from auth system`);
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const user = authUsers?.users?.find((u: any) => u.email === email);
    
    if (!user) {
      console.log(`User not found in auth system: ${email}`);
      
      // Try to find user in the database directly
      const { data: dbUsers } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email);
        
      if (!dbUsers || dbUsers.length === 0) {
        return NextResponse.json({ 
          error: 'User not found in system', 
          message: 'Could not find user in either auth system or database' 
        }, { status: 404 });
      }
      
      console.log(`User found in database with ID: ${dbUsers[0].id}`);
      const authUserId = dbUsers[0].id;
      
      // Continue with this DB user ID
      return await fixEnrollments(supabase, email, authUserId);
    }
    
    const authUserId = user.id;
    console.log(`Auth user ID: ${authUserId}`);
    
    return await fixEnrollments(supabase, email, authUserId);
  } catch (error: any) {
    console.error('Error in fix enrollments endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fixEnrollments(supabase: any, email: string, authUserId: string) {
  // 2. Find the user in the users table
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);
  
  let dbUserId = null;
  
  if (dbUsers && dbUsers.length > 0) {
    dbUserId = dbUsers[0].id;
    console.log(`Found user in users table with ID: ${dbUserId}`);
  } else {
    console.log(`User not found in users table, creating entry`);
    
    // Create the user in the users table with the auth ID
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
      
    if (createError) {
      console.error('Error creating user in users table:', createError);
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
    }
    
    dbUserId = authUserId;
    console.log(`Created user in users table with ID: ${dbUserId}`);
  }
  
  // 3. Find enrollments that might be associated with this user
  console.log(`3. Finding enrollments associated with email: ${email}`);
  
  // First check if there are any enrollments for the auth user ID
  const { data: authEnrollments, error: authEnrollError } = await supabase
    .from('user_enrollments')
    .select('*')
    .eq('user_id', authUserId);
    
  // Also check if there are enrollments for the DB user ID (if different)
  let dbEnrollments = null;
  let dbEnrollError = null;
  
  if (dbUserId && dbUserId !== authUserId) {
    const result = await supabase
      .from('user_enrollments')
      .select('*')
      .eq('user_id', dbUserId);
      
    dbEnrollments = result.data;
    dbEnrollError = result.error;
  }
  
  // 4. Check all enrollments to find any with same email
  console.log(`4. Checking all enrollments in the system for email relationship`);
  const { data: allEnrollments, error: allEnrollmentsError } = await supabase
    .from('user_enrollments')
    .select(`*, user:users!user_id(email)`)
    .limit(50);
  
  const emailMatchedEnrollments = allEnrollments?.filter(
    (enrollment: any) => enrollment.user?.email?.toLowerCase() === email.toLowerCase()
  ) || [];
  
  console.log(`Found ${emailMatchedEnrollments.length} enrollments with matching email`);
  
  // 5. Fix any enrollments that don't have the correct user_id
  const results = {
    fixedEnrollments: 0,
    errors: [] as string[]
  };
  
  // If the auth user has no enrollments but there are email-matched enrollments, update them
  if ((!authEnrollments || authEnrollments.length === 0) && emailMatchedEnrollments.length > 0) {
    console.log(`Fixing ${emailMatchedEnrollments.length} enrollments to use auth user ID: ${authUserId}`);
    
    for (const enrollment of emailMatchedEnrollments) {
      // Only update if the user_id doesn't match the auth user ID
      if (enrollment.user_id !== authUserId) {
        const { error: updateError } = await supabase
          .from('user_enrollments')
          .update({ user_id: authUserId })
          .eq('id', enrollment.id);
          
        if (updateError) {
          console.error(`Error updating enrollment ${enrollment.id}:`, updateError);
          results.errors.push(`Failed to update enrollment ${enrollment.id}: ${updateError.message}`);
        } else {
          console.log(`Successfully updated enrollment ${enrollment.id}`);
          results.fixedEnrollments++;
        }
      }
    }
  }
  
  // Return the results
  return NextResponse.json({
    email,
    authUserId,
    dbUserId,
    authEnrollmentsCount: authEnrollments?.length || 0,
    dbEnrollmentsCount: dbEnrollments?.length || 0,
    emailMatchedEnrollmentsCount: emailMatchedEnrollments.length,
    fixedEnrollments: results.fixedEnrollments,
    errors: results.errors,
    success: results.errors.length === 0
  });
} 
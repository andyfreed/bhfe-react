import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

/**
 * GET /api/debug/database
 * A debug endpoint to examine database structure and relationships
 */
export async function GET(request: NextRequest) {
  console.log('DEBUG endpoint called to examine database structure');
  
  const supabase = await createServerSupabaseClient() as any;
  
  try {
    // Get query parameters
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    console.log(`Debugging database for email: ${email}`);
    
    // 1. Check if user exists in auth system
    console.log(`1. Checking auth users table`);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find((u: any) => u.email === email);
    
    // 2. Check if user exists in users table
    console.log(`2. Checking users table`);
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    // 3. Check if user exists in profiles table
    console.log(`3. Checking profiles table`);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);
    
    // 4. Check for enrollments for this user ID(s)
    const userIds: string[] = [];
    if (authUser) userIds.push(authUser.id);
    if (dbUsers && dbUsers.length > 0) dbUsers.forEach((u: any) => userIds.push(u.id));
    if (profiles && profiles.length > 0) profiles.forEach((p: any) => userIds.push(p.id));
    
    console.log(`4. Checking enrollments for user IDs: ${userIds.join(', ')}`);
    
    const enrollmentsPromises = userIds.map((id) => 
      supabase
        .from('user_enrollments')
        .select('*, course:courses(*)')
        .eq('user_id', id)
    );
    
    const enrollmentsResults = await Promise.all(enrollmentsPromises);
    
    // 5. Find all enrollments in the system (limited to first 20)
    console.log(`5. Checking all enrollments in the system`);
    const { data: allEnrollments, error: allEnrollmentsError } = await supabase
      .from('user_enrollments')
      .select(`*, user:users!user_id(email)`)
      .limit(20);
    
    // Find enrollments by email in the all enrollments result
    let emailEnrollments = [];
    if (allEnrollments) {
      emailEnrollments = allEnrollments.filter((enrollment: any) => {
        return enrollment.user?.email === email;
      });
    }
    
    // Return all the debugging information
    return NextResponse.json({
      email: email,
      authUser: authUser ? {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at
      } : null,
      dbUsers: dbUsers || [],
      profiles: profiles || [],
      enrollments: enrollmentsResults.map((result, i) => ({
        forUserId: userIds[i],
        data: result.data || [],
        error: result.error
      })),
      emailEnrollments: emailEnrollments,
      allUsers: {
        auth: authUsers?.users?.length || 0,
        dbUsers: dbUsers?.length || 0,
        profiles: profiles?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
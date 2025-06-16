import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getSession } from '@/lib/authService';

// This is a backend-only endpoint that will create a database function
// to bypass RLS policies for course creation
export async function POST(req: NextRequest) {
  // Check authentication
  const session = await getSession();
  if (!session || session.data === null || !session.data?.user || !session.data?.user.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Only allow admin users to create the function
  const isAdmin = session.data.user.app_metadata?.claims_admin === true;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  
  // SQL to create a function that allows bypassing RLS for course insertion
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.insert_course_bypass_rls(course_data JSONB)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      inserted_course JSONB;
      course_id UUID;
    BEGIN
      -- Insert the course with explicit fields
      INSERT INTO public.courses (
        sku, 
        title, 
        description, 
        author, 
        main_subject,
        table_of_contents_url,
        course_content_url,
        created_at,
        updated_at
      )
      VALUES (
        course_data->>'sku',
        course_data->>'title',
        course_data->>'description',
        course_data->>'author',
        course_data->>'main_subject',
        course_data->>'table_of_contents_url',
        course_data->>'course_content_url',
        NOW(),
        NOW()
      )
      RETURNING id, sku, title, description, author, main_subject, 
                table_of_contents_url, course_content_url, created_at, updated_at
      INTO inserted_course;
      
      RETURN inserted_course;
    END;
    $$;
    
    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION public.insert_course_bypass_rls(JSONB) TO authenticated;
  `;

  try {
    // Create the function using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (error) {
      console.error('Error creating bypass function:', error);
      
      // If exec_sql doesn't exist, try creating it first
      if (error.message.includes('function exec_sql() does not exist')) {
        // Create the exec_sql function first
        const { error: execError } = await supabase.rpc('exec_sql_function', {
          sql: `
            CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
            RETURNS JSONB
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public
            AS $$
            BEGIN
              EXECUTE sql;
              RETURN jsonb_build_object('success', true);
            END;
            $$;
            
            GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
          `
        });
        
        if (execError) {
          return NextResponse.json({
            error: 'Could not create exec_sql function',
            details: execError
          }, { status: 500 });
        }
        
        // Try creating the bypass function again
        const { error: retryError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
        
        if (retryError) {
          return NextResponse.json({
            error: 'Could not create bypass function after creating exec_sql',
            details: retryError
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({
          error: 'Could not create bypass function',
          details: error
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully created the bypass RLS function for course creation'
    });
  } catch (error) {
    console.error('Exception creating bypass function:', error);
    return NextResponse.json({
      error: 'Exception occurred creating bypass function',
      details: error
    }, { status: 500 });
  }
} 
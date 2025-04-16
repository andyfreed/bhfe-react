import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/client';

/**
 * GET handler for listing all enrollments with pagination
 * This endpoint is for admin users only
 */
export async function GET(req: NextRequest) {
  try {
    // Get pagination parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    
    // Validate pagination
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page parameter' },
        { status: 400 }
      );
    }
    
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pageSize parameter (must be between 1 and 100)' },
        { status: 400 }
      );
    }

    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Check admin privileges - allow in development mode only for simplicity
    // In production, use your auth middleware or authenticate properly
    if (process.env.NODE_ENV !== 'development') {
      // Get admin cookie from headers (this is a simplified check)
      const cookieHeader = req.headers.get('cookie') || '';
      const hasAdminCookie = cookieHeader.includes('admin_token=temporary-token');
      
      if (!hasAdminCookie) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Use admin client in development for better performance
    const client = process.env.NODE_ENV === 'development' 
      ? createAdminClient() || supabase  // fallback to regular client if admin client creation fails
      : supabase;

    if (!client) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Query enrollments with user and course information
    const { data, error } = await client
      .from('user_enrollments')
      .select(`
        id,
        user_id,
        course_id,
        progress,
        completed,
        enrolled_at,
        enrollment_type,
        enrollment_notes,
        user:users(
          id,
          email,
          first_name,
          last_name
        ),
        course:courses(
          id,
          title,
          description,
          main_subject,
          author
        )
      `)
      .order('enrolled_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    // For pagination, just return what we have for now
    // In a real app, implement proper count query
    return NextResponse.json({
      enrollments: data || [],
      pagination: {
        page,
        pageSize,
        totalPages: 1, // Simplified for now
        hasMore: data && data.length === pageSize // Assume there's more if we got a full page
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/enrollments/list:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 
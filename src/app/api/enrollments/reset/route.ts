import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/client';

/**
 * PATCH handler for resetting a user's enrollment progress
 * This allows admins to reset a user's progress in a course
 */
export async function PATCH(req: NextRequest) {
  try {
    // Only allow in development mode for simplicity
    // In production, implement proper authentication
    if (process.env.NODE_ENV !== 'development') {
      const cookieHeader = req.headers.get('cookie') || '';
      const hasAdminCookie = cookieHeader.includes('admin_token=temporary-token');
      
      if (!hasAdminCookie) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Parse the request body
    const body = await req.json();
    const { enrollmentId } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    // Get the Supabase client
    const client = process.env.NODE_ENV === 'development'
      ? createAdminClient() || supabase
      : supabase;

    if (!client) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Reset the enrollment progress
    const { data, error } = await client
      .from('user_enrollments')
      .update({
        progress: 0,
        completed: false,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);

    if (error) {
      console.error('Error resetting enrollment progress:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Enrollment not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to reset enrollment progress' },
        { status: 500 }
      );
    }

    // Return the updated enrollment
    return NextResponse.json({
      message: 'Enrollment progress reset successfully',
      enrollment: data
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/enrollments/reset:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 
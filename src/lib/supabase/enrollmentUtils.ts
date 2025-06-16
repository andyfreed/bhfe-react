import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

/**
 * Enrollment types
 */
export enum EnrollmentType {
  SELF = 'self',     // User enrolled themselves (e.g., via payment)
  ADMIN = 'admin',   // Admin enrolled the user
  GIFT = 'gift',     // Gift enrollment
  COMP = 'comp'      // Complimentary enrollment
}

/**
 * Enrollment status
 */
export enum EnrollmentStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

/**
 * Interface for creating a new enrollment
 */
export interface CreateEnrollmentParams {
  userId: string;
  courseId: string;
  type?: EnrollmentType;
  status?: EnrollmentStatus;
  notes?: string;
  adminUserId?: string; // ID of admin who created this enrollment
}

/**
 * Creates a new enrollment in the database
 * 
 * @param userId - ID of the user to enroll
 * @param courseId - ID of the course to enroll in
 * @param options - Optional parameters for enrollment (type, status, notes, adminId)
 */
export async function createEnrollment(
  userId: string, 
  courseId: string,
  options: {
    type?: EnrollmentType;
    status?: EnrollmentStatus;
    notes?: string;
    adminUserId?: string;
  } = {}
) {
  const { type, status, notes, adminUserId } = options;
  const client = await createServerSupabaseClient();
  
  try {
    // Check if enrollment already exists
    const { data: existingEnrollment, error: checkError } = await client
      .from('user_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for existing enrollment:', checkError);
      throw new Error(`Failed to check for existing enrollment: ${checkError.message}`);
    }
    
    // If enrollment already exists, return it
    if (existingEnrollment) {
      return {
        success: false,
        error: 'User is already enrolled in this course',
        enrollmentId: existingEnrollment.id,
        isNew: false
      };
    }
    
    // Create a new enrollment
    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      progress: 0,
      completed: false,
      enrolled_at: new Date().toISOString(),
      enrollment_type: type || EnrollmentType.SELF,
      status: status || EnrollmentStatus.ACTIVE,
      enrollment_notes: notes || null,
      created_by: adminUserId || null
    };
    
    const { data, error } = await client
      .from('user_enrollments')
      .insert(enrollmentData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating enrollment:', error);
      throw new Error(`Failed to create enrollment: ${error.message}`);
    }
    
    return {
      success: true,
      enrollmentId: data.id,
      isNew: true
    };
  } catch (error: any) {
    console.error('Exception in createEnrollment:', error);
    return {
      success: false,
      error: error.message || 'An unknown error occurred',
      isNew: false
    };
  }
}

// For backward compatibility
export async function createEnrollmentWithClient(
  client: SupabaseClient,
  params: CreateEnrollmentParams
) {
  const { userId, courseId, type, status, notes, adminUserId } = params;
  return createEnrollment(userId, courseId, { type, status, notes, adminUserId });
}

/**
 * Updates an enrollment's progress
 */
export async function updateEnrollmentProgress(
  client: SupabaseClient,
  enrollmentId: string,
  progress: number,
  completed: boolean = false
) {
  try {
    // Validate progress value
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    
    // Set completed automatically if progress is 100%
    if (progress === 100) {
      completed = true;
    }
    
    // Update the enrollment
    const { data, error } = await client
      .from('user_enrollments')
      .update({
        progress,
        completed,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);
    
    if (error) {
      console.error('Error updating enrollment progress:', error);
      throw new Error(`Failed to update enrollment progress: ${error.message}`);
    }
    
    return {
      success: true,
      progress,
      completed
    };
  } catch (error: any) {
    console.error('Exception in updateEnrollmentProgress:', error);
    return {
      success: false,
      error: error.message || 'An unknown error occurred'
    };
  }
} 
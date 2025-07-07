import { createClient } from '@supabase/supabase-js';
import type { Database, Certificate, CertificateTemplate, CertificateEdit, CreditType } from '../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export interface GenerateCertificateParams {
  userId: string;
  courseId: string;
  enrollmentId: string;
  creditType: CreditType;
  recipientName: string;
  courseTitle: string;
  examScore: number;
  creditsEarned: number;
  customData?: Record<string, any>;
}

export interface EditCertificateParams {
  certificateId: string;
  editedBy: string;
  fieldName: string;
  newValue: string;
  oldValue?: string;
  editReason?: string;
}

export interface CertificateWithRelations extends Certificate {
  template?: CertificateTemplate;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    sku: string;
  };
  edits?: CertificateEdit[];
}

/**
 * Generates a certificate when a user passes an exam
 */
export async function generateCertificate(params: GenerateCertificateParams): Promise<Certificate> {
  const {
    userId,
    courseId,
    enrollmentId,
    creditType,
    recipientName,
    courseTitle,
    examScore,
    creditsEarned,
    customData = {}
  } = params;

  // First, check if certificate already exists for this user, course, and credit type
  const { data: existingCertificate, error: existingError } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('credit_type', creditType)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  if (existingCertificate) {
    throw new Error('Certificate already exists for this user, course, and credit type');
  }

  // Get the appropriate template for this credit type
  const { data: template, error: templateError } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('credit_type', creditType)
    .single();

  if (templateError) {
    throw new Error(`Certificate template not found for credit type: ${creditType}`);
  }

  // Generate certificate number
  const { data: certificateNumber, error: numberError } = await supabase
    .rpc('generate_certificate_number');

  if (numberError) {
    throw new Error('Failed to generate certificate number');
  }

  // Create the certificate
  const certificateData: Database['public']['Tables']['certificates']['Insert'] = {
    user_id: userId,
    course_id: courseId,
    enrollment_id: enrollmentId,
    template_id: template.id,
    credit_type: creditType,
    certificate_number: certificateNumber,
    title: template.title,
    recipient_name: recipientName,
    course_title: courseTitle,
    completion_date: new Date().toISOString(),
    exam_score: examScore,
    credits_earned: creditsEarned,
    custom_data: JSON.stringify(customData),
    is_revoked: false,
    revoked_at: null,
    revoked_by: null,
    revoked_reason: null
  };

  const { data: certificate, error: createError } = await supabase
    .from('certificates')
    .insert(certificateData)
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return certificate;
}

/**
 * Gets certificates for a user
 */
export async function getUserCertificates(userId: string): Promise<CertificateWithRelations[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      template:certificate_templates(*),
      course:courses(id, title, sku)
    `)
    .eq('user_id', userId)
    .eq('is_revoked', false)
    .order('completion_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Gets a specific certificate with all related data
 */
export async function getCertificate(certificateId: string): Promise<CertificateWithRelations | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      template:certificate_templates(*),
      user:users(id, name, email),
      course:courses(id, title, sku),
      edits:certificate_edits(*)
    `)
    .eq('id', certificateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Edits a certificate field and logs the change
 */
export async function editCertificate(params: EditCertificateParams): Promise<void> {
  const { certificateId, editedBy, fieldName, newValue, oldValue, editReason } = params;

  // Start a transaction
  const { data: certificate, error: getCertError } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', certificateId)
    .single();

  if (getCertError) {
    throw getCertError;
  }

  // Update the certificate
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  updateData[fieldName] = newValue;

  const { error: updateError } = await supabase
    .from('certificates')
    .update(updateData)
    .eq('id', certificateId);

  if (updateError) {
    throw updateError;
  }

  // Log the edit
  const editData: Database['public']['Tables']['certificate_edits']['Insert'] = {
    certificate_id: certificateId,
    edited_by: editedBy,
    field_name: fieldName,
    old_value: oldValue || null,
    new_value: newValue,
    edit_reason: editReason || null
  };

  const { error: editError } = await supabase
    .from('certificate_edits')
    .insert(editData);

  if (editError) {
    throw editError;
  }
}

/**
 * Revokes a certificate
 */
export async function revokeCertificate(
  certificateId: string,
  revokedBy: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('certificates')
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revoked_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', certificateId);

  if (error) {
    throw error;
  }
}

/**
 * Gets certificate templates for a specific credit type
 */
export async function getCertificateTemplates(creditType?: CreditType): Promise<CertificateTemplate[]> {
  let query = supabase
    .from('certificate_templates')
    .select('*')
    .order('name');

  if (creditType) {
    query = query.eq('credit_type', creditType);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Creates or updates a certificate template
 */
export async function upsertCertificateTemplate(
  template: Omit<CertificateTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<CertificateTemplate> {
  const { data, error } = await supabase
    .from('certificate_templates')
    .upsert({
      ...template,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Gets all certificates for admin view
 */
export async function getAllCertificates(): Promise<CertificateWithRelations[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      template:certificate_templates(*),
      user:users(id, name, email),
      course:courses(id, title, sku)
    `)
    .order('completion_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Gets certificates for a specific course
 */
export async function getCourseCertificates(courseId: string): Promise<CertificateWithRelations[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      template:certificate_templates(*),
      user:users(id, name, email),
      course:courses(id, title, sku)
    `)
    .eq('course_id', courseId)
    .eq('is_revoked', false)
    .order('completion_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Auto-generates certificates for users who have passed exams
 * This function should be called when exam results are updated
 */
export async function autoGenerateCertificates(
  userId: string,
  courseId: string,
  enrollmentId: string,
  examScore: number,
  passingScore: number = 70
): Promise<Certificate[]> {
  if (examScore < passingScore) {
    throw new Error('Exam score does not meet passing criteria');
  }

  // Get user and course information
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) {
    throw userError;
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*, credits:course_credits(*)')
    .eq('id', courseId)
    .single();

  if (courseError) {
    throw courseError;
  }

  // Get enrollment to determine which credit types to generate certificates for
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('user_enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single();

  if (enrollmentError) {
    throw enrollmentError;
  }

  const certificates: Certificate[] = [];

  // Generate certificates for each credit type associated with the course
  for (const credit of course.credits) {
    try {
      const certificate = await generateCertificate({
        userId,
        courseId,
        enrollmentId,
        creditType: credit.credit_type as CreditType,
        recipientName: user.name || user.email,
        courseTitle: course.title,
        examScore,
        creditsEarned: credit.amount,
        customData: {
          courseNumber: credit.course_number,
          enrollmentType: enrollment.enrollment_type
        }
      });

      certificates.push(certificate);
    } catch (error) {
      // If certificate already exists, skip
      if (error instanceof Error && error.message.includes('already exists')) {
        continue;
      }
      throw error;
    }
  }

  return certificates;
}
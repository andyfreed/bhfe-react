import { createServerSupabaseClient } from './supabase';
import type { Course, CourseFormatEntry, CourseCredit, CourseState, CourseWithRelations, Database } from '../types/database';

export async function getCourses(): Promise<Course[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('title');

  if (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
  return data;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('sku', slug) // Using the SKU field as the slug
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return null;
    }
    console.error('Error fetching course by slug:', error);
    throw error;
  }
  return data;
}

export async function getCourseWithRelations(id: string): Promise<CourseWithRelations | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      formats:course_formats(*),
      credits:course_credits(*),
      states:course_states(*),
      subject_areas:course_subject_areas(
        id,
        subject_areas(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching course with relations:', error);
    throw error;
  }
  return data;
}

export async function createCourse(
  course: Omit<Database['public']['Tables']['courses']['Insert'], 'id'>,
  formats: Omit<CourseFormatEntry, 'id' | 'course_id' | 'created_at'>[],
  credits: Omit<CourseCredit, 'id' | 'course_id' | 'created_at'>[],
  states: Omit<CourseState, 'id' | 'course_id' | 'created_at'>[]
): Promise<CourseWithRelations> {
  const supabase = await createServerSupabaseClient();
  
  try {
    console.log("Starting course creation process with:", { course, formats, credits, states });
    
    // Start a Supabase transaction
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single();

    if (courseError) {
      console.error('Error inserting course:', courseError);
      throw courseError;
    }

    console.log("Course created successfully:", courseData);

    // Add formats
    if (formats.length > 0) {
      console.log("Adding formats:", formats);
      const formatsWithCourseId = formats.map(format => ({
        ...format,
        course_id: courseData.id
      }));
      
      const { error: formatsError } = await supabase
        .from('course_formats')
        .insert(formatsWithCourseId);
        
      if (formatsError) {
        console.error('Error inserting course formats:', formatsError);
        throw formatsError;
      }
    }

    // Add credits
    if (credits.length > 0) {
      console.log("Adding credits:", credits);
      const creditsWithCourseId = credits.map(credit => ({
        ...credit,
        course_id: courseData.id
      }));
      
      const { error: creditsError } = await supabase
        .from('course_credits')
        .insert(creditsWithCourseId);
        
      if (creditsError) {
        console.error('Error inserting course credits:', creditsError);
        throw creditsError;
      }
    }

    // Add states
    if (states.length > 0) {
      console.log("Adding states:", states);
      const statesWithCourseId = states.map(state => ({
        state_code: state.state_code,
        course_id: courseData.id
      }));
      
      const { error: statesError } = await supabase
        .from('course_states')
        .insert(statesWithCourseId);
        
      if (statesError) {
        console.error('Error inserting course states:', statesError);
        throw statesError;
      }
    }

    // Return the complete course with relations
    return await getCourseWithRelations(courseData.id) as CourseWithRelations;
  } catch (error) {
    console.error('Error in createCourse:', error);
    throw error;
  }
}

export async function updateCourse(
  id: string,
  course: Database['public']['Tables']['courses']['Update'],
  formats?: Omit<CourseFormatEntry, 'id' | 'course_id' | 'created_at'>[],
  credits?: Omit<CourseCredit, 'id' | 'course_id' | 'created_at'>[],
  states?: Omit<CourseState, 'id' | 'course_id' | 'created_at'>[]
): Promise<CourseWithRelations> {
  const supabase = await createServerSupabaseClient();
  
  // Update course
  const { error: courseError } = await supabase
    .from('courses')
    .update(course)
    .eq('id', id);

  if (courseError) throw courseError;

  // Update formats if provided
  if (formats) {
    // Delete existing formats
    await supabase.from('course_formats').delete().eq('course_id', id);
    
    // Insert new formats
    if (formats.length > 0) {
      const { error: formatsError } = await supabase
        .from('course_formats')
        .insert(
          formats.map(format => ({
            ...format,
            course_id: id
          }))
        );
      if (formatsError) throw formatsError;
    }
  }

  // Update credits if provided
  if (credits) {
    await supabase.from('course_credits').delete().eq('course_id', id);
    
    if (credits.length > 0) {
      const { error: creditsError } = await supabase
        .from('course_credits')
        .insert(
          credits.map(credit => ({
            ...credit,
            course_id: id
          }))
        );
      if (creditsError) throw creditsError;
    }
  }

  // Update states if provided
  if (states) {
    await supabase.from('course_states').delete().eq('course_id', id);
    
    if (states.length > 0) {
      const { error: statesError } = await supabase
        .from('course_states')
        .insert(
          states.map(state => ({
            state_code: state.state_code,
            course_id: id
          }))
        );
      if (statesError) throw statesError;
    }
  }

  // Return the updated course with relations
  return await getCourseWithRelations(id) as CourseWithRelations;
}

export async function deleteCourse(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSubjectAreas() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('subject_areas')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
} 
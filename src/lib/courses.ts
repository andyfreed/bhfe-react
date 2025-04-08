import { supabase } from './supabase';
import type { Course, CourseFormatEntry, CourseCredit, CourseState, CourseWithRelations, Database } from '../types/database';

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('title');

  if (error) throw error;
  return data;
}

export async function getCourseWithRelations(id: string): Promise<CourseWithRelations | null> {
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

  if (error) throw error;
  return data;
}

export async function createCourse(
  course: Database['public']['Tables']['courses']['Insert'],
  formats: Omit<CourseFormatEntry, 'id' | 'course_id' | 'created_at'>[],
  credits: Omit<CourseCredit, 'id' | 'course_id' | 'created_at'>[],
  states: Omit<CourseState, 'id' | 'course_id' | 'created_at'>[]
): Promise<CourseWithRelations> {
  // Start a Supabase transaction
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single();

  if (courseError) throw courseError;

  // Add formats
  if (formats.length > 0) {
    const { error: formatsError } = await supabase
      .from('course_formats')
      .insert(
        formats.map(format => ({
          ...format,
          course_id: courseData.id
        }))
      );
    if (formatsError) throw formatsError;
  }

  // Add credits
  if (credits.length > 0) {
    const { error: creditsError } = await supabase
      .from('course_credits')
      .insert(
        credits.map(credit => ({
          ...credit,
          course_id: courseData.id
        }))
      );
    if (creditsError) throw creditsError;
  }

  // Add states
  if (states.length > 0) {
    const { error: statesError } = await supabase
      .from('course_states')
      .insert(
        states.map(state => ({
          ...state,
          course_id: courseData.id
        }))
      );
    if (statesError) throw statesError;
  }

  // Return the complete course with relations
  return await getCourseWithRelations(courseData.id) as CourseWithRelations;
}

export async function updateCourse(
  id: string,
  course: Database['public']['Tables']['courses']['Update'],
  formats?: Omit<CourseFormatEntry, 'id' | 'course_id' | 'created_at'>[],
  credits?: Omit<CourseCredit, 'id' | 'course_id' | 'created_at'>[],
  states?: Omit<CourseState, 'id' | 'course_id' | 'created_at'>[]
): Promise<CourseWithRelations> {
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
            ...state,
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
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSubjectAreas() {
  const { data, error } = await supabase
    .from('subject_areas')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
} 
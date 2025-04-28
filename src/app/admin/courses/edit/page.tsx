'use client';

import { useSearchParams } from 'next/navigation';
import CourseForm from '../[action]/page';

export default function EditCoursePage() {
  // Get the course ID from the query parameter
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  
  // Pass 'edit' as the action param to the CourseForm component
  return <CourseForm params={Promise.resolve({ action: 'edit' })} />;
} 
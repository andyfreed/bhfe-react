'use client';

import CourseForm from '../[action]/page';

export default function EditCoursePage() {
  // Pass 'edit' as the action param to the CourseForm component
  return <CourseForm params={Promise.resolve({ action: 'edit' })} />;
} 
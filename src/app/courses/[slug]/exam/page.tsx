import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCourseBySlug } from '@/lib/courses';
import { getExamWithQuestions } from '@/lib/exams';
import ExamTaker from '@/components/exams/ExamTaker';

interface Props {
  params: {
    slug: string;
  };
  searchParams: {
    examId?: string;
  };
}

export default async function CourseExamPage({ params, searchParams }: Props) {
  // Get the exam ID from query params
  const examId = searchParams?.examId;
  const slug = params?.slug;
  
  if (!examId) {
    notFound();
  }
  
  if (!slug) {
    notFound();
  }
  
  // Get the course to verify it exists
  const course = await getCourseBySlug(slug);
  
  if (!course) {
    notFound();
  }
  
  // Get the exam to verify it belongs to this course
  const examData = await getExamWithQuestions(examId);
  
  if (!examData || examData.exam.course_id !== course.id) {
    notFound();
  }
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
      <h2 className="text-2xl font-semibold mb-6">Exam</h2>
      
      <Suspense fallback={<div>Loading exam...</div>}>
        <ExamTaker examId={examId} />
      </Suspense>
    </div>
  );
} 
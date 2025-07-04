import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCourseBySlug } from '@/lib/courses';
import { getExamWithQuestions } from '@/lib/exams';
import ExamTaker from '@/components/exams/ExamTaker';

interface Props {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    examId?: string;
  }>;
}

export default async function CourseExamPage({ params, searchParams }: Props) {
  // Await params and searchParams in Next.js 15
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  
  // Get the exam ID from query params
  const examId = awaitedSearchParams?.examId;
  const slug = awaitedParams?.slug;
  
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
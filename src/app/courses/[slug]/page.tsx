import { courses as dummyCourses } from '@/data/courses';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CourseEnrollButton } from '@/app/courses/[slug]/CourseEnrollButton';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { CourseWithRelations, Exam } from '@/types/database';
import { CourseType } from '@/types/course';
import { getCourseExams } from '@/lib/exams';

interface Props {
  params: {
    slug: string;
  };
}

// Add image property to the course data
interface EnhancedCourse {
  id: string;
  title: string;
  description: string;
  type: CourseType[];
  price: number;
  duration: string;
  credits: number;
  slug: string;
  features: string[];
  objectives: string[];
  instructor: {
    name: string;
    bio: string;
    image: string;
  };
  image?: string;
}

// Convert database course to frontend format
function adaptCourse(course: CourseWithRelations): EnhancedCourse {
  // Find the lowest price format
  const price = course.formats && course.formats.length > 0
    ? Math.min(...course.formats.map(f => f.price))
    : 0;

  // Get all credit types
  const creditTypes = course.credits
    ? course.credits.map(c => c.credit_type.toUpperCase() as CourseType)
    : [];
  
  // Make sure we have at least one credit type, or use OTHER
  const type = creditTypes.length > 0 ? creditTypes : ['OTHER' as CourseType];
  
  // Calculate total credits
  const totalCredits = course.credits
    ? course.credits.reduce((total, credit) => total + credit.amount, 0)
    : 0;
  
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    type: type,
    price: price,
    duration: `${totalCredits} hours`, // Assuming 1 credit = 1 hour
    credits: totalCredits,
    slug: course.sku.toLowerCase().replace(/\s+/g, '-'),
    features: [
      'Complete exam preparation materials',
      'Practice questions and mock exams',
      'Live instructor support',
      'Study planning tools',
      'Access to online resources'
    ],
    objectives: [
      'Master key concepts and principles',
      'Develop practical skills and knowledge',
      'Prepare for certification exams',
      'Stay current with industry standards'
    ],
    instructor: {
      name: course.author,
      bio: 'Experienced instructor with many years of industry expertise.',
      image: '' // No image available
    }
  };
}

// Fetch a course by slug from the database
async function getCourseBySlug(slug: string): Promise<EnhancedCourse | null> {
  try {
    const supabase = createServerSupabaseClient();
    
    // First try to find by sku (converted to slug format)
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        formats:course_formats(*),
        credits:course_credits(*),
        states:course_states(*)
      `)
      .order('title');
      
    if (error) {
      console.error('Error fetching course by slug:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Convert to slug format and find matching course
    const matchingCourse = data.find(course => 
      course.sku.toLowerCase().replace(/\s+/g, '-') === slug
    );
    
    if (!matchingCourse) {
      return null;
    }
    
    return adaptCourse(matchingCourse);
  } catch (error) {
    console.error('Error in getCourseBySlug:', error);
    return null;
  }
}

// Try to find a course in dummy data by slug
function getDummyCourse(slug: string): EnhancedCourse | undefined {
  return dummyCourses.find(c => c.slug === slug) as EnhancedCourse;
}

export default async function CoursePage({ params }: Props) {
  // First try to get the real course
  const course = await getCourseBySlug(params.slug);
  
  // If not found, try dummy data
  const fallbackCourse = !course ? getDummyCourse(params.slug) : null;
  
  // If neither found, 404
  if (!course && !fallbackCourse) {
    notFound();
  }
  
  // Use either the real course or fallback
  // The non-null assertion is safe here because we already checked above
  const courseData = (course || fallbackCourse)! as EnhancedCourse;

  // Get exams for this course
  let exams: Exam[] = [];
  if (course) {
    try {
      exams = await getCourseExams(courseData.id);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  }

  return (
    <div className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-4">
              {courseData.type.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 text-sm font-semibold rounded-full bg-theme-primary-light/10 text-theme-primary-light"
                >
                  {type}
                </span>
              ))}
            </div>
            
            <h1 className="text-4xl font-bold mb-6 text-theme-neutral-800">{courseData.title}</h1>
            
            {/* Course Image/Banner */}
            <div className="relative h-[400px] mb-8 rounded-lg overflow-hidden border border-theme-neutral-200 bg-gradient-to-r from-theme-primary-light to-theme-primary-DEFAULT flex items-center justify-center text-white">
              {/* Check if image property exists and has a value */}
              {courseData.image ? (
                <Image
                  src={courseData.image}
                  alt={courseData.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="text-center p-8">
                  <h3 className="text-2xl font-bold mb-2">{courseData.title}</h3>
                  <p className="text-white/80">{courseData.credits} Credits • {courseData.duration}</p>
                </div>
              )}
            </div>

            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold mb-4 text-theme-neutral-800">Course Description</h2>
              <p className="mb-8 text-theme-neutral-600">{courseData.description}</p>

              <h2 className="text-2xl font-bold mb-4 text-theme-neutral-800">Learning Objectives</h2>
              <ul className="space-y-2 mb-8">
                {courseData.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start text-theme-neutral-600">
                    <span className="text-theme-accent-DEFAULT mr-2">✓</span>
                    {objective}
                  </li>
                ))}
              </ul>

              <h2 className="text-2xl font-bold mb-4 text-theme-neutral-800">Course Features</h2>
              <ul className="space-y-2 mb-8">
                {courseData.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-theme-neutral-600">
                    <span className="text-theme-accent-DEFAULT mr-2">•</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {exams.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-theme-neutral-800">Course Exams</h2>
                  <div className="space-y-4 mb-8">
                    {exams.map((exam) => (
                      <div 
                        key={exam.id} 
                        className="border border-theme-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-xl font-semibold mb-2">{exam.title}</h3>
                        <p className="text-theme-neutral-600 mb-4">{exam.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-theme-neutral-500">
                            Passing score: {exam.passing_score}%
                          </div>
                          <Link
                            href={`/courses/${params.slug}/exam?examId=${exam.id}`}
                            className="px-4 py-2 bg-theme-accent-DEFAULT hover:bg-theme-accent-dark text-white rounded-md text-sm font-medium transition-colors"
                          >
                            Take Exam
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h2 className="text-2xl font-bold mb-4 text-theme-neutral-800">Instructor</h2>
              <div className="flex items-start gap-4">
                {courseData.instructor.image ? (
                  <Image
                    src={courseData.instructor.image}
                    alt={courseData.instructor.name}
                    width={100}
                    height={100}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-[100px] h-[100px] bg-theme-neutral-200 rounded-full flex items-center justify-center text-theme-neutral-600">
                    {courseData.instructor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold mb-2 text-theme-neutral-800">{courseData.instructor.name}</h3>
                  <p className="text-theme-neutral-600">{courseData.instructor.bio}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6 border border-theme-neutral-200">
              <div className="text-3xl font-bold mb-4 text-theme-accent-DEFAULT">${courseData.price.toFixed(2)}</div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-theme-neutral-600">Duration:</span>
                  <span className="font-semibold text-theme-neutral-800">{courseData.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-neutral-600">Credits:</span>
                  <span className="font-semibold text-theme-neutral-800">{courseData.credits} Credits</span>
                </div>
                {exams.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-theme-neutral-600">Exams:</span>
                    <span className="font-semibold text-theme-neutral-800">{exams.length}</span>
                  </div>
                )}
              </div>

              <CourseEnrollButton courseId={courseData.id} />

              <div className="mt-6 text-sm text-theme-neutral-600">
                <p className="mb-2">✓ Instant access</p>
                <p className="mb-2">✓ Certificate upon completion</p>
                <p>✓ 30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
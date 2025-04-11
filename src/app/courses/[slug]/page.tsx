import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CourseEnrollButton } from '@/app/courses/[slug]/CourseEnrollButton';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { CourseWithRelations, Exam } from '@/types/database';
import { CourseType } from '@/types/course';
import { getCourseExams } from '@/lib/exams';
import BackgroundEffect from '@/components/ui/BackgroundEffect';
import { sanitizeText } from '@/utils/text';

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
  creditsByType?: Record<string, number>;
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
  
  // Organize credits by type
  const creditsByType: Record<string, number> = {};
  if (course.credits && course.credits.length > 0) {
    course.credits.forEach(credit => {
      creditsByType[credit.credit_type] = credit.amount;
    });
  }
  
  return {
    id: course.id,
    title: sanitizeText(course.title),
    description: sanitizeText(course.description),
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
      name: sanitizeText(course.author),
      bio: 'Experienced instructor with many years of industry expertise.',
      image: '' // No image available
    },
    creditsByType: creditsByType
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
    
    // Clean the search slug
    const cleanSlug = slug.toLowerCase().trim();
    
    // Convert to slug format and find matching course
    const matchingCourse = data.find(course => {
      // Try multiple matching techniques
      const courseSlug = course.sku.toLowerCase().replace(/\s+/g, '-');
      const simplifiedCourseSlug = courseSlug.replace(/[^a-z0-9-]/g, '');
      const simplifiedSearchSlug = cleanSlug.replace(/[^a-z0-9-]/g, '');
      
      return (
        courseSlug === cleanSlug ||
        simplifiedCourseSlug === simplifiedSearchSlug ||
        course.id === cleanSlug
      );
    });
    
    if (!matchingCourse) {
      return null;
    }
    
    return adaptCourse(matchingCourse);
  } catch (error) {
    console.error('Error in getCourseBySlug:', error);
    return null;
  }
}

export default async function CoursePage({ params }: Props) {
  const { slug } = params;
  
  // Get the course from the database
  const course = await getCourseBySlug(slug);
  
  // If course not found, return 404
  if (!course) {
    notFound();
  }

  // Get exams for this course
  let exams: Exam[] = [];
  try {
    exams = await getCourseExams(course.id);
  } catch (error) {
    console.error('Error fetching exams:', error);
  }

  return (
    <div className="relative min-h-screen">
      {/* Background effect */}
      <BackgroundEffect intensity="light" color="primary" />
      
      <div className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Link href="/courses" className="inline-flex items-center text-theme-primary-DEFAULT hover:text-theme-primary-dark transition-colors mb-4">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Courses
              </Link>
              
              <div className="flex flex-wrap gap-2 mb-4 animate-fadeIn">
                {course.type.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 text-sm font-semibold rounded-full glass-effect text-white backdrop-blur-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
              
              <h1 className="text-5xl font-bold mb-6 primary-gradient-text animate-fadeInUp">
                {course.title}
              </h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Course Content */}
              <div className="lg:col-span-2 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                {/* Display credits by license type */}
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-md border border-theme-neutral-200 mb-8">
                  <h2 className="text-xl font-bold mb-4 secondary-gradient-text">Credit Information</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {course.creditsByType && Object.entries(course.creditsByType).map(([type, amount]) => (
                      amount > 0 ? (
                        <div key={type} className="flex items-center bg-theme-neutral-50 p-3 rounded-lg">
                          <span className="text-md font-medium text-theme-primary-DEFAULT mr-2">{type}:</span>
                          <span className="text-md text-theme-neutral-700">{amount} credits</span>
                        </div>
                      ) : null
                    ))}
                    {(!course.creditsByType || Object.keys(course.creditsByType).length === 0) && (
                      <span className="text-md text-theme-neutral-500 col-span-full">No credits information available</span>
                    )}
                  </div>
                </div>

                <div className="prose max-w-none bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-md border border-theme-neutral-200">
                  <h2 className="text-2xl font-bold mb-4 accent-gradient-text">Course Description</h2>
                  <p className="mb-8 text-theme-neutral-600 leading-relaxed">{course.description}</p>

                  <h2 className="text-2xl font-bold mb-4 accent-gradient-text">Learning Objectives</h2>
                  <ul className="space-y-4 mb-8">
                    {course.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start text-theme-neutral-600 bg-white/60 p-3 rounded-lg border border-theme-neutral-200 shadow-sm animate-fadeInLeft" style={{ animationDelay: `${100 + (index * 100)}ms` }}>
                        <span className="text-theme-accent-DEFAULT mr-3 bg-theme-accent-light/20 p-1 rounded-full">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {objective}
                      </li>
                    ))}
                  </ul>

                  <h2 className="text-2xl font-bold mb-4 secondary-gradient-text">Course Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {course.features.map((feature, index) => (
                      <div key={index} className="flex items-start text-theme-neutral-600 bg-white/60 p-3 rounded-lg border border-theme-neutral-200 shadow-sm animate-fadeInLeft" style={{ animationDelay: `${300 + (index * 100)}ms` }}>
                        <span className="text-theme-secondary-DEFAULT mr-3 bg-theme-secondary-light/20 p-1 rounded-full">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {exams.length > 0 && (
                    <>
                      <h2 className="text-2xl font-bold mb-4 primary-gradient-text">Course Exams</h2>
                      <div className="space-y-4 mb-8">
                        {exams.map((exam, index) => (
                          <div 
                            key={exam.id} 
                            className="border border-theme-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white/80 animate-fadeInUp"
                            style={{ animationDelay: `${500 + (index * 100)}ms` }}
                          >
                            <h3 className="text-xl font-semibold mb-2 text-theme-neutral-800">{exam.title}</h3>
                            <p className="text-theme-neutral-600 mb-4">{exam.description}</p>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-theme-neutral-500 bg-theme-neutral-100 px-3 py-1 rounded-full">
                                Passing score: {exam.passing_score}%
                              </div>
                              <Link
                                href={`/courses/${slug}/exam?examId=${exam.id}`}
                                className="px-4 py-2 bg-gradient-to-r from-theme-accent-DEFAULT to-theme-accent-dark text-white rounded-md text-sm font-medium transition-colors hover:shadow-md"
                              >
                                Take Exam
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <h2 className="text-2xl font-bold mb-4 primary-gradient-text">Instructor</h2>
                  <div className="flex flex-col md:flex-row items-start gap-6 bg-white/60 p-6 rounded-lg border border-theme-neutral-200 shadow-sm animate-fadeInUp" style={{ animationDelay: '700ms' }}>
                    <div className="w-[120px] h-[120px] bg-gradient-to-br from-theme-primary-light to-theme-primary-DEFAULT rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
                      {course.instructor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-theme-neutral-800">{course.instructor.name}</h3>
                      <p className="text-theme-neutral-600 leading-relaxed">{course.instructor.bio}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enrollment Card */}
              <div className="lg:col-span-1 animate-fadeInLeft" style={{ animationDelay: '300ms' }}>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 sticky top-6 border border-theme-neutral-200">
                  <div className="text-3xl font-bold mb-2 accent-gradient-text">${course.price.toFixed(2)}</div>
                  <div className="text-theme-neutral-500 text-sm mb-6">One-time payment, lifetime access</div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-3 bg-theme-neutral-50 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-theme-primary-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-theme-neutral-600">Duration:</span>
                      </div>
                      <span className="font-semibold text-theme-neutral-800">{course.duration}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-theme-neutral-50 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-theme-secondary-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-theme-neutral-600">Credits:</span>
                      </div>
                      <span className="font-semibold text-theme-neutral-800">{course.credits} Credits</span>
                    </div>
                    {exams.length > 0 && (
                      <div className="flex justify-between items-center p-3 bg-theme-neutral-50 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-theme-accent-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-theme-neutral-600">Exams:</span>
                        </div>
                        <span className="font-semibold text-theme-neutral-800">{exams.length}</span>
                      </div>
                    )}
                  </div>

                  <CourseEnrollButton courseId={course.id} />

                  <div className="mt-8 space-y-3 text-sm">
                    <div className="flex items-center text-theme-neutral-700">
                      <svg className="w-5 h-5 mr-3 text-theme-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Instant access to all materials</span>
                    </div>
                    <div className="flex items-center text-theme-neutral-700">
                      <svg className="w-5 h-5 mr-3 text-theme-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Certificate upon completion</span>
                    </div>
                    <div className="flex items-center text-theme-neutral-700">
                      <svg className="w-5 h-5 mr-3 text-theme-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>30-day money-back guarantee</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-theme-neutral-200">
                    <div className="flex items-center justify-center gap-4 text-theme-neutral-500 text-sm">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Secure payment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
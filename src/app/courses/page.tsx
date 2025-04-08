'use client';
import { useState } from 'react';
import { courses } from '@/data/courses';
import CourseCard from '@/components/courses/CourseCard';
import { CourseType } from '@/types/course';

const courseTypes: CourseType[] = ['CFP', 'CPA', 'IRS', 'OTHER'];

export default function CoursesPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const allTypes = Array.from(new Set(courses.flatMap(course => course.type)));

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const filteredCourses = selectedTypes.length > 0
    ? courses.filter(course =>
        course.type.some(type => selectedTypes.includes(type))
      )
    : courses;

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-theme-neutral-800 mb-4">
            Available Courses
          </h1>
          <p className="text-theme-neutral-600 text-lg max-w-2xl mx-auto">
            Browse our selection of professional development courses designed to enhance your skills and advance your career.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-theme-neutral-800 mb-4">
            Filter by Course Type
          </h2>
          <div className="flex flex-wrap gap-3">
            {allTypes.map(type => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  selectedTypes.includes(type)
                    ? 'bg-theme-primary-DEFAULT text-white shadow-md'
                    : 'bg-theme-neutral-50 text-theme-neutral-800 border border-theme-neutral-200 hover:bg-theme-neutral-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course, index) => (
            <CourseCard
              key={course.slug}
              course={course}
              featured={index === 0}
            />
          ))}
        </div>
      </div>
    </main>
  );
} 
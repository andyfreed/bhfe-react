'use client';
import { useState, useEffect } from 'react';
import { EnhancedCourse } from '@/types/course';
import CourseEnrollButton from './CourseEnrollButton';

interface CourseFormatSelectorProps {
  course: EnhancedCourse;
  examCount: number;
}

export default function CourseFormatSelector({ course, examCount }: CourseFormatSelectorProps) {
  // Get available formats
  const formats = Object.keys(course.formatPrices || {});
  
  // Set default format (prefer Online if available)
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [price, setPrice] = useState<number>(course.price);
  
  // Initialize with the first available format or default to Online/Hardcopy
  useEffect(() => {
    if (formats.length > 0) {
      const defaultFormat = formats.includes('online') ? 'online' : formats[0];
      setSelectedFormat(defaultFormat);
      setPrice(course.formatPrices[defaultFormat]);
    }
  }, []);
  
  const handleFormatChange = (format: string) => {
    console.log('Format changed to:', format);
    setSelectedFormat(format);
    setPrice(course.formatPrices[format]);
  };
  
  return (
    <>
      {/* Price display */}
      <div className="mb-6">
        <div className="text-3xl font-bold mb-4 text-rose-500">${price.toFixed(2)}</div>
        
        {/* Format selector */}
        <div className="mb-6">
          <p className="text-neutral-700 mb-2">Select Format:</p>
          <div className="flex flex-col gap-3">
            {formats.map((format) => (
              <div 
                key={format}
                onClick={() => handleFormatChange(format)}
                className={`
                  border cursor-pointer transition-all p-4 rounded-xl flex items-center justify-between
                  ${selectedFormat === format 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-neutral-200 hover:border-blue-300 hover:bg-blue-50/30'
                  }
                `}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                    selectedFormat === format 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-neutral-300'
                  }`}>
                    {selectedFormat === format && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium capitalize">{format}</span>
                </div>
                <span className="font-bold">${course.formatPrices[format].toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Exam count display */}
      <div className="space-y-4 mb-6">
        {examCount > 0 && (
          <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-theme-accent-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-neutral-600">Exams:</span>
            </div>
            <span className="font-semibold text-neutral-800">{examCount}</span>
          </div>
        )}
      </div>

      {/* Enroll button */}
      <CourseEnrollButton 
        courseId={course.id} 
        selectedFormat={selectedFormat}
        formatPrice={price}
      />
    </>
  );
} 
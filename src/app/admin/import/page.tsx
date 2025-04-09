'use client';

import CourseImporter from '@/components/admin/CourseImporter';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
        <p className="mt-2 text-sm text-gray-700">
          Import data into the system from CSV files.
        </p>
      </div>
      
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg p-6">
        <CourseImporter />
      </div>
    </div>
  );
} 
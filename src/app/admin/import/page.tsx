'use client';

import ImportComponent from '@/components/admin/ImportComponent';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
      <p className="text-gray-600">Import data into the system from XLSX files.</p>
      
      <div className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold mb-2">Import Courses from XLSX</h2>
        <p className="mb-4">
          Upload an Excel file to import multiple courses at once. Make sure your XLSX has the required headers: 
          title, sku, description, main_subject, author, etc. <strong>Important: Use 2-letter state codes</strong> (e.g., &quot;CA&quot;, &quot;NY&quot;) 
          for States and separate multiple states with a pipe (|) character.
          <a 
            href="/api/admin/import/courses/sample" 
            className="text-blue-600 hover:text-blue-800 ml-2"
          >
            Download sample template
          </a>
        </p>
        
        <ImportComponent
          endpoint="/api/admin/import/courses"
          acceptedFileTypes=".xlsx"
          buttonText="Import Courses"
        />
      </div>
    </div>
  );
} 
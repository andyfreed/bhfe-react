'use client';

import { useState } from 'react';
import { AlertCircle, Upload, CheckCircle2, FileText, Download } from 'lucide-react';
import { Button, Alert, AlertTitle, AlertDescription } from '@/components/ui';

export default function CourseImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setSuccess(null);
    setPreview([]);
    
    if (!selectedFile) {
      return;
    }
    
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }
    
    setFile(selectedFile);
    previewCSV(selectedFile);
  };

  const previewCSV = (csvFile: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      try {
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        
        const previewData = [];
        for (let i = 1; i < Math.min(rows.length, 6); i++) {
          if (!rows[i].trim()) continue;
          
          const values = parseCSVRow(rows[i]);
          const rowData: any = {};
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          
          previewData.push(rowData);
        }
        
        setPreview(previewData);
      } catch (err) {
        setError('Error parsing CSV file. Please check the format.');
        console.error(err);
      }
    };
    
    reader.readAsText(csvFile);
  };

  // Handle CSV rows that might contain commas within quoted values
  const parseCSVRow = (row: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      
      if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current) {
      result.push(current.trim());
    }
    
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a CSV file to import');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/import/courses', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import courses');
      }
      
      setSuccess(`Successfully imported ${data.imported} courses`);
      setFile(null);
      setPreview([]);
      
      // Reset the file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while importing courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const importSampleFile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreview([]);
    
    try {
      // Fetch the sample CSV file from the public directory
      const response = await fetch('/import-file/sample import.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch the sample CSV file');
      }
      
      const blob = await response.blob();
      const sampleFile = new File([blob], 'sample import.csv', { type: 'text/csv' });
      
      setFile(sampleFile);
      previewCSV(sampleFile);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading the sample file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const importSampleFileDirectly = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreview([]);
    
    try {
      const response = await fetch('/api/admin/import/courses/sample', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import sample file');
      }
      
      setSuccess(`Successfully imported ${data.imported} courses from the sample file`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while importing the sample file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Import Courses from CSV</h2>
        <p className="text-sm text-gray-500">
          Upload a CSV file to import multiple courses at once.
          Make sure your CSV has the required headers: sku, title, description, main_subject, author, etc.
          Multiple values for main_subject or states should be separated with a pipe (|) character.
          <a
            href="/api/admin/import/courses/template"
            download
            className="ml-1 text-blue-600 hover:text-blue-800"
          >
            Download sample template
          </a>
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center space-x-4 mb-4">
        <Button 
          type="button"
          variant="outline"
          onClick={importSampleFile}
          className="flex items-center"
          disabled={loading}
        >
          <FileText className="h-4 w-4 mr-2" />
          Preview Sample File
        </Button>
        <Button 
          type="button"
          variant="secondary"
          onClick={importSampleFileDirectly}
          className="flex items-center"
          disabled={loading}
        >
          <Download className="h-4 w-4 mr-2" />
          Import Sample File Directly
        </Button>
        <span className="text-sm text-gray-500">or</span>
        <div>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="csv-file"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose CSV File
          </label>
        </div>
        {file && (
          <span className="text-sm text-gray-600">
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </span>
        )}
      </div>
      
      {preview.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="text-sm font-medium p-3 bg-gray-50 border-b">
            Preview (first {preview.length} {preview.length === 1 ? 'row' : 'rows'})
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).map((header) => (
                    <th 
                      key={header}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td 
                        key={i}
                        className="px-4 py-2 text-sm text-gray-500"
                      >
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button 
          type="button" 
          onClick={handleSubmit}
          disabled={loading || !file}
        >
          {loading ? 'Importing...' : 'Import Courses'}
        </Button>
      </div>
    </div>
  );
} 
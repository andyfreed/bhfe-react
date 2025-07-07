'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CertificateWithRelations } from '@/lib/certificates';
import CertificateCard from '@/components/certificates/CertificateCard';

export default function UserCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user ID (you'll need to implement this based on your auth system)
      const userId = 'current-user-id'; // Replace with actual user ID
      
      const response = await fetch(`/api/certificates/user/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load certificates');
      }
      
      setCertificates(data.certificates);
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadCertificates}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
        <p className="text-gray-600">
          View and manage your earned certificates for completed courses.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Yet</h2>
          <p className="text-gray-600 mb-6">
            Complete courses and pass exams to earn certificates.
          </p>
          <Link 
            href="/courses" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              showActions={false}
            />
          ))}
        </div>
      )}

      {certificates.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Total Certificates: {certificates.length}
          </p>
        </div>
      )}
    </div>
  );
}
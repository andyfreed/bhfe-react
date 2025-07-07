'use client';

import React, { useEffect, useState } from 'react';
import { CertificateWithRelations } from '@/lib/certificates';
import CertificateCard from '@/components/certificates/CertificateCard';
import CertificateEditModal from '@/components/certificates/CertificateEditModal';
import { Certificate } from '@/types/database';

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadAllCertificates();
  }, []);

  const loadAllCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/certificates');
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

  const handleEditCertificate = (certificate: Certificate) => {
    setEditingCertificate(certificate);
  };

  const handleSaveCertificate = async (
    fieldName: string,
    newValue: string,
    oldValue: string,
    editReason?: string
  ) => {
    if (!editingCertificate) return;

    try {
      const response = await fetch(`/api/certificates/${editingCertificate.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editedBy: 'admin-user-id', // Replace with actual admin user ID
          fieldName,
          newValue,
          oldValue,
          editReason
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit certificate');
      }

      // Update local state
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === editingCertificate.id 
            ? { ...cert, [fieldName]: newValue }
            : cert
        )
      );

      setEditingCertificate(null);
    } catch (error) {
      console.error('Error editing certificate:', error);
      alert('Failed to edit certificate: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleRevokeCertificate = async (certificate: Certificate) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) {
      return;
    }

    const reason = prompt('Enter reason for revocation:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/certificates/${certificate.id}/revoke`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revokedBy: 'admin-user-id', // Replace with actual admin user ID
          reason
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke certificate');
      }

      // Update local state
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === certificate.id 
            ? { ...cert, is_revoked: true, revoked_reason: reason }
            : cert
        )
      );
    } catch (error) {
      console.error('Error revoking certificate:', error);
      alert('Failed to revoke certificate: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'valid' && !cert.is_revoked) ||
      (filterType === 'revoked' && cert.is_revoked) ||
      filterType === cert.credit_type;

    return matchesSearch && matchesFilter;
  });

  const creditTypes = ['CPA', 'CFP', 'CDFA', 'EA', 'OTRP', 'EA/OTRP', 'ERPA'];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificates...</p>
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
            onClick={loadAllCertificates}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Management</h1>
        <p className="text-gray-600">
          Manage and edit certificates for all users.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Certificates</option>
            <option value="valid">Valid Only</option>
            <option value="revoked">Revoked Only</option>
            <optgroup label="Credit Types">
              {creditTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Total Certificates</h3>
          <p className="text-2xl font-bold text-blue-600">{certificates.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Valid Certificates</h3>
          <p className="text-2xl font-bold text-green-600">
            {certificates.filter(c => !c.is_revoked).length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Revoked Certificates</h3>
          <p className="text-2xl font-bold text-red-600">
            {certificates.filter(c => c.is_revoked).length}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Filtered Results</h3>
          <p className="text-2xl font-bold text-gray-600">{filteredCertificates.length}</p>
        </div>
      </div>

      {/* Certificates List */}
      {filteredCertificates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No certificates found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredCertificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onEdit={handleEditCertificate}
              onRevoke={handleRevokeCertificate}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingCertificate && (
        <CertificateEditModal
          certificate={editingCertificate}
          isOpen={!!editingCertificate}
          onClose={() => setEditingCertificate(null)}
          onSave={handleSaveCertificate}
        />
      )}
    </div>
  );
}
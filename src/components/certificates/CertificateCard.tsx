'use client';

import React, { useState } from 'react';
import { Certificate } from '@/types/database';
import { CertificateWithRelations } from '@/lib/certificates';

// Simple date formatting function
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

interface CertificateCardProps {
  certificate: CertificateWithRelations;
  onEdit?: (certificate: Certificate) => void;
  onRevoke?: (certificate: Certificate) => void;
  showActions?: boolean;
}

export default function CertificateCard({ 
  certificate, 
  onEdit, 
  onRevoke,
  showActions = false 
}: CertificateCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getBorderColor = (creditType: string) => {
    const colors = {
      'CPA': 'border-blue-500',
      'CFP': 'border-indigo-500',
      'CDFA': 'border-amber-500',
      'EA': 'border-green-500',
      'OTRP': 'border-red-500',
      'EA/OTRP': 'border-purple-500',
      'ERPA': 'border-orange-500'
    };
    return colors[creditType as keyof typeof colors] || 'border-gray-300';
  };

  const getStatusColor = (isRevoked: boolean) => {
    return isRevoked ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
  };

  return (
    <div className={`border-2 ${getBorderColor(certificate.credit_type)} rounded-lg p-6 shadow-lg bg-white`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{certificate.title}</h3>
          <p className="text-sm text-gray-600">Certificate #{certificate.certificate_number}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(certificate.is_revoked)}`}>
            {certificate.is_revoked ? 'Revoked' : 'Valid'}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
            {certificate.credit_type}
          </span>
        </div>
      </div>

      {/* Certificate Details */}
      <div className="space-y-3">
        <div>
          <p className="text-lg font-semibold text-gray-800">{certificate.recipient_name}</p>
          <p className="text-sm text-gray-600">has successfully completed</p>
        </div>

        <div>
          <p className="text-lg font-medium text-gray-800">{certificate.course_title}</p>
          <p className="text-sm text-gray-600">
            Course ID: {certificate.course?.sku || 'N/A'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Completion Date:</p>
            <p className="font-medium">{formatDate(certificate.completion_date)}</p>
          </div>
          <div>
            <p className="text-gray-600">Exam Score:</p>
            <p className="font-medium">{certificate.exam_score}%</p>
          </div>
          <div>
            <p className="text-gray-600">Credits Earned:</p>
            <p className="font-medium">{certificate.credits_earned}</p>
          </div>
          <div>
            <p className="text-gray-600">Credit Type:</p>
            <p className="font-medium">{certificate.credit_type}</p>
          </div>
        </div>

        {certificate.is_revoked && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              <strong>Revoked:</strong> {formatDate(certificate.revoked_at!)}
            </p>
            {certificate.revoked_reason && (
              <p className="text-sm text-red-700 mt-1">
                Reason: {certificate.revoked_reason}
              </p>
            )}
          </div>
        )}

        {/* Toggle Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {/* Additional Details */}
        {showDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Certificate Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Certificate ID:</p>
                <p className="font-mono text-xs">{certificate.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Template:</p>
                <p>{certificate.template?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Created:</p>
                <p>{formatDate(certificate.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-600">Last Updated:</p>
                <p>{formatDate(certificate.updated_at)}</p>
              </div>
            </div>

            {certificate.custom_data && (
              <div className="mt-3">
                <p className="text-gray-600 mb-1">Custom Data:</p>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(JSON.parse(certificate.custom_data), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-4 pt-4 border-t flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(certificate)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Edit
            </button>
          )}
          {onRevoke && !certificate.is_revoked && (
            <button
              onClick={() => onRevoke(certificate)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Revoke
            </button>
          )}
        </div>
      )}
    </div>
  );
}
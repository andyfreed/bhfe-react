'use client';

import React, { useState } from 'react';
import { Certificate } from '@/types/database';

interface CertificateEditModalProps {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
  onSave: (fieldName: string, newValue: string, oldValue: string, editReason?: string) => void;
}

export default function CertificateEditModal({ 
  certificate, 
  isOpen, 
  onClose, 
  onSave 
}: CertificateEditModalProps) {
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editableFields = [
    { key: 'recipient_name', label: 'Recipient Name', value: certificate.recipient_name },
    { key: 'course_title', label: 'Course Title', value: certificate.course_title },
    { key: 'exam_score', label: 'Exam Score', value: certificate.exam_score.toString() },
    { key: 'credits_earned', label: 'Credits Earned', value: certificate.credits_earned.toString() },
    { key: 'completion_date', label: 'Completion Date', value: certificate.completion_date }
  ];

  const handleFieldSelect = (field: { key: string; label: string; value: string }) => {
    setEditField(field.key);
    setEditValue(field.value);
  };

  const handleSave = async () => {
    if (!editField || !editValue) return;

    setIsSubmitting(true);
    try {
      const currentField = editableFields.find(f => f.key === editField);
      const oldValue = currentField?.value || '';
      
      await onSave(editField, editValue, oldValue, editReason);
      
      // Reset form
      setEditField('');
      setEditValue('');
      setEditReason('');
      onClose();
    } catch (error) {
      console.error('Error saving certificate edit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
        <h2 className="text-xl font-bold mb-4">Edit Certificate</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Field to Edit:</label>
          <div className="space-y-2">
            {editableFields.map(field => (
              <button
                key={field.key}
                onClick={() => handleFieldSelect(field)}
                className={`w-full text-left p-2 rounded border ${
                  editField === field.key 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">{field.label}</div>
                <div className="text-sm text-gray-600">{field.value}</div>
              </button>
            ))}
          </div>
        </div>

        {editField && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Value:</label>
              <input
                type={editField === 'completion_date' ? 'date' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                placeholder="Enter new value"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Edit Reason (Optional):</label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Reason for this edit..."
              />
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editField || !editValue || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
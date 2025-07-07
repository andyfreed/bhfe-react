'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'responded' | 'closed' | 'spam';
  notes?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export default function InquiriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/inquiries');
      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }
      
      const data = await response.json();
      setInquiries(data);
      
      // If statusFilter is 'new', find the first new inquiry and select it
      if (statusFilter === 'new' && data.length > 0) {
        const newInquiries = data.filter((inquiry: ContactInquiry) => inquiry.status === 'new');
        if (newInquiries.length > 0) {
          handleInquiryClick(newInquiries[0]);
        }
      }
    } catch (err) {
      console.error('Error loading inquiries:', err);
      setError('Failed to load inquiries. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, handleInquiryClick]);
  
  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);
  
  // Update the URL when the status filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      router.push('/admin/inquiries');
    } else {
      router.push(`/admin/inquiries?status=${statusFilter}`);
    }
  }, [statusFilter, router]);
  
  const filteredInquiries = statusFilter === 'all' 
    ? inquiries 
    : inquiries.filter(inquiry => inquiry.status === statusFilter);
  
  const handleInquiryClick = useCallback((inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    setNotes(inquiry.notes || '');
    setStatus(inquiry.status);
  }, []);
  
  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
  };
  
  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/inquiries/${selectedInquiry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes,
          responded_at: status === 'responded' && selectedInquiry.status !== 'responded' 
            ? new Date().toISOString() 
            : selectedInquiry.responded_at,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update inquiry');
      }
      
      // Refresh the inquiries list
      fetchInquiries();
      
      // Update the selected inquiry
      setSelectedInquiry({
        ...selectedInquiry,
        status: status as any,
        notes,
        responded_at: status === 'responded' && selectedInquiry.status !== 'responded' 
          ? new Date().toISOString() 
          : selectedInquiry.responded_at,
        updated_at: new Date().toISOString(),
      });
      
    } catch (err) {
      console.error('Error updating inquiry:', err);
      alert('Failed to update inquiry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'spam':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const getNewInquiryCount = () => {
    return inquiries.filter(inquiry => inquiry.status === 'new').length;
  };

  return (
    <div className="py-6">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Contact Inquiries</h1>
          <div className="text-sm">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">
              {getNewInquiryCount()} new
            </span>
            <span className="text-gray-500">
              {inquiries.length} total
            </span>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
            <button 
              onClick={fetchInquiries}
              className="ml-4 underline"
            >
              Try Again
            </button>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow border border-theme-neutral-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Filter by Status</h2>
                <select 
                  value={statusFilter} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-1 border border-theme-neutral-200 rounded"
                >
                  <option value="all">All Inquiries</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="responded">Responded</option>
                  <option value="closed">Closed</option>
                  <option value="spam">Spam</option>
                </select>
              </div>
              
              <div className="text-sm text-theme-neutral-600 mb-2">
                {filteredInquiries.length} {filteredInquiries.length === 1 ? 'inquiry' : 'inquiries'} found
              </div>
              
              {isLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-theme-primary-DEFAULT"></div>
                </div>
              ) : (
                <div className="h-[calc(100vh-16rem)] overflow-y-auto border border-theme-neutral-200 rounded">
                  {filteredInquiries.length === 0 ? (
                    <div className="p-4 text-center text-theme-neutral-500">
                      No inquiries found
                    </div>
                  ) : (
                    <ul className="divide-y divide-theme-neutral-200">
                      {filteredInquiries.map((inquiry) => (
                        <li 
                          key={inquiry.id}
                          className={`p-4 cursor-pointer hover:bg-theme-neutral-50 ${selectedInquiry?.id === inquiry.id ? 'bg-theme-primary-light/10' : ''}`}
                          onClick={() => handleInquiryClick(inquiry)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{inquiry.name}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClasses(inquiry.status)}`}>
                              {inquiry.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-theme-neutral-600 mb-1">{inquiry.email}</div>
                          <div className="text-sm font-medium">{inquiry.subject}</div>
                          <div className="text-xs text-theme-neutral-500 mt-2">
                            {formatDateTime(inquiry.created_at)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:w-2/3">
            {selectedInquiry ? (
              <div className="bg-white p-6 rounded-lg shadow border border-theme-neutral-200">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{selectedInquiry.subject}</h2>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClasses(selectedInquiry.status)}`}>
                      {selectedInquiry.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-sm mb-2">
                    <span className="font-medium">From:</span> {selectedInquiry.name} ({selectedInquiry.email})
                  </div>
                  
                  <div className="text-sm mb-4">
                    <span className="font-medium">Received:</span> {formatDateTime(selectedInquiry.created_at)}
                  </div>
                  
                  <div className="bg-theme-neutral-50 p-4 rounded-lg mb-6 whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </div>
                  
                  <div className="border-t border-theme-neutral-200 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-theme-neutral-800 mb-1">
                          Status
                        </label>
                        <select
                          id="status"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-theme-neutral-200 focus:outline-none focus:ring-2 focus:ring-theme-primary-light"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="responded">Responded</option>
                          <option value="closed">Closed</option>
                          <option value="spam">Spam</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-theme-neutral-800 mb-1">
                          Last Updated
                        </label>
                        <div className="px-3 py-2 border border-theme-neutral-200 rounded-lg bg-theme-neutral-50 text-theme-neutral-600">
                          {formatDateTime(selectedInquiry.updated_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-theme-neutral-800 mb-1">
                        Internal Notes
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-theme-neutral-200 focus:outline-none focus:ring-2 focus:ring-theme-primary-light"
                        placeholder="Add notes about this inquiry..."
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-between">
                      <div>
                        {selectedInquiry.responded_at && (
                          <div className="text-sm text-theme-neutral-600">
                            <span className="font-medium">Responded:</span> {formatDateTime(selectedInquiry.responded_at)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <a
                          href={`mailto:${selectedInquiry.email}?subject=RE: ${selectedInquiry.subject}`}
                          className="px-4 py-2 bg-theme-primary-DEFAULT text-white rounded-lg hover:bg-theme-primary-dark"
                        >
                          Reply by Email
                        </a>
                        
                        <button
                          onClick={handleUpdateInquiry}
                          disabled={isSaving}
                          className="px-4 py-2 bg-theme-accent-DEFAULT text-white rounded-lg hover:bg-theme-accent-dark disabled:bg-theme-neutral-400"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow border border-theme-neutral-200 h-full flex items-center justify-center">
                <div className="text-center text-theme-neutral-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-theme-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-lg">Select an inquiry to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
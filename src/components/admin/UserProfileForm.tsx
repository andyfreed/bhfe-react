'use client';

import React, { useState } from 'react';

// Define interface for address structure
interface Address {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Define interface for license structure
interface License {
  type: string;
  number: string;
  state?: string;
  expiration_date?: string;
}

interface UserProfileFormProps {
  userId: string;
  initialData: {
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string; // Keep for backward compatibility
    company?: string;
    phone?: string;
    role?: string;
    shipping_address?: Address;
    billing_address?: Address;
    licenses?: License[];
  };
  onSuccess: (updatedData: any) => void;
  onCancel: () => void;
}

interface UserFormData {
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  phone: string;
  role: string;
  shipping_address: Address;
  billing_address: Address;
  licenses: License[];
}

export default function UserProfileForm({
  userId,
  initialData,
  onSuccess,
  onCancel
}: UserProfileFormProps) {
  // If we have full_name but not first_name/last_name, split it
  const splitName = (fullName: string = '') => {
    const parts = fullName.trim().split(' ');
    const lastName = parts.length > 1 ? parts.pop() || '' : '';
    const firstName = parts.join(' ');
    return { firstName, lastName };
  };

  const { firstName, lastName } = initialData.full_name ? 
    splitName(initialData.full_name) : 
    { firstName: initialData.first_name || '', lastName: initialData.last_name || '' };

  const [formData, setFormData] = useState<UserFormData>({
    email: initialData.email || '',
    first_name: firstName,
    last_name: lastName,
    company: initialData.company || '',
    phone: initialData.phone || '',
    role: initialData.role || 'user',
    shipping_address: initialData.shipping_address || {
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    },
    billing_address: initialData.billing_address || {
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    },
    licenses: initialData.licenses || []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useShippingForBilling, setUseShippingForBilling] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        if (parent === 'shipping_address' || parent === 'billing_address') {
          return {
            ...prev,
            [parent]: {
              ...(prev[parent as keyof UserFormData] as Address),
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle adding license
  const handleAddLicense = () => {
    setFormData(prev => ({
      ...prev,
      licenses: [
        ...prev.licenses,
        { type: '', number: '' }
      ]
    }));
  };
  
  // Handle removing license
  const handleRemoveLicense = (index: number) => {
    setFormData(prev => ({
      ...prev,
      licenses: prev.licenses.filter((_, i) => i !== index)
    }));
  };
  
  // Handle license field change
  const handleLicenseChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedLicenses = [...prev.licenses];
      updatedLicenses[index] = {
        ...updatedLicenses[index],
        [field]: value
      };
      return {
        ...prev,
        licenses: updatedLicenses
      };
    });
  };
  
  // Copy shipping address to billing
  const copyShippingToBilling = () => {
    if (useShippingForBilling) {
      setFormData(prev => ({
        ...prev,
        billing_address: {...prev.shipping_address}
      }));
    }
  };
  
  // Toggle use shipping for billing
  const toggleUseShippingForBilling = () => {
    const newValue = !useShippingForBilling;
    setUseShippingForBilling(newValue);
    
    if (newValue) {
      copyShippingToBilling();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    console.log('Submitting user profile data:', formData);
    
    try {
      // Transform data to match API expectations
      const transformed = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        company: formData.company,
        phone: formData.phone,
        role: formData.role,
        billing_address: {
          street: formData.billing_address.address1,
          city: formData.billing_address.city,
          state: formData.billing_address.state,
          zip: formData.billing_address.zip,
          country: formData.billing_address.country,
        },
        shipping_address: {
          street: formData.shipping_address.address1,
          city: formData.shipping_address.city,
          state: formData.shipping_address.state,
          zip: formData.shipping_address.zip,
          country: formData.shipping_address.country,
        },
        licenses: formData.licenses.map(l => ({
          license_type: l.type,
          license_number: l.number,
        })),
      };

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(transformed),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to update user profile');
      }
      
      const updatedUser = await response.json();
      console.log('Updated user data from API:', updatedUser);
      
      // Pass the complete user data to the parent component
      onSuccess({
        ...updatedUser,
        // Ensure these fields are included even if API doesn't return them
        first_name: formData.first_name,
        last_name: formData.last_name,
        company: formData.company, 
        phone: formData.phone,
        role: formData.role,
        licenses: formData.licenses
      });
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError((err as Error).message || 'Failed to update user profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Edit User Profile</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            readOnly
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="first_name">
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="last_name">
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="company">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
            Phone
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        {/* Shipping Address Section */}
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="shipping_address.address1">
                Address Line 1
              </label>
              <input
                type="text"
                id="shipping_address.address1"
                name="shipping_address.address1"
                value={formData.shipping_address.address1}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="shipping_address.address2">
                Address Line 2
              </label>
              <input
                type="text"
                id="shipping_address.address2"
                name="shipping_address.address2"
                value={formData.shipping_address.address2}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="shipping_address.city">
                City
              </label>
              <input
                type="text"
                id="shipping_address.city"
                name="shipping_address.city"
                value={formData.shipping_address.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="shipping_address.state">
                State / Province
              </label>
              <input
                type="text"
                id="shipping_address.state"
                name="shipping_address.state"
                value={formData.shipping_address.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="shipping_address.zip">
                ZIP / Postal Code
              </label>
              <input
                type="text"
                id="shipping_address.zip"
                name="shipping_address.zip"
                value={formData.shipping_address.zip}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="shipping_address.country">
                Country
              </label>
              <select
                id="shipping_address.country"
                name="shipping_address.country"
                value={formData.shipping_address.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                {/* Add more countries as needed */}
              </select>
            </div>
          </div>
        </div>
        
        {/* Billing Address Section */}
        <div className="border rounded-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Billing Address</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useShippingForBilling"
                checked={useShippingForBilling}
                onChange={toggleUseShippingForBilling}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="useShippingForBilling" className="ml-2 text-sm text-gray-700">
                Same as shipping address
              </label>
            </div>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${useShippingForBilling ? 'opacity-50' : ''}`}>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="billing_address.address1">
                Address Line 1
              </label>
              <input
                type="text"
                id="billing_address.address1"
                name="billing_address.address1"
                value={formData.billing_address.address1}
                onChange={handleChange}
                disabled={useShippingForBilling}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="billing_address.address2">
                Address Line 2
              </label>
              <input
                type="text"
                id="billing_address.address2"
                name="billing_address.address2"
                value={formData.billing_address.address2}
                onChange={handleChange}
                disabled={useShippingForBilling}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="billing_address.city">
                City
              </label>
              <input
                type="text"
                id="billing_address.city"
                name="billing_address.city"
                value={formData.billing_address.city}
                onChange={handleChange}
                disabled={useShippingForBilling}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="billing_address.state">
                State / Province
              </label>
              <input
                type="text"
                id="billing_address.state"
                name="billing_address.state"
                value={formData.billing_address.state}
                onChange={handleChange}
                disabled={useShippingForBilling}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="billing_address.zip">
                ZIP / Postal Code
              </label>
              <input
                type="text"
                id="billing_address.zip"
                name="billing_address.zip"
                value={formData.billing_address.zip}
                onChange={handleChange}
                disabled={useShippingForBilling}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="billing_address.country">
                Country
              </label>
              <select
                id="billing_address.country"
                name="billing_address.country"
                value={formData.billing_address.country}
                onChange={handleChange}
                disabled={useShippingForBilling}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                {/* Add more countries as needed */}
              </select>
            </div>
          </div>
        </div>
        
        {/* Licenses Section */}
        <div className="border rounded-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Professional Licenses</h3>
            <button
              type="button"
              onClick={handleAddLicense}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              + Add License
            </button>
          </div>
          
          {formData.licenses.length === 0 ? (
            <div className="text-gray-500 italic">No licenses added</div>
          ) : (
            formData.licenses.map((license, index) => (
              <div key={index} className="border rounded p-3 mb-3">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">License #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveLicense(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Type</label>
                    <select
                      value={license.type}
                      onChange={(e) => handleLicenseChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select License Type</option>
                      <option value="CPA">CPA</option>
                      <option value="CFP">CFP</option>
                      <option value="EA">EA</option>
                      <option value="CDFA">CDFA</option>
                      <option value="OTRP">OTRP</option>
                      <option value="ERPA">ERPA</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <input
                      type="text"
                      value={license.number}
                      onChange={(e) => handleLicenseChange(index, 'number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 
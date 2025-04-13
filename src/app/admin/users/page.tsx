'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define interfaces for data structures
interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  company: string;
  phone: string;
  created_at: string;
  updated_at: string;
  enrollmentCount: number;
}

// Create a simple AdminUsersSection component
function AdminUsersSection({ 
  users, 
  isLoading,
  hasError
}: { 
  users: UserProfile[]; 
  isLoading: boolean;
  hasError: boolean;
}) {
  const numTotalUsers = users.length;
  const numAdminUsers = users.filter(user => user.role === 'admin').length;
  const numUsersWithEnrollments = users.filter(user => user.enrollmentCount > 0).length;

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Admin Users</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Admin Users</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">Failed to load user data. Please try again later.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Admin Users</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-bold">Total Users</h2>
          <p className="text-2xl">{numTotalUsers}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-bold">Admin Users</h2>
          <p className="text-2xl">{numAdminUsers}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <h2 className="font-bold">Users with Enrollments</h2>
          <p className="text-2xl">{numUsersWithEnrollments}</p>
        </div>
      </div>
      
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id.substring(0, 8)}...</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.full_name || 'Not set'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.company || 'Not set'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.enrollmentCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        
        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'An error occurred while fetching users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <AdminUsersSection 
      users={users} 
      isLoading={isLoading} 
      hasError={!!error} 
    />
  );
} 
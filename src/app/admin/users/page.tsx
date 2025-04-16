'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define interfaces for data structures
interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  email: string;
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
  hasError,
  error
}: { 
  users: UserProfile[]; 
  isLoading: boolean;
  hasError: boolean;
  error: string | null;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>(users);

  // Update filtered users when search term or users change
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      (user.full_name && user.full_name.toLowerCase().includes(lowerCaseSearch)) ||
      (user.email && user.email.toLowerCase().includes(lowerCaseSearch))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

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
          <span className="block sm:inline">{error}</span>
          {error && error.includes('permission') && (
            <div className="mt-4">
              <Link href="/auth/login" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Login as Admin
              </Link>
            </div>
          )}
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
      
      {/* Search input */}
      <div className="mb-4">
        <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-1">
          Search users by name or email
        </label>
        <div className="relative rounded-md shadow-sm">
          <input
            type="text"
            id="user-search"
            className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
        </p>
      </div>
      
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id.substring(0, 8)}...</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.full_name || 'Not set'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email || 'Not set'}</td>
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Direct login function for development/testing
  const handleDirectAdminLogin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/bypass-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret: 'admin-dev-bypass' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }
      
      setIsAdmin(true);
      fetchUsers();
    } catch (err: any) {
      console.error('Error authenticating:', err);
      setError(err.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      
      if (response.status === 401) {
        setError('You do not have permission to access this page. Please log in as an admin user.');
        setUsers([]);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Extract the users array from the response
      setUsers(data.users || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'An error occurred while fetching users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (error && error.includes('permission')) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Admin Users</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <div className="mt-4 flex space-x-4">
            <Link href="/auth/login" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              Login as Admin
            </Link>
            <button 
              onClick={handleDirectAdminLogin}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Development Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminUsersSection 
      users={users} 
      isLoading={isLoading} 
      hasError={!!error && !error.includes('permission')} 
      error={error} 
    />
  );
} 
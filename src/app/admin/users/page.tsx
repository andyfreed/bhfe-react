'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CheckIcon } from 'lucide-react';

// Define interfaces for data structures
interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface UserEnrollmentCount {
  user_id: string;
  count: number;
}

interface UserRole {
  id: string;
  role: string;
}

interface EnhancedUser extends UserData {
  enrollmentCount: number;
  roles: string[];
}

// Create a simple AdminUsersSection component
function AdminUsersSection({ 
  users, 
  numActiveUsers, 
  numTotalUsers, 
  numUsersWithEnrollments 
}: { 
  users: EnhancedUser[]; 
  numActiveUsers: number; 
  numTotalUsers: number; 
  numUsersWithEnrollments: number; 
}) {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Admin Users</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-bold">Total Users</h2>
          <p className="text-2xl">{numTotalUsers}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-bold">Active Users</h2>
          <p className="text-2xl">{numActiveUsers}</p>
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.enrollmentCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.roles.join(', ') || 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AdminUsersPage() {
  // Initialize user data with proper types
  let usersData: UserData[] = [];
  let numActiveUsers = 0;
  let numTotalUsers = 0;
  let numUsersWithEnrollments = 0;
  
  try {
    // Fetch users data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at, last_sign_in_at');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }
    
    usersData = users as UserData[];
    
    // Fetch user enrollments count
    let userEnrollmentsData: UserEnrollmentCount[] = [];
    try {
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('user_enrollments')
        .select('user_id, count(*)')
        .group('user_id');
      
      if (enrollmentsError) {
        console.error('Error fetching user enrollments:', enrollmentsError);
      } else if (enrollments) {
        userEnrollmentsData = enrollments.map((item: any) => ({
          user_id: item.user_id as string,
          count: parseInt(item.count as string)
        }));
      }
    } catch (err) {
      console.error('Failed to fetch user enrollments:', err);
    }
    
    // Fetch user roles
    let userRolesData: UserRole[] = [];
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, role');
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      } else {
        userRolesData = roles as UserRole[];
      }
    } catch (err) {
      console.error('Failed to fetch user roles:', err);
    }
    
    // Combine user data with enrollments and roles
    const enhancedUsers = usersData.map(user => {
      const enrollmentData = userEnrollmentsData.find(e => e.user_id === user.id);
      const enrollmentCount = enrollmentData ? enrollmentData.count : 0;
      
      return {
        ...user,
        enrollmentCount,
        roles: userRolesData
          .filter(role => role.id === user.id)
          .map(role => role.role)
      };
    });
    
    // Calculate statistics
    numTotalUsers = enhancedUsers.length;
    numActiveUsers = enhancedUsers.filter(user => user.last_sign_in_at).length;
    numUsersWithEnrollments = enhancedUsers.filter(user => user.enrollmentCount > 0).length;
    
    // Return the component with prepared data
    return (
      <AdminUsersSection
        users={enhancedUsers}
        numActiveUsers={numActiveUsers}
        numTotalUsers={numTotalUsers}
        numUsersWithEnrollments={numUsersWithEnrollments}
      />
    );
  } catch (error) {
    console.error('Error in AdminUsersPage:', error);
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
} 
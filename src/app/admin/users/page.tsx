'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Settings, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';

// Define the User type
interface User {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  company?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

// For development testing purposes
function isDevMode() {
  return process.env.NODE_ENV === 'development';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User management state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Filtered and paginated data
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = 
      roleFilter === "all" || 
      user.role?.toLowerCase() === roleFilter.toLowerCase();
    
    return matchesSearch && matchesRole;
  });
  
  const totalFilteredItems = filteredUsers.length;
  const totalFilteredPages = Math.max(1, Math.ceil(totalFilteredItems / itemsPerPage));
  
  // Ensure current page is valid after filtering
  useEffect(() => {
    if (currentPage > totalFilteredPages) {
      setCurrentPage(totalFilteredPages);
    }
  }, [totalFilteredPages, currentPage]);
  
  const currentItems = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Ensure data is an array
      const usersArray = Array.isArray(data) ? data : (data.data || data.users || []);
      console.log('API response:', data);
      console.log('Processed users array:', usersArray);
      
      setUsers(usersArray);
      setTotalPages(Math.max(1, Math.ceil(usersArray.length / itemsPerPage)));
    } catch (err) {
      setError(`Failed to fetch users: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleManageUser = (user: User) => {
    setSelectedUser(user);
    setIsManageDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetEmail(user.email || "");
    setIsResetDialogOpen(true);
  };
  
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedUser?.id) return;
    setResetLoading(true);
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      alert("Password reset link sent successfully");
      setIsResetDialogOpen(false);
      
    } catch (err) {
      alert(`Failed to send reset link: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error resetting password:", err);
    } finally {
      setResetLoading(false);
    }
  };
  
  const confirmDeleteUser = async () => {
    if (!selectedUser?.id) return;
    setDeleteLoading(true);
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      alert("User deleted successfully");
      fetchUsers(); // Refresh user list
      setIsDeleteDialogOpen(false);
      
    } catch (err) {
      alert(`Failed to delete user: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error deleting user:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleProfileUpdateSuccess = () => {
    fetchUsers(); // Refresh user list
    setIsManageDialogOpen(false);
    alert("User updated successfully");
  };

  return (
    <div className="container px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">User Management</h1>
      
      {error && (
        <div className="p-4 mb-4 border border-red-500 bg-red-100 text-red-700 rounded">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          <span className="font-bold">Error:</span> {error}
        </div>
      )}
      
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-4">
        <Button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh Users
        </Button>
        
        <div className="flex-1 flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <Input
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-xs"
          />
          
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          
          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-sm text-gray-500">Items per page:</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2"
              value={itemsPerPage.toString()}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="border rounded-md">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{user.email}</td>
                  <td className="p-3">{user.full_name || "—"}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      user.role === "admin" 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {user.role || "user"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user)}
                      >
                        <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-6 6h-2 M9 17a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2M5 7v6M8 5 5 7l-3 2"></path>
                        </svg>
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="h-24 text-center">
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading users...
                    </div>
                  ) : (
                    "No users found."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalFilteredItems)} of {totalFilteredItems} users
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">First page</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m11 17-5-5 5-5M17 17l-5-5 5-5"></path>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous page</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </Button>
            
            <div className="text-sm">
              Page {currentPage} of {totalFilteredPages}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalFilteredPages, prev + 1))}
              disabled={currentPage === totalFilteredPages}
            >
              <span className="sr-only">Next page</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalFilteredPages)}
              disabled={currentPage === totalFilteredPages}
            >
              <span className="sr-only">Last page</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m13 17 5-5-5-5M7 17l5-5-5-5"></path>
              </svg>
            </Button>
          </div>
        </div>
      )}
      
      {/* Manage User Dialog */}
      {selectedUser && isManageDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Manage User Profile</h3>
              <p className="text-sm text-gray-500">
                Edit user details for {selectedUser.email}
              </p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleProfileUpdateSuccess();
            }}>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={selectedUser.email || ""}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input
                    type="text"
                    defaultValue={selectedUser.full_name || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    defaultValue={selectedUser.role || "user"}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsManageDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Reset Password Dialog */}
      {selectedUser && isResetDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Reset User Password</h3>
              <p className="text-sm text-gray-500">
                This will send a password reset link to the user's email.
                Confirm the email address below:
              </p>
              <Input
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsResetDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={resetLoading || !resetEmail}
                onClick={confirmResetPassword}
              >
                {resetLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send Reset Link
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete User Dialog */}
      {selectedUser && isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Delete User</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the user {selectedUser.email}?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteLoading}
                onClick={confirmDeleteUser}
              >
                {deleteLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
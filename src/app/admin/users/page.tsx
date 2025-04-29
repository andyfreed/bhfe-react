'use client';

import { useState, useEffect, FormEvent } from 'react';
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
  first_name?: string;
  last_name?: string;
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
  
  // Pagination state - updated for server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchPending, setSearchPending] = useState(false);
  
  // Debounce search updates
  useEffect(() => {
    setSearchPending(true);
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
      // Use basic pagination without search to avoid server errors
      fetchUsers(1, itemsPerPage);
      setSearchPending(false);
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, roleFilter]);

  // When page or items per page changes, fetch with current filters
  useEffect(() => {
    if (!searchPending) {
      fetchUsers(currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage]);

  // Client-side filtering for search and role
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = debouncedSearchQuery.trim() === "" || 
      user.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
      (user.first_name?.toLowerCase() || "").includes(debouncedSearchQuery.toLowerCase()) || 
      (user.last_name?.toLowerCase() || "").includes(debouncedSearchQuery.toLowerCase());
    
    // Role filter
    const matchesRole = 
      roleFilter === "all" || 
      user.role?.toLowerCase() === roleFilter.toLowerCase();
    
    return matchesSearch && matchesRole;
  });

  const fetchUsers = async (page = 1, limit = itemsPerPage) => {
    setLoading(true);
    setError(null);
    try {
      // Use basic pagination without search/filter parameters to avoid server errors
      let url = `/api/users?page=${page}&limit=${limit}`;
      
      console.log('Fetching users with URL:', url);
      
      // Make the API request
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      console.log('API response:', data);
      
      // Use the server-provided pagination info
      const usersArray = Array.isArray(data.users) ? data.users : 
                        (Array.isArray(data) ? data : []);
      
      // Parse full_name into first_name and last_name if needed
      const processedUsers = usersArray.map((user: any) => {
        // If the user already has first_name and last_name, keep them
        if (user.first_name || user.last_name) {
          return user;
        }
        
        // If user has full_name but not first/last, split it
        if (user.full_name) {
          const nameParts = user.full_name.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ');
          
          return {
            ...user,
            first_name: firstName,
            last_name: lastName
          };
        }
        
        // No name information available
        return {
          ...user,
          first_name: '',
          last_name: ''
        };
      });
      
      console.log('Processed users array:', processedUsers);
      
      // Log the first user to examine its fields
      if (processedUsers.length > 0) {
        console.log('First user sample:', processedUsers[0]);
      }
      
      setUsers(processedUsers);
      
      // Use the pagination info from the API
      setTotalItems(data.total || processedUsers.length);
      setTotalPages(data.totalPages || Math.ceil(processedUsers.length / limit));
      
    } catch (err) {
      setError(`Failed to fetch users: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedUser.id) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const email = formData.get("email") as string;
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const role = formData.get("role") as string;
    const company = formData.get("company") as string;
    const phone = formData.get("phone") as string;
    
    // Combine first_name and last_name for API
    const full_name = `${first_name || ""} ${last_name || ""}`.trim();
    
    try {
      setLoading(true);
      
      // Send update to API
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
          full_name,
          company,
          phone
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status}`);
      }
      
      // Update local state
      const updatedUser = {
        ...selectedUser,
        email,
        first_name,
        last_name,
        role,
        company,
        phone,
      };
      
      setSelectedUser(updatedUser);
      
      // Refresh the user list to show updated data
      await fetchUsers();
      
      setIsManageDialogOpen(false);
      alert("User updated successfully");
    } catch (err) {
      alert(`Error updating user: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error updating user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle role filter change with explicit method
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  // Pagination for filtered results
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFilteredItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Calculate total pages for filtered results
  const filteredTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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
          onClick={() => fetchUsers(currentPage, itemsPerPage)}
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
          <div className="relative md:max-w-xs">
            <Input
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            {searchPending && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2"
            value={roleFilter}
            onChange={handleRoleFilterChange}
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
            {currentFilteredItems.length > 0 ? (
              currentFilteredItems.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{user.email}</td>
                  <td className="p-3">{(user.first_name || user.last_name) ? 
                    `${user.first_name || ""} ${user.last_name || ""}`.trim() : "—"}</td>
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
      
      {users.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-500">
            Showing {filteredUsers.length > 0 ? 
              `${Math.min(indexOfFirstItem + 1, filteredUsers.length)} - ${Math.min(indexOfLastItem, filteredUsers.length)} of ${filteredUsers.length}` : 
              "0 of 0"} filtered users (from {users.length} total)
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || filteredUsers.length === 0}
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
              disabled={currentPage === 1 || filteredUsers.length === 0}
            >
              <span className="sr-only">Previous page</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </Button>
            
            <div className="text-sm">
              Page {currentPage} of {filteredTotalPages || 1}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(filteredTotalPages, prev + 1))}
              disabled={currentPage === filteredTotalPages || filteredUsers.length === 0}
            >
              <span className="sr-only">Next page</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(filteredTotalPages)}
              disabled={currentPage === filteredTotalPages || filteredUsers.length === 0}
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
            
            <form onSubmit={handleUpdateUser}>
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
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <Input
                    type="text"
                    name="first_name"
                    defaultValue={selectedUser.first_name || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <Input
                    type="text"
                    name="last_name"
                    defaultValue={selectedUser.last_name || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <Input
                    type="text"
                    name="company"
                    defaultValue={selectedUser.company || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input
                    type="text"
                    name="phone"
                    defaultValue={selectedUser.phone || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    name="role"
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
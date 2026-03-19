import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Key, Mail, Phone, Shield, MoreVertical, UserCheck } from 'lucide-react';
import { Badge } from '../common/Badge';
import { UserApprovalList } from './UserApprovalList';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  department: string;
  joinDate: string;
  lastLogin: string;
  permissions: string[];
}

interface UserListProps {
  onAddNew: () => void;
  onEdit: (user: User) => void;
  onManagePermissions: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({ onAddNew, onEdit, onManagePermissions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'approvals'>('users');

  // Mock user data
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      phone: '+91 9999999001',
      role: 'Admin',
      status: 'Active',
      department: 'IT',
      joinDate: '2025-01-15',
      lastLogin: '2026-03-05',
      permissions: ['all']
    },
    {
      id: '2',
      name: 'Sarah Smith',
      email: 'sarah.smith@company.com',
      phone: '+91 9999999002',
      role: 'Sales Manager',
      status: 'Active',
      department: 'Sales',
      joinDate: '2025-02-20',
      lastLogin: '2026-03-04',
      permissions: ['sales', 'customers', 'invoices']
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      phone: '+91 9999999003',
      role: 'Operations',
      status: 'Active',
      department: 'Operations',
      joinDate: '2025-03-10',
      lastLogin: '2026-03-05',
      permissions: ['inventory', 'rentals', 'customers']
    },
    {
      id: '4',
      name: 'Emily Brown',
      email: 'emily.brown@company.com',
      phone: '+91 9999999004',
      role: 'Sales Executive',
      status: 'Active',
      department: 'Sales',
      joinDate: '2025-04-05',
      lastLogin: '2026-03-03',
      permissions: ['sales', 'customers']
    },
    {
      id: '5',
      name: 'David Wilson',
      email: 'david.wilson@company.com',
      phone: '+91 9999999005',
      role: 'Inventory Manager',
      status: 'Active',
      department: 'Operations',
      joinDate: '2025-05-12',
      lastLogin: '2026-03-05',
      permissions: ['inventory', 'reports']
    },
    {
      id: '6',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@company.com',
      phone: '+91 9999999006',
      role: 'Accountant',
      status: 'Active',
      department: 'Finance',
      joinDate: '2025-06-18',
      lastLogin: '2026-03-04',
      permissions: ['invoices', 'reports']
    },
    {
      id: '7',
      name: 'Robert Taylor',
      email: 'robert.taylor@company.com',
      phone: '+91 9999999007',
      role: 'Support',
      status: 'Inactive',
      department: 'Support',
      joinDate: '2025-07-22',
      lastLogin: '2026-02-28',
      permissions: ['customers']
    },
    {
      id: '8',
      name: 'Jennifer Davis',
      email: 'jennifer.davis@company.com',
      phone: '+91 9999999008',
      role: 'Sales Executive',
      status: 'Suspended',
      department: 'Sales',
      joinDate: '2025-08-30',
      lastLogin: '2026-02-15',
      permissions: ['sales']
    }
  ];

  // Filter users
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get unique roles
  const roles = Array.from(new Set(mockUsers.map(user => user.role)));

  // Calculate stats
  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter(u => u.status === 'Active').length;
  const inactiveUsers = filteredUsers.filter(u => u.status === 'Inactive').length;
  const suspendedUsers = filteredUsers.filter(u => u.status === 'Suspended').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'neutral';
      case 'Suspended':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'Admin') return 'error';
    if (role.includes('Manager')) return 'primary';
    return 'neutral';
  };

  const handleDelete = (user: User) => {
    if (confirm(`Are you sure you want to delete user: ${user.name}?`)) {
      alert('User deleted successfully!');
    }
  };

  const handleResetPassword = (user: User) => {
    if (confirm(`Send password reset email to ${user.email}?`)) {
      alert('Password reset email sent!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">User Management</h1>
          <p className="text-neutral-600">Manage system users and their access</p>
        </div>
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">Total Users</span>
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalUsers}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">Active Users</span>
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">Inactive Users</span>
            <Shield className="w-5 h-5 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-600">{inactiveUsers}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">Suspended</span>
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{suspendedUsers}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200">
          <nav className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Active Users
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors relative ${
                activeTab === 'approvals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Pending Approvals
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                3
              </span>
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'users' ? (
            <>
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="all">All Roles</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-700 font-medium text-sm">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-neutral-900">{user.name}</div>
                              <div className="text-xs text-neutral-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                              <Mail className="w-3.5 h-3.5" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                              <Phone className="w-3.5 h-3.5" />
                              {user.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getRoleBadgeColor(user.role) as any}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {user.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusColor(user.status) as any}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {new Date(user.lastLogin).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onEdit(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onManagePermissions(user)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Manage Permissions"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-neutral-600">
                  Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
                  <span className="font-medium">{mockUsers.length}</span> users
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border border-neutral-200 rounded hover:bg-neutral-50 text-sm">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
                  <button className="px-3 py-1 border border-neutral-200 rounded hover:bg-neutral-50 text-sm">
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <UserApprovalList
              onApprove={(user) => {
                alert(`Approved user: ${user.name}`);
              }}
              onReject={(user) => {
                if (confirm(`Are you sure you want to reject ${user.name}'s request?`)) {
                  alert('User request rejected');
                }
              }}
              onViewDetails={(user) => {
                alert(`Viewing request details for: ${user.name}`);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
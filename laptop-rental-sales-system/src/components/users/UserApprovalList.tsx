import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, Eye, UserCheck } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  requestedRole: string;
  department: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  companyName?: string;
  message?: string;
}

interface UserApprovalListProps {
  onApprove: (user: PendingUser) => void;
  onReject: (user: PendingUser) => void;
  onViewDetails: (user: PendingUser) => void;
}

export function UserApprovalList({ onApprove, onReject, onViewDetails }: UserApprovalListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');

  // Mock pending user requests
  const pendingUsers: PendingUser[] = [
    {
      id: 'PR-001',
      name: 'Alex Thompson',
      email: 'alex.thompson@techcorp.com',
      phone: '+91 9876543210',
      requestedRole: 'Sales Executive',
      department: 'Sales',
      requestDate: '2026-03-05',
      status: 'Pending',
      companyName: 'TechCorp Solutions',
      message: 'I would like to join the sales team to manage B2B client relationships.'
    },
    {
      id: 'PR-002',
      name: 'Maria Garcia',
      email: 'maria.garcia@innovate.com',
      phone: '+91 9876543211',
      requestedRole: 'Operations',
      department: 'Operations',
      requestDate: '2026-03-04',
      status: 'Pending',
      message: 'Experienced in inventory management and operations.'
    },
    {
      id: 'PR-003',
      name: 'James Wilson',
      email: 'james.wilson@company.com',
      phone: '+91 9876543212',
      requestedRole: 'Accountant',
      department: 'Finance',
      requestDate: '2026-03-03',
      status: 'Pending',
      message: 'CPA certified, 5 years experience in financial reporting.'
    },
    {
      id: 'PR-004',
      name: 'Sophie Chen',
      email: 'sophie.chen@startup.com',
      phone: '+91 9876543213',
      requestedRole: 'Inventory Manager',
      department: 'Operations',
      requestDate: '2026-03-02',
      status: 'Approved',
      message: 'Looking to manage laptop inventory and procurement.'
    },
    {
      id: 'PR-005',
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+91 9876543214',
      requestedRole: 'Support',
      department: 'Support',
      requestDate: '2026-03-01',
      status: 'Rejected',
      message: 'Customer support specialist with 3 years experience.'
    }
  ];

  const filteredUsers = pendingUsers.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.requestedRole.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PendingUser['status']) => {
    const variants: Record<PendingUser['status'], any> = {
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'danger'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Calculate stats
  const pendingCount = pendingUsers.filter(u => u.status === 'Pending').length;
  const approvedCount = pendingUsers.filter(u => u.status === 'Approved').length;
  const rejectedCount = pendingUsers.filter(u => u.status === 'Rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">User Approval Requests</h1>
          <p className="text-neutral-600">{pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
              <p className="text-sm text-neutral-600">Pending Approval</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{approvedCount}</p>
              <p className="text-sm text-neutral-600">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{rejectedCount}</p>
              <p className="text-sm text-neutral-600">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  User Details
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Requested Role
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Request Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <code className="text-sm bg-neutral-100 px-2 py-1 rounded font-medium">
                      {user.id}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-neutral-900">{user.name}</p>
                      <p className="text-sm text-neutral-600">{user.email}</p>
                      <p className="text-sm text-neutral-500">{user.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{user.requestedRole}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-900">{user.department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-900">{formatDate(user.requestDate)}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.status === 'Pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => onApprove(user)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => onReject(user)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => onViewDetails(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">No approval requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}

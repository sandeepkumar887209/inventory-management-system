import React, { useState } from 'react';
import { Plus, Search, TestTube2, User, Laptop, ChevronLeft, ChevronRight, Eye, Calendar } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface Demo {
  id: string;
  customer: string;
  customerType: 'Individual' | 'Corporate';
  laptop: string;
  assignedDate: string;
  returnDueDate: string;
  actualReturnDate?: string;
  status: 'Active' | 'Returned' | 'Converted to Rental' | 'Converted to Sale' | 'Overdue';
  notes?: string;
  feedbackReceived?: boolean;
  conversionType?: 'rental' | 'sale';
  daysLeft?: number;
}

interface DemoListProps {
  onCreateNew: () => void;
  onViewDetails: (demo: Demo) => void;
}

export function DemoList({ onCreateNew, onViewDetails }: DemoListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data
  const demos: Demo[] = [
    {
      id: 'D-001',
      customer: 'Sarah Johnson',
      customerType: 'Individual',
      laptop: 'Dell XPS 15 (DXP15-2024-001)',
      assignedDate: '2026-03-01',
      returnDueDate: '2026-03-08',
      status: 'Active',
      daysLeft: 2,
      notes: 'Interested in video editing capabilities',
      feedbackReceived: false
    },
    {
      id: 'D-002',
      customer: 'TechStart Solutions',
      customerType: 'Corporate',
      laptop: 'MacBook Pro 14" (MBP14-2024-002)',
      assignedDate: '2026-02-25',
      returnDueDate: '2026-03-04',
      actualReturnDate: '2026-03-04',
      status: 'Converted to Rental',
      notes: 'Testing for development team',
      feedbackReceived: true,
      conversionType: 'rental'
    },
    {
      id: 'D-003',
      customer: 'Michael Chen',
      customerType: 'Individual',
      laptop: 'HP EliteBook 840 (HPE840-2024-003)',
      assignedDate: '2026-02-28',
      returnDueDate: '2026-03-07',
      status: 'Active',
      daysLeft: 1,
      notes: 'Evaluating for college work',
      feedbackReceived: false
    },
    {
      id: 'D-004',
      customer: 'Design Pro Studio',
      customerType: 'Corporate',
      laptop: 'MacBook Pro 16" (MBP16-2024-010)',
      assignedDate: '2026-02-20',
      returnDueDate: '2026-02-27',
      actualReturnDate: '2026-02-28',
      status: 'Returned',
      notes: 'Testing for graphic design team',
      feedbackReceived: true
    },
    {
      id: 'D-005',
      customer: 'Alex Thompson',
      customerType: 'Individual',
      laptop: 'Lenovo ThinkPad X1 (LTX1C-2024-004)',
      assignedDate: '2026-02-18',
      returnDueDate: '2026-02-25',
      actualReturnDate: '2026-02-26',
      status: 'Converted to Sale',
      notes: 'Very satisfied with performance',
      feedbackReceived: true,
      conversionType: 'sale'
    },
    {
      id: 'D-006',
      customer: 'Emma Wilson',
      customerType: 'Individual',
      laptop: 'Dell Inspiron 15 (DIN15-2024-009)',
      assignedDate: '2026-02-22',
      returnDueDate: '2026-03-01',
      status: 'Overdue',
      daysLeft: -5,
      notes: 'Student evaluation for programming',
      feedbackReceived: false
    },
    {
      id: 'D-007',
      customer: 'Innovation Labs',
      customerType: 'Corporate',
      laptop: 'HP ProBook 450 (HPP450-2024-007)',
      assignedDate: '2026-03-02',
      returnDueDate: '2026-03-09',
      status: 'Active',
      daysLeft: 3,
      notes: 'Testing for engineering team',
      feedbackReceived: false
    },
    {
      id: 'D-008',
      customer: 'David Martinez',
      customerType: 'Individual',
      laptop: 'Lenovo ThinkBook 14 (LTB14-2024-008)',
      assignedDate: '2026-02-15',
      returnDueDate: '2026-02-22',
      actualReturnDate: '2026-02-22',
      status: 'Returned',
      notes: 'Evaluated for business use',
      feedbackReceived: true
    }
  ];

  const filteredDemos = demos.filter(demo => {
    const matchesSearch = 
      demo.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demo.laptop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demo.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || demo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDemos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDemos = filteredDemos.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: Demo['status']) => {
    const variants: Record<Demo['status'], 'success' | 'warning' | 'danger' | any> = {
      'Active': 'success',
      'Returned': 'info',
      'Converted to Rental': 'success',
      'Converted to Sale': 'success',
      'Overdue': 'danger'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Calculate stats
  const activeDemos = demos.filter(d => d.status === 'Active').length;
  const overdueDemos = demos.filter(d => d.status === 'Overdue').length;
  const convertedToRental = demos.filter(d => d.status === 'Converted to Rental').length;
  const convertedToSale = demos.filter(d => d.status === 'Converted to Sale').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Demo Management</h1>
          <p className="text-neutral-600">{filteredDemos.length} demo assignments</p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Demo Assignment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TestTube2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{activeDemos}</p>
              <p className="text-sm text-neutral-600">Active Demos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{overdueDemos}</p>
              <p className="text-sm text-neutral-600">Overdue</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{convertedToRental}</p>
              <p className="text-sm text-neutral-600">→ Rentals</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{convertedToSale}</p>
              <p className="text-sm text-neutral-600">→ Sales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by customer, laptop, or demo ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Overdue">Overdue</option>
              <option value="Returned">Returned</option>
              <option value="Converted to Rental">Converted to Rental</option>
              <option value="Converted to Sale">Converted to Sale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Demo ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Laptop
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Demo Period
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Feedback
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedDemos.map((demo) => (
                <tr key={demo.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <code className="text-sm bg-neutral-100 px-2 py-1 rounded font-medium">
                      {demo.id}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-neutral-900">{demo.customer}</p>
                      <p className="text-sm text-neutral-600">{demo.customerType}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-900">{demo.laptop}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-neutral-900">{formatDate(demo.assignedDate)}</div>
                      <div className="text-neutral-600">to {formatDate(demo.returnDueDate)}</div>
                      {demo.daysLeft !== undefined && (demo.status === 'Active' || demo.status === 'Overdue') && (
                        <div className={`mt-1 ${demo.daysLeft < 0 ? 'text-red-600' : 'text-neutral-500'}`}>
                          {demo.daysLeft > 0 ? `${demo.daysLeft} days left` : 
                           demo.daysLeft < 0 ? `${Math.abs(demo.daysLeft)} days overdue` : 
                           'Due today'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(demo.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${demo.feedbackReceived ? 'text-green-600' : 'text-neutral-400'}`}>
                      {demo.feedbackReceived ? '✓ Received' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => onViewDetails(demo)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDemos.length)} of {filteredDemos.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <span className="text-sm text-neutral-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

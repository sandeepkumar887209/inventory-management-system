import React, { useState } from 'react';
import { Plus, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface Sale {
  id: string;
  customer: string;
  customerType: 'Individual' | 'Corporate';
  laptop: string;
  saleDate: string;
  salePrice: number;
  discount: number;
  gst: number;
  finalAmount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  paymentMethod: string;
}

interface SalesListProps {
  onCreateNew: () => void;
  onViewInvoice: (sale: Sale) => void;
}

export function SalesList({ onCreateNew, onViewInvoice }: SalesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data
  const sales: Sale[] = [
    {
      id: 'S-001',
      customer: 'Jane Doe',
      customerType: 'Individual',
      laptop: 'MacBook Air M2 (MBA-M2-2024-006)',
      saleDate: '2026-01-25',
      salePrice: 98000,
      discount: 5000,
      gst: 16740,
      finalAmount: 109740,
      paymentStatus: 'Paid',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 'S-002',
      customer: 'Tech Solutions Ltd',
      customerType: 'Corporate',
      laptop: 'Dell Latitude 5430 (DLT5430-2024-015)',
      saleDate: '2026-02-01',
      salePrice: 58000,
      discount: 3000,
      gst: 9900,
      finalAmount: 64900,
      paymentStatus: 'Paid',
      paymentMethod: 'Cheque'
    },
    {
      id: 'S-003',
      customer: 'Robert Wilson',
      customerType: 'Individual',
      laptop: 'HP ProBook 450 G9 (HPP450-2024-018)',
      saleDate: '2026-02-05',
      salePrice: 68000,
      discount: 2000,
      gst: 11880,
      finalAmount: 77880,
      paymentStatus: 'Pending',
      paymentMethod: 'UPI'
    },
    {
      id: 'S-004',
      customer: 'Startup Accelerator',
      customerType: 'Corporate',
      laptop: 'Lenovo ThinkPad X1 Carbon (LTX1C-2024-025)',
      saleDate: '2026-02-07',
      salePrice: 125000,
      discount: 10000,
      gst: 20700,
      finalAmount: 135700,
      paymentStatus: 'Partial',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 'S-005',
      customer: 'Emily Chen',
      customerType: 'Individual',
      laptop: 'Dell Inspiron 15 (DIN15-2024-030)',
      saleDate: '2026-02-08',
      salePrice: 45000,
      discount: 0,
      gst: 8100,
      finalAmount: 53100,
      paymentStatus: 'Paid',
      paymentMethod: 'Cash'
    }
  ];

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.laptop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sale.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: Sale['paymentStatus']) => {
    const variants: Record<Sale['paymentStatus'], 'success' | 'warning' | 'danger'> = {
      'Paid': 'success',
      'Partial': 'warning',
      'Pending': 'danger'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalAmount, 0);
  const paidAmount = sales.filter(s => s.paymentStatus === 'Paid').reduce((sum, sale) => sum + sale.finalAmount, 0);
  const pendingAmount = sales.filter(s => s.paymentStatus !== 'Paid').reduce((sum, sale) => sum + sale.finalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Sales Management</h1>
          <p className="text-neutral-600">{filteredSales.length} sales transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => {}}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-600">Total Revenue</p>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
          <p className="text-3xl font-bold text-neutral-900">₹{(totalRevenue / 100000).toFixed(2)}L</p>
          <p className="text-sm text-neutral-500 mt-1">{sales.length} transactions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-600">Paid Amount</p>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-3xl font-bold text-neutral-900">₹{(paidAmount / 100000).toFixed(2)}L</p>
          <p className="text-sm text-green-600 mt-1">
            {sales.filter(s => s.paymentStatus === 'Paid').length} completed
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-600">Pending Amount</p>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          <p className="text-3xl font-bold text-neutral-900">₹{(pendingAmount / 100000).toFixed(2)}L</p>
          <p className="text-sm text-red-600 mt-1">
            {sales.filter(s => s.paymentStatus !== 'Paid').length} pending
          </p>
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
                placeholder="Search by customer, laptop, or sale ID..."
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
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
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
                  Sale ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Laptop
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Sale Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <code className="text-sm bg-neutral-100 px-2 py-1 rounded font-medium">
                      {sale.id}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-neutral-900">{sale.customer}</p>
                      <p className="text-sm text-neutral-600">{sale.customerType}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-900">{sale.laptop}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-900">{formatDate(sale.saleDate)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-neutral-900">₹{sale.finalAmount.toLocaleString()}</p>
                      {sale.discount > 0 && (
                        <p className="text-neutral-600">Discount: ₹{sale.discount.toLocaleString()}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(sale.paymentStatus)}
                  </td>
                  <td className="px-6 py-4">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => onViewInvoice(sale)}
                    >
                      View Invoice
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSales.length)} of {filteredSales.length} results
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

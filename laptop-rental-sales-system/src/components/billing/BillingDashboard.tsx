import React, { useState } from 'react';
import { DollarSign, CreditCard, AlertCircle, CheckCircle, Clock, TrendingUp, FileText, Download, Send, Eye } from 'lucide-react';
import { Badge } from '../common/Badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Payment {
  id: string;
  invoiceId: string;
  customer: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  paymentMethod?: string;
  description: string;
}

export function BillingDashboard() {
  const [viewMode, setViewMode] = useState<'overview' | 'payments' | 'outstanding'>('overview');

  // Mock payment data
  const payments: Payment[] = [
    {
      id: 'PAY-001',
      invoiceId: 'INV-2024-001',
      customer: 'TechCorp Solutions',
      amount: 145000,
      dueDate: '2026-03-10',
      paidDate: '2026-03-08',
      status: 'Paid',
      paymentMethod: 'Bank Transfer',
      description: 'Monthly rental payment - 10 laptops'
    },
    {
      id: 'PAY-002',
      invoiceId: 'INV-2024-002',
      customer: 'Startup Hub',
      amount: 89000,
      dueDate: '2026-03-12',
      status: 'Pending',
      description: 'MacBook Pro rental - 3 months'
    },
    {
      id: 'PAY-003',
      invoiceId: 'INV-2024-003',
      customer: 'Design Studio',
      amount: 125000,
      dueDate: '2026-03-05',
      status: 'Overdue',
      description: 'Laptop purchase - Dell XPS 15'
    },
    {
      id: 'PAY-004',
      invoiceId: 'INV-2024-004',
      customer: 'EduTech Solutions',
      amount: 210000,
      dueDate: '2026-03-15',
      paidDate: '2026-03-14',
      status: 'Paid',
      paymentMethod: 'UPI',
      description: 'Bulk laptop order - 15 units'
    },
    {
      id: 'PAY-005',
      invoiceId: 'INV-2024-005',
      customer: 'Marketing Hub',
      amount: 65000,
      dueDate: '2026-03-08',
      status: 'Partial',
      description: 'Rental extension - 5 laptops'
    },
    {
      id: 'PAY-006',
      invoiceId: 'INV-2024-006',
      customer: 'Finance Corp',
      amount: 180000,
      dueDate: '2026-03-20',
      status: 'Pending',
      description: 'Corporate rental - ThinkPad series'
    }
  ];

  // Calculate stats
  const totalRevenue = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = payments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0);
  const partialAmount = payments.filter(p => p.status === 'Partial').reduce((sum, p) => sum + p.amount, 0);
  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const overdueCount = payments.filter(p => p.status === 'Overdue').length;

  // Chart data
  const monthlyRevenue = [
    { month: 'Jan', revenue: 420000, target: 400000 },
    { month: 'Feb', revenue: 385000, target: 400000 },
    { month: 'Mar', revenue: 634000, target: 500000 },
    { month: 'Apr', revenue: 0, target: 500000 },
    { month: 'May', revenue: 0, target: 500000 },
    { month: 'Jun', revenue: 0, target: 500000 }
  ];

  const paymentStatus = [
    { name: 'Paid', value: paidCount, color: '#10b981' },
    { name: 'Pending', value: payments.filter(p => p.status === 'Pending').length, color: '#f59e0b' },
    { name: 'Overdue', value: overdueCount, color: '#ef4444' },
    { name: 'Partial', value: payments.filter(p => p.status === 'Partial').length, color: '#3b82f6' }
  ];

  const getStatusBadge = (status: Payment['status']) => {
    const variants: Record<Payment['status'], any> = {
      'Paid': 'success',
      'Pending': 'warning',
      'Overdue': 'danger',
      'Partial': 'info'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Billing & Payments</h1>
          <p className="text-neutral-600">Manage payments, track revenue, and monitor outstanding balances</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-neutral-600">Total Received</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(pendingAmount)}</p>
              <p className="text-sm text-neutral-600">Pending Payment</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(overdueAmount)}</p>
              <p className="text-sm text-neutral-600">Overdue Amount</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(partialAmount)}</p>
              <p className="text-sm text-neutral-600">Partial Payment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Revenue Tracking</h3>
            <p className="text-sm text-neutral-600">Monthly revenue vs target</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} name="Actual Revenue" />
              <Bar dataKey="target" fill="#94a3b8" radius={[8, 8, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Payment Status</h3>
            <p className="text-sm text-neutral-600">Distribution by status</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={paymentStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {paymentStatus.map((status) => (
              <div key={status.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-xs text-neutral-600">{status.name}: {status.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200">
          <nav className="flex gap-4 px-6">
            <button
              onClick={() => setViewMode('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Payments
            </button>
            <button
              onClick={() => setViewMode('outstanding')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'outstanding'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Outstanding
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                {overdueCount}
              </span>
            </button>
            <button
              onClick={() => setViewMode('payments')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'payments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Received
            </button>
          </nav>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Payment ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Due Date
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
              {payments
                .filter(p => {
                  if (viewMode === 'outstanding') return p.status === 'Overdue' || p.status === 'Pending';
                  if (viewMode === 'payments') return p.status === 'Paid';
                  return true;
                })
                .map((payment) => {
                  const daysUntil = getDaysUntilDue(payment.dueDate);
                  return (
                    <tr key={payment.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <code className="text-sm font-medium text-neutral-900">{payment.id}</code>
                          <span className="text-xs text-neutral-500">{payment.invoiceId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-900">{payment.customer}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-600">{payment.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-neutral-900">{formatCurrency(payment.amount)}</p>
                        {payment.paymentMethod && (
                          <p className="text-xs text-neutral-500">{payment.paymentMethod}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-900">{formatDate(payment.dueDate)}</p>
                        {payment.status === 'Overdue' && (
                          <p className="text-xs text-red-600 font-medium">
                            {Math.abs(daysUntil)} days overdue
                          </p>
                        )}
                        {payment.status === 'Pending' && daysUntil > 0 && (
                          <p className="text-xs text-orange-600">
                            Due in {daysUntil} days
                          </p>
                        )}
                        {payment.paidDate && (
                          <p className="text-xs text-green-600">
                            Paid: {formatDate(payment.paidDate)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {payment.status !== 'Paid' && (
                            <button
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Send Reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

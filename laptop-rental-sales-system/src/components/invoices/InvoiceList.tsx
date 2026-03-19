import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Eye, Printer, Plus, FileText, Calendar, Mail, RefreshCw } from 'lucide-react';
import { Badge } from '../common/Badge';
import {
  getInvoices,
  getInvoiceSummary,
  downloadInvoicePDF,
  sendInvoiceEmail,
  updateInvoiceStatus,
} from '../../services/invoice';

interface Invoice {
  id: number;
  invoice_number: string;
  created_at: string;
  customer_detail: { id: number; name: string; email?: string; phone?: string };
  invoice_type: 'SALE' | 'RENTAL' | 'CUSTOM';
  items_detail: any[];
  subtotal: number;
  gst: number;
  gst_amount: number;
  total_amount: number;
  status: 'UNPAID' | 'PAID' | 'PARTIAL' | 'CANCELLED';
  notes?: string;
}

interface Summary {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

interface InvoiceListProps {
  onCreateNew: () => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onCreateNew, onViewInvoice }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_invoices: 0, total_amount: 0, paid_amount: 0, pending_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Email modal state
  const [emailModal, setEmailModal] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (dateRange !== 'all') params.date_range = dateRange;
    return params;
  }, [searchQuery, statusFilter, typeFilter, dateRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const [invRes, sumRes] = await Promise.all([
        getInvoices(params),
        getInvoiceSummary(params),
      ]);
      setInvoices(invRes.data?.results ?? invRes.data ?? []);
      setSummary(sumRes.data);
    } catch (err) {
      showToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  const handleDownloadPDF = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      await downloadInvoicePDF(invoice.id, invoice.invoice_number);
      showToast(`PDF downloaded for ${invoice.invoice_number}`);
    } catch {
      showToast('PDF download failed. Is WeasyPrint installed?', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEmailModal = (invoice: Invoice) => {
    setEmailAddress(invoice.customer_detail?.email || '');
    setEmailModal({ open: true, invoice });
  };

  const handleSendEmail = async () => {
    if (!emailModal.invoice) return;
    setEmailSending(true);
    try {
      await sendInvoiceEmail(emailModal.invoice.id, emailAddress || undefined);
      showToast(`Invoice sent to ${emailAddress}`);
      setEmailModal({ open: false, invoice: null });
    } catch {
      showToast('Failed to send email', 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    setActionLoading(invoice.id);
    try {
      await updateInvoiceStatus(invoice.id, newStatus);
      showToast(`Status updated to ${newStatus}`);
      fetchData();
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'UNPAID': return 'warning';
      case 'PARTIAL': return 'primary';
      case 'CANCELLED': return 'neutral';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { PAID: 'Paid', UNPAID: 'Unpaid', PARTIAL: 'Partial', CANCELLED: 'Cancelled' };
    return map[status] || status;
  };

  const getTypeVariant = (type: string) => type === 'RENTAL' ? 'primary' : type === 'SALE' ? 'success' : 'neutral';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Email Modal */}
      {emailModal.open && emailModal.invoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-neutral-900">Send Invoice by Email</h3>
            <p className="text-sm text-neutral-600">
              Invoice <strong>{emailModal.invoice.invoice_number}</strong> will be sent as a PDF attachment.
            </p>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Recipient Email</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSendEmail}
                disabled={emailSending || !emailAddress}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
              <button
                onClick={() => setEmailModal({ open: false, invoice: null })}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Invoices & Payments</h1>
          <p className="text-neutral-600">Manage rental and sales invoices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: summary.total_invoices, prefix: '', icon: <FileText className="w-5 h-5 text-blue-600" />, color: 'text-neutral-900' },
          { label: 'Total Amount', value: summary.total_amount.toLocaleString('en-IN'), prefix: '₹', icon: <FileText className="w-5 h-5 text-neutral-600" />, color: 'text-neutral-900' },
          { label: 'Paid Amount', value: summary.paid_amount.toLocaleString('en-IN'), prefix: '₹', icon: <FileText className="w-5 h-5 text-green-600" />, color: 'text-green-600' },
          { label: 'Pending Amount', value: summary.pending_amount.toLocaleString('en-IN'), prefix: '₹', icon: <FileText className="w-5 h-5 text-orange-600" />, color: 'text-orange-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-600 text-sm">{card.label}</span>
              {card.icon}
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.prefix}{card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search invoice / customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
              <option value="all">All Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
              <option value="all">All Types</option>
              <option value="RENTAL">Rental</option>
              <option value="SALE">Sale</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
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
                {['Invoice No.', 'Date', 'Customer', 'Type', 'Items', 'Total', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
                    No invoices found
                  </td>
                </tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-neutral-900">{invoice.invoice_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {new Date(invoice.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900">{invoice.customer_detail?.name}</div>
                    {invoice.customer_detail?.phone && (
                      <div className="text-xs text-neutral-500">{invoice.customer_detail.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getTypeVariant(invoice.invoice_type) as any}>
                      {invoice.invoice_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {invoice.items_detail?.length ?? 0} item{(invoice.items_detail?.length ?? 0) !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">₹{Number(invoice.total_amount).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-neutral-500">GST: ₹{Number(invoice.gst_amount).toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Badge variant={getStatusVariant(invoice.status) as any}>
                        {getStatusLabel(invoice.status)}
                      </Badge>
                      {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
                        <select
                          onChange={(e) => e.target.value && handleStatusChange(invoice, e.target.value)}
                          value=""
                          disabled={actionLoading === invoice.id}
                          className="text-xs border border-neutral-200 rounded px-1 py-0.5 bg-white text-neutral-600 ml-1"
                        >
                          <option value="">Change</option>
                          {invoice.status !== 'PAID' && <option value="PAID">→ Paid</option>}
                          {invoice.status !== 'PARTIAL' && <option value="PARTIAL">→ Partial</option>}
                          {invoice.status !== 'UNPAID' && <option value="UNPAID">→ Unpaid</option>}
                          <option value="CANCELLED">→ Cancel</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onViewInvoice(invoice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { onViewInvoice(invoice); setTimeout(() => window.print(), 300); }}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors" title="Print">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownloadPDF(invoice)}
                        disabled={actionLoading === invoice.id}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50" title="Download PDF">
                        <Download className={`w-4 h-4 ${actionLoading === invoice.id ? 'animate-bounce' : ''}`} />
                      </button>
                      <button onClick={() => handleOpenEmailModal(invoice)}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors" title="Email Invoice">
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && invoices.length > 0 && (
          <div className="px-6 py-4 border-t border-neutral-200 text-sm text-neutral-600">
            Showing <span className="font-medium">{invoices.length}</span> invoice{invoices.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
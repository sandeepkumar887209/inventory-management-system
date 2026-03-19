import React from 'react';
import { Check, X, Clock, Ban } from 'lucide-react';

interface InvoiceActionsProps {
  invoice: any;
  onStatusChange: (newStatus: string) => void;
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({ invoice, onStatusChange }) => {
  const handleMarkAsPaid = () => {
    if (confirm('Mark this invoice as paid?')) {
      onStatusChange('Paid');
    }
  };

  const handleMarkAsPending = () => {
    if (confirm('Mark this invoice as pending?')) {
      onStatusChange('Pending');
    }
  };

  const handleMarkAsOverdue = () => {
    if (confirm('Mark this invoice as overdue?')) {
      onStatusChange('Overdue');
    }
  };

  const handleCancel = () => {
    if (confirm('Cancel this invoice? This action cannot be undone.')) {
      onStatusChange('Cancelled');
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {invoice.status !== 'Paid' && (
        <button
          onClick={handleMarkAsPaid}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
        >
          <Check className="w-4 h-4" />
          Mark as Paid
        </button>
      )}
      
      {invoice.status !== 'Pending' && invoice.status !== 'Cancelled' && (
        <button
          onClick={handleMarkAsPending}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors text-sm font-medium"
        >
          <Clock className="w-4 h-4" />
          Mark as Pending
        </button>
      )}
      
      {invoice.status !== 'Overdue' && invoice.status !== 'Cancelled' && (
        <button
          onClick={handleMarkAsOverdue}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Mark as Overdue
        </button>
      )}
      
      {invoice.status !== 'Cancelled' && (
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors text-sm font-medium"
        >
          <Ban className="w-4 h-4" />
          Cancel Invoice
        </button>
      )}
    </div>
  );
};

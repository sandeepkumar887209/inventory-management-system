import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { createInvoice } from '../../services/invoice';
import api from '../../services/axios';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  laptop_id?: number | null;
}

interface CreateInvoiceProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateInvoice: React.FC<CreateInvoiceProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    invoice_type: 'SALE',
    customer: '',
    gst: 18,
    notes: 'No Return & No Refund',
    status: 'UNPAID',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, price: 0, laptop_id: null }
  ]);

  const [customers, setCustomers] = useState<{ id: number; name: string; phone?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/customers/customers/').then((res) => {
      setCustomers(res.data?.results ?? res.data ?? []);
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number | null) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, price: 0, laptop_id: null }]);

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const gstAmount = subtotal * (Number(formData.gst) / 100);
  const total = subtotal + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customer) { setError('Please select a customer.'); return; }
    const validItems = items.filter((i) => i.description.trim() && i.price > 0);
    if (validItems.length === 0) { setError('Please add at least one valid item.'); return; }

    setSubmitting(true);
    try {
      await createInvoice({
        ...formData,
        customer: Number(formData.customer),
        gst: Number(formData.gst),
        items: validItems.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          price: i.price,
          ...(i.laptop_id ? { laptop_id: i.laptop_id } : {}),
        })),
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900">Create New Invoice</h2>
        <button type="button" onClick={onCancel}
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Type & GST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Invoice Type *</label>
          <select name="invoice_type" value={formData.invoice_type} onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="SALE">Sale</option>
            <option value="RENTAL">Rental</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">GST % *</label>
          <select name="gst" value={formData.gst} onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value={0}>0% (Exempt)</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={18}>18%</option>
            <option value={28}>28%</option>
          </select>
        </div>
      </div>

      {/* Customer */}
      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-4">
        <h3 className="font-medium text-neutral-900">Customer</h3>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Select Customer *</label>
          <select name="customer" value={formData.customer} onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="">-- Select a customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-neutral-900">Invoice Items</h3>
          <button type="button" onClick={addItem}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description *</label>
                <input type="text" value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="e.g., Dell Latitude 3410"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Laptop ID (optional)</label>
                <input type="number" value={item.laptop_id || ''}
                  onChange={(e) => handleItemChange(index, 'laptop_id', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Laptop ID from inventory"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Qty *</label>
                <input type="number" min="1" value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Rate (₹) *</label>
                <input type="number" min="0" step="0.01" value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Amount (₹)</label>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={(item.quantity * item.price).toFixed(2)}
                    className="w-full px-3 py-2 border border-neutral-200 bg-neutral-100 rounded-lg text-sm text-neutral-700" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 space-y-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Subtotal:</span>
            <span className="font-medium text-neutral-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">GST ({formData.gst}%):</span>
            <span className="font-medium text-neutral-900">₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="pt-3 border-t border-neutral-300 flex justify-between">
            <span className="font-bold text-neutral-900">Total:</span>
            <span className="font-bold text-neutral-900 text-lg">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Terms & Notes</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-200">
        <button type="submit" disabled={submitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
          {submitting ? 'Creating...' : 'Create Invoice'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
};
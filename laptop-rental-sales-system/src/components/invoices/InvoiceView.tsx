import React, { useState } from 'react';
import { X, Printer, Download, Mail } from 'lucide-react';
import { downloadInvoicePDF, sendInvoiceEmail } from '../../services/invoice';

interface InvoiceItem {
  id: number;
  description: string;
  laptop?: { brand?: string; model?: string; serial_number?: string };
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceViewProps {
  invoice: {
    id: number;
    invoice_number: string;
    created_at: string;
    invoice_type: string;
    status: string;
    subtotal: number;
    gst: number;
    gst_amount: number;
    total_amount: number;
    notes?: string;
    customer_detail: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      identifiers?: { gstin?: string; pan?: string };
    };
    items_detail: InvoiceItem[];
  };
  onClose: () => void;
}

const COMPANY = {
  name: 'Ditel Network Solutions',
  address: '7th Floor, Tower B, Spaze ITech Park, Sohna Road, Opp. H Block Palam Vihar, Gurgaon, Haryana, 122017',
  mobile: '9289920121',
  gstin: '06AADCM9351E1ZN',
  email: 'accounts@ditel.co.in',
  pan: 'BYASPM953E',
  accountNo: '729003998115183',
  ifsc: 'AIRP0000293',
  bank: 'AU Small Finance Bank PALAM VIHAR',
  upi: 'ditelnetworksolutions2940@aubank',
};

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState(invoice.customer_detail?.email || '');
  const [emailSending, setEmailSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePDF(invoice.id, invoice.invoice_number);
      showToast('PDF downloaded successfully');
    } catch {
      showToast('PDF download failed. WeasyPrint may not be installed on the server.', false);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    setEmailSending(true);
    try {
      await sendInvoiceEmail(invoice.id, emailAddress || undefined);
      showToast(`Invoice sent to ${emailAddress}`);
      setEmailModal(false);
    } catch {
      showToast('Failed to send email', false);
    } finally {
      setEmailSending(false);
    }
  };

  const subtotal = Number(invoice.subtotal);
  const gstAmount = Number(invoice.gst_amount);
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const total = Number(invoice.total_amount);
  const customer = invoice.customer_detail;

  const statusColors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    UNPAID: 'bg-orange-100 text-orange-700',
    PARTIAL: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-neutral-100 text-neutral-700',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {toast.msg}
            </div>
          )}

          {/* Email Modal */}
          {emailModal && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-lg font-bold text-neutral-900">Send Invoice by Email</h3>
                <p className="text-sm text-neutral-600">
                  Invoice <strong>{invoice.invoice_number}</strong> will be sent as a PDF attachment.
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
                  <button onClick={handleSendEmail} disabled={emailSending || !emailAddress}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
                    {emailSending ? 'Sending...' : 'Send'}
                  </button>
                  <button onClick={() => setEmailModal(false)}
                    className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 print:hidden">
            <h2 className="text-lg font-semibold text-neutral-900">Invoice #{invoice.invoice_number}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setEmailModal(true)}
                className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" /> Email
              </button>
              <button onClick={handleDownload} disabled={downloading}
                className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50">
                <Download className="w-4 h-4" /> {downloading ? 'Generating...' : 'Download PDF'}
              </button>
              <button onClick={handlePrint}
                className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 text-sm">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8 sm:p-12 print:p-12">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-neutral-900">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-700 rounded flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-red-700">{COMPANY.name}</h1>
                  <p className="text-xs text-neutral-600">A telecom-enabled IT solutions provider</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-neutral-900 mb-1 tracking-widest">TAX INVOICE</div>
                <div className="inline-block px-2 py-1 border border-neutral-300 text-xs">ORIGINAL FOR RECIPIENT</div>
              </div>
            </div>

            {/* Company Details */}
            <div className="mb-6 text-sm">
              <p className="font-semibold text-neutral-900 mb-1">{COMPANY.name}</p>
              <p className="text-neutral-600 mb-2">{COMPANY.address}</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                <div><span className="font-medium">Mobile:</span> {COMPANY.mobile}</div>
                <div><span className="font-medium">GSTIN:</span> {COMPANY.gstin}</div>
                <div><span className="font-medium">Email:</span> {COMPANY.email}</div>
                <div><span className="font-medium">PAN:</span> {COMPANY.pan}</div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-neutral-200 text-sm">
              <div>
                <div className="font-medium text-neutral-900 mb-1">Invoice No.:</div>
                <div className="text-neutral-600">{invoice.invoice_number}</div>
              </div>
              <div>
                <div className="font-medium text-neutral-900 mb-1">Invoice Date:</div>
                <div className="text-neutral-600">{new Date(invoice.created_at).toLocaleDateString('en-GB')}</div>
              </div>
              <div>
                <div className="font-medium text-neutral-900 mb-1">Type:</div>
                <div className="text-neutral-600">{invoice.invoice_type}</div>
              </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-neutral-200 text-sm">
              {['BILL TO', 'SHIP TO'].map((label) => (
                <div key={label}>
                  <div className="font-bold text-neutral-900 mb-2">{label}</div>
                  <div className="font-medium text-neutral-900 mb-1">{customer.name}</div>
                  {customer.address && <p className="text-neutral-600 mb-2">{customer.address}</p>}
                  <div className="space-y-1 text-xs">
                    {customer.phone && <div><span className="font-medium">Mobile:</span> {customer.phone}</div>}
                    {customer.identifiers?.gstin && <div><span className="font-medium">GSTIN:</span> {customer.identifiers.gstin}</div>}
                    {customer.identifiers?.pan && <div><span className="font-medium">PAN:</span> {customer.identifiers.pan}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-neutral-900">
                    <th className="text-left py-2 font-bold text-neutral-900">ITEMS</th>
                    <th className="text-center py-2 font-bold text-neutral-900">QTY.</th>
                    <th className="text-right py-2 font-bold text-neutral-900">RATE</th>
                    <th className="text-right py-2 font-bold text-neutral-900">TAX</th>
                    <th className="text-right py-2 font-bold text-neutral-900">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items_detail?.map((item) => {
                    const itemTax = Number(item.total) * (Number(invoice.gst) / 100);
                    const itemTotal = Number(item.total) + itemTax;
                    return (
                      <tr key={item.id} className="border-b border-neutral-200">
                        <td className="py-3">
                          <div className="font-medium text-neutral-900">{item.description}</div>
                          {item.laptop && (
                            <div className="text-xs text-neutral-500 mt-1">
                              {item.laptop.brand} {item.laptop.model}
                              {item.laptop.serial_number && ` | S/N: ${item.laptop.serial_number}`}
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3">{item.quantity} PCS</td>
                        <td className="text-right py-3">₹{Number(item.price).toLocaleString('en-IN')}</td>
                        <td className="text-right py-3">
                          ₹{itemTax.toLocaleString('en-IN')}
                          <div className="text-xs text-neutral-500">({invoice.gst}%)</div>
                        </td>
                        <td className="text-right py-3 font-medium">₹{itemTotal.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80 border-t-2 border-neutral-900 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-neutral-900">SUBTOTAL</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-neutral-200 pt-2 space-y-1">
                  <div className="flex justify-between text-neutral-600">
                    <span>Taxable Amount</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>CGST @9%</span><span>₹{cgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>SGST @9%</span><span>₹{sgst.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="border-t-2 border-neutral-900 pt-3 flex justify-between">
                  <span className="font-bold text-neutral-900">Total Amount</span>
                  <span className="font-bold text-neutral-900">₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Received Amount</span>
                  <span>₹{invoice.status === 'PAID' ? total.toLocaleString('en-IN') : '0'}</span>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="mb-6 pb-6 border-b border-neutral-200">
              <div className="font-bold text-neutral-900 mb-3 text-sm tracking-wider">BANK DETAILS</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div><span className="font-medium text-neutral-900">Name:</span> <span className="text-neutral-600">{COMPANY.name}</span></div>
                <div><span className="font-medium text-neutral-900">IFSC:</span> <span className="text-neutral-600">{COMPANY.ifsc}</span></div>
                <div><span className="font-medium text-neutral-900">Account No:</span> <span className="text-neutral-600">{COMPANY.accountNo}</span></div>
                <div><span className="font-medium text-neutral-900">Bank:</span> <span className="text-neutral-600">{COMPANY.bank}</span></div>
              </div>
            </div>

            {/* UPI */}
            <div className="mb-6 pb-6 border-b border-neutral-200">
              <div className="font-bold text-neutral-900 mb-3 text-sm tracking-wider">PAYMENT QR CODE</div>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 bg-neutral-100 border border-neutral-300 flex items-center justify-center rounded">
                  <span className="text-xs text-neutral-400 text-center px-2">QR Code</span>
                </div>
                <div className="text-xs text-neutral-600">
                  <div className="mb-1 font-medium text-neutral-900">UPI ID:</div>
                  <div className="mb-3">{COMPANY.upi}</div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">PhonePe</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">G Pay</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Paytm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="mb-6">
              <div className="font-bold text-neutral-900 mb-2 text-sm tracking-wider">TERMS AND CONDITIONS</div>
              <p className="text-xs text-neutral-600">{invoice.notes || 'No Return & No Refund'}</p>
            </div>

            {/* Status badge */}
            <div className="flex justify-end print:hidden">
              <div className={`px-6 py-2 rounded-lg font-medium text-sm ${statusColors[invoice.status] || 'bg-neutral-100 text-neutral-700'}`}>
                {invoice.status}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
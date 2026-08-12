import React, { useState, useEffect } from 'react';
import { 
  Building, 
  DollarSign, 
  Bell, 
  Shield, 
  Save, 
  Mail, 
  MessageSquare, 
  Calendar,
  Globe,
  Palette,
  Database,
  FileText,
  Zap,
  Settings as SettingsIcon
} from 'lucide-react';
import { Button } from '../common/Button';
import { useIdentity } from '../../context/IdentityContext';
import { updateCompanySettingsApi } from '../../services/auth';
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function EnhancedSettings() {
  const { company, refreshIdentity } = useIdentity();
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    // Branding
    name: 'LaptopRent Solutions',
    logo: '',
    
    // Business IDs
    gstin: '',
    pan_number: '',
    
    // Address
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',

    // Financial/Bank
    bank_name: '',
    account_number: '',
    ifsc_code: '',

    // Contact
    email: '',
    phone: '',
    website: '',

    // Legacy/UI Fields (kept for UI consistency)
    industry: 'Technology Rental',
    companySize: '50-100',
    defaultLateFee: '100',
    securityDepositMultiple: '3',
    gstPercentage: '18',
    defaultRentalDiscount: '10',
    currency: 'INR',
    paymentTerms: '30',
    earlyPaymentDiscount: '2',
    emailNotifications: true,
    smsNotifications: false,
    rentalReminders: true,
    paymentReminders: true,
    maintenanceAlerts: true,
    leadNotifications: true,
    overdueAlerts: true,
    lowStockAlerts: true,
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    ipWhitelisting: false,
    auditLogging: true,
    welcomeEmailEnabled: true,
    invoiceEmailEnabled: true,
    reminderEmailEnabled: true,
    googleCalendarSync: false,
    whatsappIntegration: false,
    slackNotifications: false,
    autoInvoiceGeneration: true,
    autoReminderSending: true,
    allowPartialPayments: true,
    requireSecurityDeposit: true,
    theme: 'light',
    accentColor: '#3b82f6',
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '365'
  });

  useEffect(() => {
    if (company) {
      setFormData(prev => ({
        ...prev,
        ...company,
        // Map backend names to local state if necessary
      }));
      if (company.logo) {
        // Build full URL for preview
        const fullLogoUrl = company.logo.startsWith('http') 
          ? company.logo 
          : `http://127.0.0.1:8000${company.logo}`;
        setLogoPreview(fullLogoUrl);
      }
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const data = new FormData();
      // Only append fields that match the backend model
      const backendFields = [
        'name', 'gstin', 'pan_number', 'address_line1', 'address_line2', 
        'city', 'state', 'pincode', 'country', 'phone', 'email', 'website',
        'bank_name', 'account_number', 'ifsc_code'
      ];
      
      backendFields.forEach(field => {
        if (formData[field as keyof typeof formData] !== undefined) {
          data.append(field, formData[field as keyof typeof formData] as string);
        }
      });

      if (logoFile) {
        data.append('logo', logoFile);
      }

      await updateCompanySettingsApi(data);
      await refreshIdentity();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus('error');
    }
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: Building },
    { id: 'pricing', label: 'Pricing & Tax', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email Templates', icon: Mail },
    { id: 'integration', label: 'Integrations', icon: Zap },
    { id: 'business', label: 'Business Rules', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'backup', label: 'Backup & Data', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Settings</h1>
          <p className="text-neutral-600">Manage your application settings and preferences</p>
        </div>
        <Button onClick={handleSave} variant="primary">
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#1a6ef5] text-[#1a6ef5]'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                  {activeTab === tab.id && saveStatus === 'saving' && (
                    <Loader2 className="w-3 h-3 animate-spin ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'company' && (
            <div className="space-y-8">
              {/* Branding Section */}
              <section>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Branding</h3>
                <div className="flex items-start gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden relative group">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                      ) : (
                        <Building className="w-8 h-8 text-neutral-300" />
                      )}
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                      </label>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider text-center">
                      Logo (Square preferred)
                    </p>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                        placeholder="Enter company legal name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Industry
                      </label>
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Business Identification */}
              <section className="pt-6 border-t border-neutral-100">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Business Identification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">GST Number</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">PAN Number</label>
                    <input
                      type="text"
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                      placeholder="e.g. ABCDE1234F"
                    />
                  </div>
                </div>
              </section>

              {/* Registered Address */}
              <section className="pt-6 border-t border-neutral-100">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Registered Address</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Address Line 1</label>
                      <input
                        type="text"
                        name="address_line1"
                        value={formData.address_line1}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Financial & Banking */}
              <section className="pt-6 border-t border-neutral-100">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Banking Details (For Billing)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">IFSC Code</label>
                    <input
                      type="text"
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Contact Info */}
              <section className="pt-6 border-t border-neutral-100">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Communication</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Support Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Support Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#1a6ef5] outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Status Indicator */}
              <div className="flex items-center gap-4 pt-4">
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 font-medium text-sm animate-in fade-in slide-in-from-left-2">
                    <CheckCircle className="w-4 h-4" />
                    Settings saved successfully!
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 font-medium text-sm animate-in fade-in slide-in-from-left-2">
                    <AlertCircle className="w-4 h-4" />
                    Failed to save settings. Please check your inputs.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing & Tax */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">Pricing Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    GST Percentage (%)
                  </label>
                  <input
                    type="number"
                    name="gstPercentage"
                    value={formData.gstPercentage}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Default Late Fee (₹/day)
                  </label>
                  <input
                    type="number"
                    name="defaultLateFee"
                    value={formData.defaultLateFee}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Security Deposit Multiple (x)
                  </label>
                  <input
                    type="number"
                    name="securityDepositMultiple"
                    value={formData.securityDepositMultiple}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Default Rental Discount (%)
                  </label>
                  <input
                    type="number"
                    name="defaultRentalDiscount"
                    value={formData.defaultRentalDiscount}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Payment Terms (days)
                  </label>
                  <input
                    type="number"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Early Payment Discount (%)
                  </label>
                  <input
                    type="number"
                    name="earlyPaymentDiscount"
                    value={formData.earlyPaymentDiscount}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Email Notifications</p>
                    <p className="text-sm text-neutral-600">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">SMS Notifications</p>
                    <p className="text-sm text-neutral-600">Receive notifications via SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    name="smsNotifications"
                    checked={formData.smsNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Rental Reminders</p>
                    <p className="text-sm text-neutral-600">Notify before rental expiry</p>
                  </div>
                  <input
                    type="checkbox"
                    name="rentalReminders"
                    checked={formData.rentalReminders}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Payment Reminders</p>
                    <p className="text-sm text-neutral-600">Notify about pending payments</p>
                  </div>
                  <input
                    type="checkbox"
                    name="paymentReminders"
                    checked={formData.paymentReminders}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Lead Notifications</p>
                    <p className="text-sm text-neutral-600">Notify about new leads</p>
                  </div>
                  <input
                    type="checkbox"
                    name="leadNotifications"
                    checked={formData.leadNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Overdue Alerts</p>
                    <p className="text-sm text-neutral-600">Notify about overdue payments</p>
                  </div>
                  <input
                    type="checkbox"
                    name="overdueAlerts"
                    checked={formData.overdueAlerts}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Low Stock Alerts</p>
                    <p className="text-sm text-neutral-600">Notify when inventory is low</p>
                  </div>
                  <input
                    type="checkbox"
                    name="lowStockAlerts"
                    checked={formData.lowStockAlerts}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">Security Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Two-Factor Authentication</p>
                    <p className="text-sm text-neutral-600">Add an extra layer of security</p>
                  </div>
                  <input
                    type="checkbox"
                    name="twoFactorAuth"
                    checked={formData.twoFactorAuth}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">IP Whitelisting</p>
                    <p className="text-sm text-neutral-600">Restrict access to specific IP addresses</p>
                  </div>
                  <input
                    type="checkbox"
                    name="ipWhitelisting"
                    checked={formData.ipWhitelisting}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Audit Logging</p>
                    <p className="text-sm text-neutral-600">Track all user activities</p>
                  </div>
                  <input
                    type="checkbox"
                    name="auditLogging"
                    checked={formData.auditLogging}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    name="sessionTimeout"
                    value={formData.sessionTimeout}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Password Expiry (days)
                  </label>
                  <input
                    type="number"
                    name="passwordExpiry"
                    value={formData.passwordExpiry}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email Templates */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">Email Template Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Welcome Email</p>
                    <p className="text-sm text-neutral-600">Send welcome email to new customers</p>
                  </div>
                  <input
                    type="checkbox"
                    name="welcomeEmailEnabled"
                    checked={formData.welcomeEmailEnabled}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Invoice Email</p>
                    <p className="text-sm text-neutral-600">Auto-send invoices via email</p>
                  </div>
                  <input
                    type="checkbox"
                    name="invoiceEmailEnabled"
                    checked={formData.invoiceEmailEnabled}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Reminder Email</p>
                    <p className="text-sm text-neutral-600">Send payment reminder emails</p>
                  </div>
                  <input
                    type="checkbox"
                    name="reminderEmailEnabled"
                    checked={formData.reminderEmailEnabled}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="mt-6">
                  <button className="px-4 py-2 bg-[#1a6ef5] text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Customize Email Templates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === 'integration' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">Third-Party Integrations</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-[#1a6ef5]" />
                    <div>
                      <p className="font-medium text-neutral-900">Google Calendar</p>
                      <p className="text-sm text-neutral-600">Sync rentals with Google Calendar</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="googleCalendarSync"
                    checked={formData.googleCalendarSync}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-neutral-900">WhatsApp Business</p>
                      <p className="text-sm text-neutral-600">Send notifications via WhatsApp</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="whatsappIntegration"
                    checked={formData.whatsappIntegration}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="font-medium text-neutral-900">Slack</p>
                      <p className="text-sm text-neutral-600">Send team notifications to Slack</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="slackNotifications"
                    checked={formData.slackNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Business Rules */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">Business Automation Rules</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Auto Invoice Generation</p>
                    <p className="text-sm text-neutral-600">Automatically generate invoices on rental/sale</p>
                  </div>
                  <input
                    type="checkbox"
                    name="autoInvoiceGeneration"
                    checked={formData.autoInvoiceGeneration}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Auto Reminder Sending</p>
                    <p className="text-sm text-neutral-600">Automatically send payment reminders</p>
                  </div>
                  <input
                    type="checkbox"
                    name="autoReminderSending"
                    checked={formData.autoReminderSending}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Allow Partial Payments</p>
                    <p className="text-sm text-neutral-600">Accept partial payments from customers</p>
                  </div>
                  <input
                    type="checkbox"
                    name="allowPartialPayments"
                    checked={formData.allowPartialPayments}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Require Security Deposit</p>
                    <p className="text-sm text-neutral-600">Mandatory security deposit for rentals</p>
                  </div>
                  <input
                    type="checkbox"
                    name="requireSecurityDeposit"
                    checked={formData.requireSecurityDeposit}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">Appearance Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Theme
                  </label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="h-11 w-20 border border-neutral-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup & Data */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">Data Management</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Auto Backup</p>
                    <p className="text-sm text-neutral-600">Automatically backup data</p>
                  </div>
                  <input
                    type="checkbox"
                    name="autoBackup"
                    checked={formData.autoBackup}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#1a6ef5] rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    name="backupFrequency"
                    value={formData.backupFrequency}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Data Retention Period (days)
                  </label>
                  <input
                    type="number"
                    name="dataRetention"
                    value={formData.dataRetention}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6ef5]"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="px-4 py-2 bg-[#1a6ef5] text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Backup Now
                  </button>
                  <button className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                    Restore Backup
                  </button>
                  <button className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                    Export All Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

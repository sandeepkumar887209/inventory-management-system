import React, { useState } from 'react';
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

export function EnhancedSettings() {
  const [activeTab, setActiveTab] = useState('company');
  const [formData, setFormData] = useState({
    // Company
    companyName: 'LaptopRent Solutions',
    email: 'info@laptoprent.com',
    phone: '+91 98765 43210',
    address: '123 Business Park, Mumbai, Maharashtra 400001',
    gstNumber: '27AAAAA0000A1Z5',
    website: 'www.laptoprent.com',
    industry: 'Technology Rental',
    companySize: '50-100',
    
    // Pricing
    defaultLateFee: '100',
    securityDepositMultiple: '3',
    gstPercentage: '18',
    defaultRentalDiscount: '10',
    currency: 'INR',
    paymentTerms: '30',
    earlyPaymentDiscount: '2',
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    rentalReminders: true,
    paymentReminders: true,
    maintenanceAlerts: true,
    leadNotifications: true,
    overdueAlerts: true,
    lowStockAlerts: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    ipWhitelisting: false,
    auditLogging: true,
    
    // Email Templates
    welcomeEmailEnabled: true,
    invoiceEmailEnabled: true,
    reminderEmailEnabled: true,
    
    // Integration
    googleCalendarSync: false,
    whatsappIntegration: false,
    slackNotifications: false,
    
    // Business Rules
    autoInvoiceGeneration: true,
    autoReminderSending: true,
    allowPartialPayments: true,
    requireSecurityDeposit: true,
    
    // Appearance
    theme: 'light',
    accentColor: '#3b82f6',
    logo: '',
    
    // Backup & Data
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '365'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
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
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Company Profile */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Company Size
                  </label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="50-100">50-100 employees</option>
                    <option value="100+">100+ employees</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>

                <div className="mt-6">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                    <Calendar className="w-8 h-8 text-blue-600" />
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-5 h-5 text-blue-600 rounded"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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

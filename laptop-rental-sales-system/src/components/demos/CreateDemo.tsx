import React, { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Button } from '../common/Button';

interface CreateDemoProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function CreateDemo({ onSubmit, onCancel }: CreateDemoProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Customer details
    customerType: 'individual' as 'individual' | 'corporate',
    customerName: '',
    customerId: '',
    email: '',
    phone: '',
    companyName: '',
    
    // Laptop selection
    selectedLaptop: null as any,
    
    // Demo details
    assignedDate: '',
    demoDuration: '7', // days
    returnDueDate: '',
    purpose: '',
    specificRequirements: '',
    
    // Additional info
    requiresTraining: false,
    deliveryRequired: false,
    deliveryAddress: '',
    emergencyContact: '',
    
    // Terms
    agreeToTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock available laptops for demo
  const availableLaptops = [
    { id: '1', brand: 'Dell', model: 'XPS 15', serialNumber: 'DXP15-2024-001', specs: 'Intel Core i7-13700H • 16GB RAM • 512GB SSD' },
    { id: '2', brand: 'Apple', model: 'MacBook Pro 14"', serialNumber: 'MBP14-2024-002', specs: 'Apple M3 Pro • 18GB RAM • 512GB SSD' },
    { id: '3', brand: 'HP', model: 'EliteBook 840 G9', serialNumber: 'HPE840-2024-003', specs: 'Intel Core i5-1235U • 16GB RAM • 256GB SSD' },
    { id: '4', brand: 'Lenovo', model: 'ThinkPad X1 Carbon', serialNumber: 'LTX1C-2024-004', specs: 'Intel Core i7-1260P • 16GB RAM • 512GB SSD' },
    { id: '7', brand: 'HP', model: 'ProBook 450 G9', serialNumber: 'HPP450-2024-007', specs: 'Intel Core i7-1255U • 16GB RAM • 512GB SSD' },
    { id: '8', brand: 'Lenovo', model: 'ThinkBook 14', serialNumber: 'LTB14-2024-008', specs: 'AMD Ryzen 5 5500U • 8GB RAM • 512GB SSD' },
    { id: '9', brand: 'Dell', model: 'Inspiron 15', serialNumber: 'DIN15-2024-009', specs: 'Intel Core i5-1155G7 • 8GB RAM • 512GB SSD' },
    { id: '10', brand: 'Apple', model: 'MacBook Pro 16"', serialNumber: 'MBP16-2024-010', specs: 'Apple M3 Max • 36GB RAM • 1TB SSD' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Calculate return due date when assigned date or duration changes
    if (name === 'assignedDate' || name === 'demoDuration') {
      const assigned = name === 'assignedDate' ? value : formData.assignedDate;
      const days = name === 'demoDuration' ? parseInt(value) : parseInt(formData.demoDuration);
      
      if (assigned && days) {
        const assignedDate = new Date(assigned);
        assignedDate.setDate(assignedDate.getDate() + days);
        setFormData(prev => ({
          ...prev,
          returnDueDate: assignedDate.toISOString().split('T')[0]
        }));
      }
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectLaptop = (laptop: any) => {
    setFormData(prev => ({
      ...prev,
      selectedLaptop: laptop
    }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customerName) newErrors.customerName = 'Customer name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    
    if (formData.customerType === 'corporate') {
      if (!formData.companyName) newErrors.companyName = 'Company name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (!formData.selectedLaptop) {
      setErrors({ laptop: 'Please select a laptop' });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.assignedDate) newErrors.assignedDate = 'Assignment date is required';
    if (!formData.purpose) newErrors.purpose = 'Demo purpose is required';
    if (formData.deliveryRequired && !formData.deliveryAddress) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'Please agree to terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[
          { num: 1, label: 'Customer Info' },
          { num: 2, label: 'Select Laptop' },
          { num: 3, label: 'Demo Details' }
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step > s.num ? 'bg-green-500 text-white' :
                step === s.num ? 'bg-blue-600 text-white' :
                'bg-neutral-200 text-neutral-600'
              }`}>
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-sm font-medium ${
                step >= s.num ? 'text-neutral-900' : 'text-neutral-500'
              }`}>
                {s.label}
              </span>
            </div>
            {idx < 2 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                step > s.num ? 'bg-green-500' : 'bg-neutral-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-neutral-900">Customer Information</h3>
            
            {/* Customer Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Customer Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.customerType === 'individual' ? 'border-blue-600 bg-blue-50' : 'border-neutral-200'
                }`}>
                  <input
                    type="radio"
                    name="customerType"
                    value="individual"
                    checked={formData.customerType === 'individual'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-neutral-900">Individual</div>
                    <div className="text-sm text-neutral-600">Personal demo</div>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.customerType === 'corporate' ? 'border-blue-600 bg-blue-50' : 'border-neutral-200'
                }`}>
                  <input
                    type="radio"
                    name="customerType"
                    value="corporate"
                    checked={formData.customerType === 'corporate'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-neutral-900">Corporate</div>
                    <div className="text-sm text-neutral-600">Business demo</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {formData.customerType === 'corporate' ? 'Contact Person Name' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customerName ? 'border-red-300' : 'border-neutral-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-neutral-200'
                  }`}
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
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-neutral-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="+91 98765 43211"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formData.customerType === 'corporate' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.companyName ? 'border-red-300' : 'border-neutral-200'
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-neutral-900">Select Laptop for Demo</h3>
            
            {errors.laptop && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{errors.laptop}</p>
              </div>
            )}

            <div className="space-y-3">
              {availableLaptops.map((laptop) => (
                <div
                  key={laptop.id}
                  onClick={() => selectLaptop(laptop)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.selectedLaptop?.id === laptop.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900">
                        {laptop.brand} {laptop.model}
                      </h4>
                      <p className="text-sm text-neutral-600 mt-1">
                        {laptop.specs}
                      </p>
                      <code className="text-xs bg-neutral-100 px-2 py-1 rounded mt-2 inline-block">
                        {laptop.serialNumber}
                      </code>
                    </div>
                    {formData.selectedLaptop?.id === laptop.id && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-neutral-900">Demo Assignment Details</h3>

            {/* Selected Laptop Summary */}
            {formData.selectedLaptop && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">Selected Laptop:</p>
                <p className="font-semibold text-blue-900 mt-1">
                  {formData.selectedLaptop.brand} {formData.selectedLaptop.model}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Assignment Date *
                </label>
                <input
                  type="date"
                  name="assignedDate"
                  value={formData.assignedDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.assignedDate ? 'border-red-300' : 'border-neutral-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Demo Duration (Days)
                </label>
                <select
                  name="demoDuration"
                  value={formData.demoDuration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="3">3 Days</option>
                  <option value="5">5 Days</option>
                  <option value="7">7 Days (Recommended)</option>
                  <option value="10">10 Days</option>
                  <option value="14">14 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Return Due Date
                </label>
                <input
                  type="date"
                  name="returnDueDate"
                  value={formData.returnDueDate}
                  readOnly
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Demo Purpose *
                </label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.purpose ? 'border-red-300' : 'border-neutral-200'
                  }`}
                >
                  <option value="">Select purpose</option>
                  <option value="performance_testing">Performance Testing</option>
                  <option value="software_compatibility">Software Compatibility</option>
                  <option value="team_evaluation">Team Evaluation</option>
                  <option value="student_trial">Student Trial</option>
                  <option value="video_editing">Video Editing</option>
                  <option value="programming_development">Programming/Development</option>
                  <option value="graphic_design">Graphic Design</option>
                  <option value="general_evaluation">General Evaluation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Specific Requirements
                </label>
                <textarea
                  name="specificRequirements"
                  value={formData.specificRequirements}
                  onChange={handleChange}
                  placeholder="Any specific software, configurations, or requirements..."
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3 p-4 bg-neutral-50 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="requiresTraining"
                  checked={formData.requiresTraining}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-900">Requires Training/Demo Session</span>
                  <p className="text-xs text-neutral-600">Schedule a brief training on laptop usage</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="deliveryRequired"
                  checked={formData.deliveryRequired}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-900">Delivery Required</span>
                  <p className="text-xs text-neutral-600">Deliver laptop to customer location</p>
                </div>
              </label>

              {formData.deliveryRequired && (
                <div className="ml-7 mt-3">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                    placeholder="Enter full delivery address..."
                    rows={2}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.deliveryAddress ? 'border-red-300' : 'border-neutral-200'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-1 text-blue-600 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-600">
                  I agree to the demo terms including responsibility for device safety, timely return, 
                  and compensation for any damages during the demo period.
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-600 mt-1 ml-6">{errors.agreeToTerms}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
        >
          {step === 1 ? 'Cancel' : 'Previous'}
        </Button>
        <Button onClick={handleNext}>
          {step === 3 ? 'Assign Demo' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

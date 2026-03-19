import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Phone, Mail, Building, Calendar, Star, TrendingUp, DollarSign, Users as UsersIcon, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '../common/Badge';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  priority: 'High' | 'Medium' | 'Low';
  estimatedValue: number;
  createdDate: string;
  lastContact: string;
  assignedTo: string;
  requirement: string;
}

interface LeadListProps {
  onAddNew: () => void;
  onEdit: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onViewDetails?: (lead: Lead) => void;
}

export function LeadList({ onAddNew, onEdit, onConvert, onViewDetails }: LeadListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Mock lead data
  const leads: Lead[] = [
    {
      id: 'L-001',
      name: 'Rajesh Kumar',
      company: 'TechStartup Pvt Ltd',
      email: 'rajesh@techstartup.com',
      phone: '+91 98765 43210',
      source: 'Website',
      status: 'Qualified',
      priority: 'High',
      estimatedValue: 250000,
      createdDate: '2026-03-01',
      lastContact: '2026-03-07',
      assignedTo: 'Sarah Smith',
      requirement: '15 laptops for new team - Dell XPS preferred'
    },
    {
      id: 'L-002',
      name: 'Priya Sharma',
      company: 'Design Studio Inc',
      email: 'priya@designstudio.com',
      phone: '+91 98765 43211',
      source: 'Referral',
      status: 'Proposal',
      priority: 'High',
      estimatedValue: 180000,
      createdDate: '2026-03-02',
      lastContact: '2026-03-06',
      assignedTo: 'John Doe',
      requirement: 'MacBook Pro rentals for 6 months'
    },
    {
      id: 'L-003',
      name: 'Amit Patel',
      company: 'EduTech Solutions',
      email: 'amit@edutech.com',
      phone: '+91 98765 43212',
      source: 'Cold Call',
      status: 'Contacted',
      priority: 'Medium',
      estimatedValue: 120000,
      createdDate: '2026-03-03',
      lastContact: '2026-03-05',
      assignedTo: 'Emily Brown',
      requirement: 'Budget laptops for training center'
    },
    {
      id: 'L-004',
      name: 'Sneha Reddy',
      company: 'Marketing Hub',
      email: 'sneha@marketinghub.com',
      phone: '+91 98765 43213',
      source: 'LinkedIn',
      status: 'New',
      priority: 'Low',
      estimatedValue: 85000,
      createdDate: '2026-03-04',
      lastContact: '2026-03-04',
      assignedTo: 'Mike Johnson',
      requirement: 'Laptops for remote team members'
    },
    {
      id: 'L-005',
      name: 'Vikram Singh',
      company: 'Finance Corp',
      email: 'vikram@financecorp.com',
      phone: '+91 98765 43214',
      source: 'Trade Show',
      status: 'Negotiation',
      priority: 'High',
      estimatedValue: 320000,
      createdDate: '2026-02-28',
      lastContact: '2026-03-08',
      assignedTo: 'Sarah Smith',
      requirement: '20 ThinkPad laptops with 3-year warranty'
    },
    {
      id: 'L-006',
      name: 'Anjali Mehta',
      company: 'Creative Agency',
      email: 'anjali@creative.com',
      phone: '+91 98765 43215',
      source: 'Google Ads',
      status: 'Won',
      priority: 'Medium',
      estimatedValue: 150000,
      createdDate: '2026-02-25',
      lastContact: '2026-03-02',
      assignedTo: 'John Doe',
      requirement: '10 MacBook Air for design team'
    },
    {
      id: 'L-007',
      name: 'Ravi Krishnan',
      company: 'IT Services Ltd',
      email: 'ravi@itservices.com',
      phone: '+91 98765 43216',
      source: 'Website',
      status: 'Lost',
      priority: 'Low',
      estimatedValue: 95000,
      createdDate: '2026-02-20',
      lastContact: '2026-02-28',
      assignedTo: 'Emily Brown',
      requirement: 'Short-term rental for project'
    }
  ];

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  });

  // Calculate stats
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified' || l.status === 'Proposal' || l.status === 'Negotiation').length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const totalValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const wonValue = leads.filter(l => l.status === 'Won').reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

  const getStatusBadge = (status: Lead['status']) => {
    const variants: Record<Lead['status'], any> = {
      'New': 'info',
      'Contacted': 'neutral',
      'Qualified': 'primary',
      'Proposal': 'warning',
      'Negotiation': 'warning',
      'Won': 'success',
      'Lost': 'danger'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: Lead['priority']) => {
    const colors = {
      'High': 'text-red-600 bg-red-50',
      'Medium': 'text-orange-600 bg-orange-50',
      'Low': 'text-blue-600 bg-blue-50'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        {priority}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Lead Management</h1>
          <p className="text-neutral-600">Track and manage your sales pipeline</p>
        </div>
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Lead
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{totalLeads}</p>
              <p className="text-sm text-neutral-600">Total Leads</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{newLeads}</p>
              <p className="text-sm text-neutral-600">New Leads</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{qualifiedLeads}</p>
              <p className="text-sm text-neutral-600">In Pipeline</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{conversionRate}%</p>
              <p className="text-sm text-neutral-600">Conversion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{formatCurrency(totalValue)}</span>
          </div>
          <h4 className="font-semibold mb-1">Total Pipeline Value</h4>
          <p className="text-sm opacity-90">Estimated revenue from all leads</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{formatCurrency(wonValue)}</span>
          </div>
          <h4 className="font-semibold mb-1">Won Deals Value</h4>
          <p className="text-sm opacity-90">Revenue from converted leads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Trade Show">Trade Show</option>
            <option value="Google Ads">Google Ads</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Lead Info
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Source
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Value
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900">{lead.name}</p>
                        <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                          {lead.id}
                        </code>
                      </div>
                      <p className="text-sm text-neutral-600 flex items-center gap-1 mt-1">
                        <Building className="w-3.5 h-3.5" />
                        {lead.company}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-600 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {lead.email}
                      </p>
                      <p className="text-sm text-neutral-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">{lead.source}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-6 py-4">
                    {getPriorityBadge(lead.priority)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-neutral-900">
                      {formatCurrency(lead.estimatedValue)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-900">{lead.assignedTo}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(lead)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Lead"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {lead.status === 'Won' && (
                        <button
                          onClick={() => onConvert(lead)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Convert to Customer"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete lead: ${lead.name}?`)) {
                            alert('Lead deleted');
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">No leads found</p>
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { 
  Laptop, 
  Calendar, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Package,
  CheckCircle,
  Users
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export function Dashboard() {
  // Mock data
  const stats = [
    {
      id: 1,
      title: 'Total Laptops',
      value: '248',
      change: '+12',
      changeType: 'positive' as const,
      icon: Laptop,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'On Rent',
      value: '156',
      change: '+8',
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      id: 3,
      title: 'Sold This Month',
      value: '42',
      change: '+15',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      title: 'Monthly Revenue',
      value: '₹4.2L',
      change: '+23%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'bg-orange-500'
    }
  ];

  const revenueData = [
    { month: 'Jan', rental: 280000, sales: 150000 },
    { month: 'Feb', rental: 320000, sales: 180000 },
    { month: 'Mar', rental: 290000, sales: 220000 },
    { month: 'Apr', rental: 350000, sales: 190000 },
    { month: 'May', rental: 380000, sales: 250000 },
    { month: 'Jun', rental: 420000, sales: 280000 }
  ];

  const utilizationData = [
    { category: 'Available', count: 92 },
    { category: 'Rented', count: 156 },
    { category: 'Maintenance', count: 18 },
    { category: 'Sold', count: 42 }
  ];

  const expiringRentals = [
    { id: 1, customer: 'TechCorp Solutions', laptop: 'Dell XPS 15', endDate: '2026-02-10', daysLeft: 2 },
    { id: 2, customer: 'Startup Hub', laptop: 'MacBook Pro 14"', endDate: '2026-02-12', daysLeft: 4 },
    { id: 3, customer: 'John Smith', laptop: 'HP EliteBook 840', endDate: '2026-02-13', daysLeft: 5 },
    { id: 4, customer: 'Design Studio', laptop: 'Lenovo ThinkPad X1', endDate: '2026-02-15', daysLeft: 7 }
  ];

  const recentActivity = [
    { id: 1, action: 'New rental order', customer: 'ABC Technologies', time: '10 minutes ago', type: 'rental' },
    { id: 2, action: 'Laptop sold', customer: 'Jane Doe', time: '1 hour ago', type: 'sale' },
    { id: 3, action: 'Rental returned', customer: 'XYZ Corp', time: '2 hours ago', type: 'return' },
    { id: 4, action: 'New customer registered', customer: 'Tech Innovators', time: '3 hours ago', type: 'customer' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Dashboard</h1>
        <p className="text-neutral-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-neutral-600">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Revenue Trend</h3>
              <p className="text-sm text-neutral-600">Last 6 months</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">+23.5%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rental" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Rental Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Sales Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Utilization Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Laptop Utilization</h3>
            <p className="text-sm text-neutral-600">Current inventory status</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Rentals */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Expiring Rentals</h3>
          </div>
          <div className="space-y-3">
            {expiringRentals.map((rental) => (
              <div key={rental.id} className="flex items-start justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{rental.customer}</p>
                  <p className="text-sm text-neutral-600">{rental.laptop}</p>
                  <p className="text-xs text-neutral-500 mt-1">Ends: {rental.endDate}</p>
                </div>
                <Badge variant={rental.daysLeft <= 3 ? 'danger' : 'warning'} size="sm">
                  {rental.daysLeft}d left
                </Badge>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Rentals
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'rental' ? 'bg-blue-500' :
                  activity.type === 'sale' ? 'bg-purple-500' :
                  activity.type === 'return' ? 'bg-green-500' :
                  'bg-orange-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{activity.action}</p>
                  <p className="text-sm text-neutral-600">{activity.customer}</p>
                  <p className="text-xs text-neutral-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Activity
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">63%</span>
          </div>
          <h4 className="font-semibold mb-1">Utilization Rate</h4>
          <p className="text-sm opacity-90">156 out of 248 laptops on rent</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">₹28K</span>
          </div>
          <h4 className="font-semibold mb-1">Avg. Monthly Rent</h4>
          <p className="text-sm opacity-90">Per laptop rental income</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">184</span>
          </div>
          <h4 className="font-semibold mb-1">Active Customers</h4>
          <p className="text-sm opacity-90">42 corporate, 142 individual</p>
        </div>
      </div>
    </div>
  );
}
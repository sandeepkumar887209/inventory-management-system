import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { Button } from '../common/Button';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function ReportsAnalytics() {
  const [dateRange, setDateRange] = useState('6months');

  // Mock data
  const revenueByMonth = [
    { month: 'Aug 25', rental: 280000, sales: 150000, total: 430000 },
    { month: 'Sep 25', rental: 320000, sales: 180000, total: 500000 },
    { month: 'Oct 25', rental: 290000, sales: 220000, total: 510000 },
    { month: 'Nov 25', rental: 350000, sales: 190000, total: 540000 },
    { month: 'Dec 25', rental: 380000, sales: 250000, total: 630000 },
    { month: 'Jan 26', rental: 420000, sales: 280000, total: 700000 },
    { month: 'Feb 26', rental: 450000, sales: 310000, total: 760000 }
  ];

  const utilizationData = [
    { name: 'Available', value: 92, color: '#22c55e' },
    { name: 'Rented', value: 156, color: '#3b82f6' },
    { name: 'Maintenance', value: 18, color: '#f59e0b' },
    { name: 'Sold', value: 42, color: '#8b5cf6' }
  ];

  const topLaptopModels = [
    { model: 'Dell XPS 15', rentals: 45, revenue: 202500 },
    { model: 'MacBook Pro 14"', rentals: 38, revenue: 323000 },
    { model: 'HP EliteBook 840', rentals: 32, revenue: 112000 },
    { model: 'Lenovo ThinkPad X1', rentals: 28, revenue: 154000 },
    { model: 'MacBook Air M2', rentals: 25, revenue: 100000 }
  ];

  const customerSegments = [
    { type: 'Corporate - Large', count: 8, revenue: 1250000 },
    { type: 'Corporate - SME', count: 22, revenue: 680000 },
    { type: 'Individual - Professional', count: 45, revenue: 425000 },
    { type: 'Individual - Student', count: 38, revenue: 180000 }
  ];

  const totalRevenue = revenueByMonth.reduce((sum, month) => sum + month.total, 0);
  const totalRentalRevenue = revenueByMonth.reduce((sum, month) => sum + month.rental, 0);
  const totalSalesRevenue = revenueByMonth.reduce((sum, month) => sum + month.sales, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Reports & Analytics</h1>
          <p className="text-neutral-600">Business intelligence and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium">+18.5%</span>
          </div>
          <p className="text-3xl font-bold">₹{(totalRevenue / 100000).toFixed(1)}L</p>
          <p className="text-sm opacity-90 mt-1">Total Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium">68%</span>
          </div>
          <p className="text-3xl font-bold">₹{(totalRentalRevenue / 100000).toFixed(1)}L</p>
          <p className="text-sm opacity-90 mt-1">Rental Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium">32%</span>
          </div>
          <p className="text-3xl font-bold">₹{(totalSalesRevenue / 100000).toFixed(1)}L</p>
          <p className="text-sm opacity-90 mt-1">Sales Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <PieChart className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium">63%</span>
          </div>
          <p className="text-3xl font-bold">156</p>
          <p className="text-sm opacity-90 mt-1">Active Rentals</p>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">Revenue Trend Analysis</h3>
          <p className="text-sm text-neutral-600">Monthly revenue breakdown by source</p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={revenueByMonth}>
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
            <Line type="monotone" dataKey="rental" stroke="#22c55e" strokeWidth={3} name="Rental Revenue" />
            <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} name="Sales Revenue" />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} name="Total Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Inventory Utilization</h3>
            <p className="text-sm text-neutral-600">Current laptop distribution</p>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Models */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Top Performing Models</h3>
            <p className="text-sm text-neutral-600">By rental count and revenue</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topLaptopModels} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis dataKey="model" type="category" stroke="#6b7280" fontSize={11} width={120} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">Customer Segment Analysis</h3>
          <p className="text-sm text-neutral-600">Revenue contribution by customer type</p>
        </div>
        <div className="space-y-4">
          {customerSegments.map((segment, idx) => {
            const totalSegmentRevenue = customerSegments.reduce((sum, s) => sum + s.revenue, 0);
            const percentage = (segment.revenue / totalSegmentRevenue) * 100;
            
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-neutral-900">{segment.type}</span>
                    <span className="text-sm text-neutral-600 ml-2">({segment.count} customers)</span>
                  </div>
                  <span className="font-semibold text-neutral-900">
                    ₹{(segment.revenue / 100000).toFixed(1)}L
                  </span>
                </div>
                <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-600 uppercase">Metric</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-600 uppercase">Current Month</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-600 uppercase">Previous Month</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-600 uppercase">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr>
                <td className="px-6 py-4 font-medium text-neutral-900">Total Revenue</td>
                <td className="px-6 py-4 text-right text-neutral-900">₹7.6L</td>
                <td className="px-6 py-4 text-right text-neutral-600">₹7.0L</td>
                <td className="px-6 py-4 text-right text-green-600">+8.6%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-neutral-900">Active Rentals</td>
                <td className="px-6 py-4 text-right text-neutral-900">156</td>
                <td className="px-6 py-4 text-right text-neutral-600">148</td>
                <td className="px-6 py-4 text-right text-green-600">+5.4%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-neutral-900">New Customers</td>
                <td className="px-6 py-4 text-right text-neutral-900">12</td>
                <td className="px-6 py-4 text-right text-neutral-600">8</td>
                <td className="px-6 py-4 text-right text-green-600">+50%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-neutral-900">Utilization Rate</td>
                <td className="px-6 py-4 text-right text-neutral-900">63%</td>
                <td className="px-6 py-4 text-right text-neutral-600">60%</td>
                <td className="px-6 py-4 text-right text-green-600">+3%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

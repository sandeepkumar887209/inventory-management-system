import React, { useState } from 'react';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { updateUserApi } from '../../services/auth';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RoleManagementProps {
  user: any; // UserProfile API shape: { id, username, full_name, role_title, ... }
  onSave: () => void;
  onCancel: () => void;
}

// Default permissions granted per role (frontend-side logical mapping)
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  Admin: ['all'],
  'Sales Manager': [
    'dashboard_view', 'inventory_view', 'rentals_view', 'rentals_create', 'rentals_edit',
    'rentals_cancel', 'sales_view', 'sales_create', 'sales_edit', 'customers_view',
    'customers_create', 'customers_edit', 'invoices_view', 'invoices_create', 'reports_view',
    'reports_export', 'users_view',
  ],
  'Sales Executive': [
    'dashboard_view', 'inventory_view', 'rentals_view', 'rentals_create',
    'sales_view', 'sales_create', 'customers_view', 'customers_create', 'invoices_view',
  ],
  Operations: [
    'dashboard_view', 'inventory_view', 'inventory_edit', 'rentals_view', 'rentals_edit',
    'rentals_cancel', 'customers_view',
  ],
  'Inventory Manager': [
    'dashboard_view', 'inventory_view', 'inventory_create', 'inventory_edit', 'inventory_delete',
  ],
  Accountant: [
    'dashboard_view', 'invoices_view', 'invoices_create', 'invoices_edit', 'invoices_delete',
    'reports_view', 'reports_export',
  ],
  Support: ['dashboard_view', 'customers_view', 'rentals_view', 'invoices_view'],
  Staff: ['dashboard_view'],
};

const availablePermissions: Permission[] = [
  { id: 'dashboard_view', name: 'View Dashboard', description: 'Access main dashboard and analytics', category: 'Dashboard' },
  { id: 'inventory_view', name: 'View Inventory', description: 'View laptop inventory', category: 'Inventory' },
  { id: 'inventory_create', name: 'Create Inventory', description: 'Add new laptops to inventory', category: 'Inventory' },
  { id: 'inventory_edit', name: 'Edit Inventory', description: 'Modify existing inventory items', category: 'Inventory' },
  { id: 'inventory_delete', name: 'Delete Inventory', description: 'Remove items from inventory', category: 'Inventory' },
  { id: 'rentals_view', name: 'View Rentals', description: 'View rental records', category: 'Rentals' },
  { id: 'rentals_create', name: 'Create Rentals', description: 'Create new rental agreements', category: 'Rentals' },
  { id: 'rentals_edit', name: 'Edit Rentals', description: 'Modify rental agreements', category: 'Rentals' },
  { id: 'rentals_cancel', name: 'Cancel Rentals', description: 'Cancel rental agreements', category: 'Rentals' },
  { id: 'sales_view', name: 'View Sales', description: 'View sales records', category: 'Sales' },
  { id: 'sales_create', name: 'Create Sales', description: 'Process new sales', category: 'Sales' },
  { id: 'sales_edit', name: 'Edit Sales', description: 'Modify sales records', category: 'Sales' },
  { id: 'sales_delete', name: 'Delete Sales', description: 'Remove sales records', category: 'Sales' },
  { id: 'customers_view', name: 'View Customers', description: 'View customer information', category: 'Customers' },
  { id: 'customers_create', name: 'Create Customers', description: 'Add new customers', category: 'Customers' },
  { id: 'customers_edit', name: 'Edit Customers', description: 'Modify customer information', category: 'Customers' },
  { id: 'customers_delete', name: 'Delete Customers', description: 'Remove customer records', category: 'Customers' },
  { id: 'invoices_view', name: 'View Invoices', description: 'View invoices and payments', category: 'Invoices' },
  { id: 'invoices_create', name: 'Create Invoices', description: 'Generate new invoices', category: 'Invoices' },
  { id: 'invoices_edit', name: 'Edit Invoices', description: 'Modify invoices', category: 'Invoices' },
  { id: 'invoices_delete', name: 'Delete Invoices', description: 'Remove invoices', category: 'Invoices' },
  { id: 'reports_view', name: 'View Reports', description: 'Access reports and analytics', category: 'Reports' },
  { id: 'reports_export', name: 'Export Reports', description: 'Download and export reports', category: 'Reports' },
  { id: 'users_view', name: 'View Users', description: 'View user accounts', category: 'Users' },
  { id: 'users_create', name: 'Create Users', description: 'Add new user accounts', category: 'Users' },
  { id: 'users_edit', name: 'Edit Users', description: 'Modify user accounts', category: 'Users' },
  { id: 'users_delete', name: 'Delete Users', description: 'Remove user accounts', category: 'Users' },
  { id: 'users_permissions', name: 'Manage Permissions', description: 'Modify user permissions', category: 'Users' },
  { id: 'settings_view', name: 'View Settings', description: 'Access system settings', category: 'Settings' },
  { id: 'settings_edit', name: 'Edit Settings', description: 'Modify system settings', category: 'Settings' },
];

const getInitialPermissions = (roleTitle: string): string[] => {
  const rolePerms = ROLE_PERMISSION_MAP[roleTitle];
  if (!rolePerms) return [];
  if (rolePerms.includes('all')) return availablePermissions.map(p => p.id);
  return rolePerms;
};

export const RoleManagement: React.FC<RoleManagementProps> = ({ user, onSave, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState<string>(user.role_title || 'Staff');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    getInitialPermissions(user.role_title || 'Staff')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) acc[permission.category] = [];
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categories = Object.keys(groupedPermissions);

  // When role changes, auto-populate permissions based on role defaults
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setSelectedPermissions(getInitialPermissions(role));
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId) ? prev.filter(id => id !== permissionId) : [...prev, permissionId]
    );
  };

  const toggleCategoryAll = (category: string) => {
    const categoryIds = groupedPermissions[category].map(p => p.id);
    const allSelected = categoryIds.every(id => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryIds.includes(id)));
    } else {
      setSelectedPermissions(prev => {
        const next = [...prev];
        categoryIds.forEach(id => { if (!next.includes(id)) next.push(id); });
        return next;
      });
    }
  };

  const selectAll = () => setSelectedPermissions(availablePermissions.map(p => p.id));
  const deselectAll = () => setSelectedPermissions([]);

  const isCategoryFullySelected = (category: string) =>
    groupedPermissions[category].every(p => selectedPermissions.includes(p.id));

  const isCategoryPartiallySelected = (category: string) => {
    const ids = groupedPermissions[category].map(p => p.id);
    const count = ids.filter(id => selectedPermissions.includes(id)).length;
    return count > 0 && count < ids.length;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      // Save the role_title back to the backend
      await updateUserApi(user.id, { role_title: selectedRole });
      onSave();
    } catch (err: any) {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to save permissions.';
      setError(msg as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-1">Manage Permissions</h2>
          <p className="text-sm text-neutral-600">
            Configure access permissions for{' '}
            <span className="font-medium">{user.full_name || user.username}</span>
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Role Selector */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Role — changes will auto-populate default permissions below
        </label>
        <select
          value={selectedRole}
          onChange={e => handleRoleChange(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.keys(ROLE_PERMISSION_MAP).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={selectAll}
          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={deselectAll}
          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium"
        >
          Deselect All
        </button>
        <div className="ml-auto text-sm text-neutral-600">
          <span className="font-medium">{selectedPermissions.length}</span> of{' '}
          <span className="font-medium">{availablePermissions.length}</span> selected
        </div>
      </div>

      {/* Permissions by Category */}
      <div className="max-h-[460px] overflow-y-auto space-y-4 pr-1">
        {categories.map(category => (
          <div key={category} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            {/* Category Header */}
            <div
              className="flex items-center justify-between p-4 bg-neutral-50 border-b border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => toggleCategoryAll(category)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                  isCategoryFullySelected(category)
                    ? 'bg-blue-600 border-blue-600'
                    : isCategoryPartiallySelected(category)
                    ? 'bg-blue-200 border-blue-600'
                    : 'border-neutral-300'
                }`}>
                  {(isCategoryFullySelected(category) || isCategoryPartiallySelected(category)) && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">{category}</h3>
                  <p className="text-xs text-neutral-500">
                    {groupedPermissions[category].filter(p => selectedPermissions.includes(p.id)).length} of{' '}
                    {groupedPermissions[category].length} selected
                  </p>
                </div>
              </div>
              <Shield className="w-5 h-5 text-neutral-400" />
            </div>

            {/* Permission Items */}
            <div className="p-4 space-y-3">
              {groupedPermissions[category].map(permission => (
                <div
                  key={permission.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => togglePermission(permission.id)}
                >
                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center mt-0.5 flex-shrink-0 ${
                    selectedPermissions.includes(permission.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-neutral-300'
                  }`}>
                    {selectedPermissions.includes(permission.id) && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-neutral-900">{permission.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{permission.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-200">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Permissions
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

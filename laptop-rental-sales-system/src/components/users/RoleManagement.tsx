import React, { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RoleManagementProps {
  user: any;
  onSave: (permissions: string[]) => void;
  onCancel: () => void;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({ user, onSave, onCancel }) => {
  // Available permissions grouped by category
  const availablePermissions: Permission[] = [
    // Dashboard
    { id: 'dashboard_view', name: 'View Dashboard', description: 'Access main dashboard and analytics', category: 'Dashboard' },
    
    // Inventory
    { id: 'inventory_view', name: 'View Inventory', description: 'View laptop inventory', category: 'Inventory' },
    { id: 'inventory_create', name: 'Create Inventory', description: 'Add new laptops to inventory', category: 'Inventory' },
    { id: 'inventory_edit', name: 'Edit Inventory', description: 'Modify existing inventory items', category: 'Inventory' },
    { id: 'inventory_delete', name: 'Delete Inventory', description: 'Remove items from inventory', category: 'Inventory' },
    
    // Rentals
    { id: 'rentals_view', name: 'View Rentals', description: 'View rental records', category: 'Rentals' },
    { id: 'rentals_create', name: 'Create Rentals', description: 'Create new rental agreements', category: 'Rentals' },
    { id: 'rentals_edit', name: 'Edit Rentals', description: 'Modify rental agreements', category: 'Rentals' },
    { id: 'rentals_cancel', name: 'Cancel Rentals', description: 'Cancel rental agreements', category: 'Rentals' },
    
    // Sales
    { id: 'sales_view', name: 'View Sales', description: 'View sales records', category: 'Sales' },
    { id: 'sales_create', name: 'Create Sales', description: 'Process new sales', category: 'Sales' },
    { id: 'sales_edit', name: 'Edit Sales', description: 'Modify sales records', category: 'Sales' },
    { id: 'sales_delete', name: 'Delete Sales', description: 'Remove sales records', category: 'Sales' },
    
    // Customers
    { id: 'customers_view', name: 'View Customers', description: 'View customer information', category: 'Customers' },
    { id: 'customers_create', name: 'Create Customers', description: 'Add new customers', category: 'Customers' },
    { id: 'customers_edit', name: 'Edit Customers', description: 'Modify customer information', category: 'Customers' },
    { id: 'customers_delete', name: 'Delete Customers', description: 'Remove customer records', category: 'Customers' },
    
    // Invoices
    { id: 'invoices_view', name: 'View Invoices', description: 'View invoices and payments', category: 'Invoices' },
    { id: 'invoices_create', name: 'Create Invoices', description: 'Generate new invoices', category: 'Invoices' },
    { id: 'invoices_edit', name: 'Edit Invoices', description: 'Modify invoices', category: 'Invoices' },
    { id: 'invoices_delete', name: 'Delete Invoices', description: 'Remove invoices', category: 'Invoices' },
    
    // Reports
    { id: 'reports_view', name: 'View Reports', description: 'Access reports and analytics', category: 'Reports' },
    { id: 'reports_export', name: 'Export Reports', description: 'Download and export reports', category: 'Reports' },
    
    // Users
    { id: 'users_view', name: 'View Users', description: 'View user accounts', category: 'Users' },
    { id: 'users_create', name: 'Create Users', description: 'Add new user accounts', category: 'Users' },
    { id: 'users_edit', name: 'Edit Users', description: 'Modify user accounts', category: 'Users' },
    { id: 'users_delete', name: 'Delete Users', description: 'Remove user accounts', category: 'Users' },
    { id: 'users_permissions', name: 'Manage Permissions', description: 'Modify user permissions', category: 'Users' },
    
    // Settings
    { id: 'settings_view', name: 'View Settings', description: 'Access system settings', category: 'Settings' },
    { id: 'settings_edit', name: 'Edit Settings', description: 'Modify system settings', category: 'Settings' },
  ];

  // Get initial permissions based on user's current permissions
  const getInitialPermissions = () => {
    if (user.permissions.includes('all')) {
      return availablePermissions.map(p => p.id);
    }
    return user.permissions || [];
  };

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(getInitialPermissions());

  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categories = Object.keys(groupedPermissions);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const toggleCategoryAll = (category: string) => {
    const categoryPermissions = groupedPermissions[category].map(p => p.id);
    const allSelected = categoryPermissions.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      // Remove all category permissions
      setSelectedPermissions(prev => prev.filter(id => !categoryPermissions.includes(id)));
    } else {
      // Add all category permissions
      setSelectedPermissions(prev => {
        const newPermissions = [...prev];
        categoryPermissions.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
        return newPermissions;
      });
    }
  };

  const selectAll = () => {
    setSelectedPermissions(availablePermissions.map(p => p.id));
  };

  const deselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = () => {
    onSave(selectedPermissions);
  };

  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = groupedPermissions[category].map(p => p.id);
    return categoryPermissions.every(id => selectedPermissions.includes(id));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = groupedPermissions[category].map(p => p.id);
    const selectedCount = categoryPermissions.filter(id => selectedPermissions.includes(id)).length;
    return selectedCount > 0 && selectedCount < categoryPermissions.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-1">Manage Permissions</h2>
          <p className="text-sm text-neutral-600">
            Configure access permissions for <span className="font-medium">{user.name}</span> ({user.role})
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
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
          <span className="font-medium">{availablePermissions.length}</span> permissions selected
        </div>
      </div>

      {/* Permissions by Category */}
      <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
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

            {/* Permissions List */}
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
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Save Permissions
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

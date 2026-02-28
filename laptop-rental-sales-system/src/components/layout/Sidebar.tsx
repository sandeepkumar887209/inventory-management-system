import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Laptop,
  Calendar,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Inventory", icon: Laptop, path: "/inventory" },
  { label: "Rentals", icon: Calendar, path: "/rentals" },
  { label: "Sales", icon: ShoppingCart, path: "/sales" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Invoices", icon: FileText, path: "/invoices" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Users & Roles", icon: UserCog, path: "/users" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 transition-all duration-300 z-40 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Laptop className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-neutral-900">LaptopRent</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Laptop className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute bottom-4 right-3 w-8 h-8 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-neutral-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-neutral-600" />
        )}
      </button>
    </aside>
  );
}

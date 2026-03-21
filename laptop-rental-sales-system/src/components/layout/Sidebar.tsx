import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Laptop,
  Calendar,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  Building2,
  Users2,
  TrendingUp,
  Receipt,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  Bell,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

type Module = "erp" | "crm" | "accounts";

const MODULES = [
  {
    key: "erp" as Module,
    label: "ERP",
    description: "Operations & Sales",
    icon: Briefcase,
    iconBg: "bg-blue-600",
    activeBg: "bg-blue-50",
    activeText: "text-blue-600",
    defaultPath: "/",
  },
  {
    key: "crm" as Module,
    label: "CRM",
    description: "Leads & Pipeline",
    icon: Users2,
    iconBg: "bg-purple-600",
    activeBg: "bg-purple-50",
    activeText: "text-purple-600",
    defaultPath: "/crm/leads",
  },
  {
    key: "accounts" as Module,
    label: "Accounts",
    description: "Billing & Finance",
    icon: BookOpen,
    iconBg: "bg-green-600",
    activeBg: "bg-green-50",
    activeText: "text-green-600",
    defaultPath: "/accounts",
  },
];

const MENUS: Record<
  Module,
  { label: string; icon: React.ElementType; path: string }[]
> = {
  erp: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Inventory", icon: Laptop, path: "/inventory" },
    { label: "Rentals", icon: Calendar, path: "/rentals" },
    { label: "Sales", icon: ShoppingCart, path: "/sales" },
    { label: "Customers", icon: Users, path: "/customers" },
    { label: "Suppliers", icon: Building2, path: "/inventory/suppliers" },
    { label: "Reports", icon: BarChart3, path: "/reports" },
  ],
  crm: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/crm" },
    { label: "Leads", icon: Users2, path: "/crm/leads" },
    { label: "Pipeline", icon: TrendingUp, path: "/crm/pipeline" },
    { label: "Activities", icon: Activity, path: "/crm/activities" },
    { label: "Follow-ups", icon: Bell, path: "/crm/followups" },
  ],
  accounts: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/accounts" },
    { label: "Invoices", icon: FileText, path: "/accounts/invoices" },
    { label: "Payments", icon: Receipt, path: "/accounts/payments" },
    { label: "Ledger", icon: BookOpen, path: "/accounts/ledger" },
    { label: "Reports", icon: BarChart3, path: "/accounts/reports" },
  ],
};

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeModule, setActiveModule] = useState<Module>("erp");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.pathname.startsWith("/crm")) setActiveModule("crm");
    else if (location.pathname.startsWith("/accounts"))
      setActiveModule("accounts");
    else setActiveModule("erp");
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const mod = MODULES.find((m) => m.key === activeModule)!;
  const ModIcon = mod.icon;
  const menuItems = MENUS[activeModule];

  const isActive = (path: string) => {
    if (path === "/" || path === "/crm" || path === "/accounts")
      return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const switchModule = (key: Module) => {
    setDropdownOpen(false);
    navigate(MODULES.find((m) => m.key === key)!.defaultPath);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 transition-all duration-300 z-40 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand */}
      <div className="h-14 flex items-center border-b border-neutral-200 px-4">
        {!collapsed ? (
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mr. Laptop
          </h1>
        ) : (
          <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-lg font-bold">
            ML
          </div>
        )}
      </div>

      {/* Module Switcher */}
      <div ref={dropdownRef} className="relative border-b border-neutral-200">
        <button
          onClick={() => !collapsed && setDropdownOpen((o) => !o)}
          className={`w-full h-16 flex items-center gap-3 hover:bg-neutral-50 ${
            collapsed ? "justify-center" : "px-4 justify-between"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mod.iconBg}`}>
              <ModIcon className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <p className="font-bold text-sm">{mod.label}</p>
                <p className="text-xs text-neutral-500">{mod.description}</p>
              </div>
            )}
          </div>
          {!collapsed && <ChevronDown className="w-4 h-4" />}
        </button>

        {dropdownOpen && !collapsed && (
          <div className="absolute w-full bg-white border shadow-lg">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => switchModule(m.key)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50"
                >
                  <Icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                active ? `${mod.activeBg} ${mod.activeText}` : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse */}
      <button
        onClick={onToggleCollapse}
        className="absolute bottom-4 right-3 w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center"
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>
    </aside>
  );
}
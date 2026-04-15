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
  ChevronLeft,
  ChevronRight,
  Activity,
  Bell,
  ChevronDown,
  Check,
  Zap,
  TestTube2,
} from "lucide-react";

type Module = "erp" | "crm" | "accounts";

const MODULES: {
  key: Module;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  accentBg: string;
  accentBorder: string;
  defaultPath: string;
}[] = [
  {
    key: "erp",
    label: "ERP",
    description: "Operations & Sales",
    icon: Briefcase,
    accent: "#2563eb",
    accentBg: "#eff6ff",
    accentBorder: "#bfdbfe",
    defaultPath: "/",
  },
  {
    key: "crm",
    label: "CRM",
    description: "Leads & Pipeline",
    icon: Users2,
    accent: "#7c3aed",
    accentBg: "#f5f3ff",
    accentBorder: "#ddd6fe",
    defaultPath: "/crm/leads",
  },
  {
    key: "accounts",
    label: "Accounts",
    description: "Billing & Finance",
    icon: BookOpen,
    accent: "#059669",
    accentBg: "#ecfdf5",
    accentBorder: "#a7f3d0",
    defaultPath: "/accounts",
  },
];

const MENUS: Record<
  Module,
  { label: string; icon: React.ElementType; path: string; badge?: string }[]
> = {
  erp: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/"                    },
    { label: "Inventory", icon: Laptop,          path: "/inventory"            },
    { label: "Rentals",   icon: Calendar,         path: "/rentals"              },
    { label: "Demos",     icon: TestTube2,        path: "/demos"                },
    { label: "Sales",     icon: ShoppingCart,     path: "/sales"                },
    { label: "Customers", icon: Users,            path: "/customers"            },
    { label: "Suppliers", icon: Building2,        path: "/inventory/suppliers"  },
    { label: "Reports",   icon: BarChart3,         path: "/reports"              },
  ],
  crm: [
    { label: "Dashboard",  icon: LayoutDashboard, path: "/crm"                  },
    { label: "Leads",      icon: Users2,           path: "/crm/leads"            },
    { label: "Pipeline",   icon: TrendingUp,       path: "/crm/pipeline"         },
    { label: "Activities", icon: Activity,         path: "/crm/activities"       },
    { label: "Follow-ups", icon: Bell,             path: "/crm/followups", badge: "3" },
  ],
  accounts: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/accounts"             },
    { label: "Invoices",  icon: FileText,         path: "/accounts/invoices"    },
    { label: "Payments",  icon: Receipt,          path: "/accounts/payments"    },
    { label: "Ledger",    icon: BookOpen,         path: "/accounts/ledger"      },
    { label: "Reports",   icon: BarChart3,         path: "/accounts/reports"     },
  ],
};

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState<Module>("erp");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-switch module based on current path
  useEffect(() => {
    if (location.pathname.startsWith("/crm")) {
      setActiveModule("crm");
    } else if (location.pathname.startsWith("/accounts")) {
      setActiveModule("accounts");
    } else {
      setActiveModule("erp");
    }
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
    if (path === "/" || path === "/crm" || path === "/accounts") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const switchModule = (key: Module) => {
    setDropdownOpen(false);
    navigate(MODULES.find((m) => m.key === key)!.defaultPath);
  };

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: collapsed ? "72px" : "256px",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 40,
        overflow: "hidden",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      {/* Accent stripe */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "3px",
          background: `linear-gradient(90deg, ${mod.accent}, ${mod.accent}55)`,
          transition: "background 0.3s ease",
          zIndex: 1,
        }}
      />

      {/* Logo */}
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 20px" : "0 18px",
          borderBottom: "1px solid #f3f4f6",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: mod.accent, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0, transition: "background 0.3s",
          }}
        >
          <Laptop size={17} color="#fff" strokeWidth={2.2} />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827", letterSpacing: "-0.3px", whiteSpace: "nowrap", lineHeight: 1.2 }}>
              Mr. Laptop
            </div>
            <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500, letterSpacing: "0.3px", textTransform: "uppercase" }}>
              Management Suite
            </div>
          </div>
        )}
      </div>

      {/* Module switcher */}
      <div
        ref={dropdownRef}
        style={{
          padding: collapsed ? "10px" : "10px 12px",
          borderBottom: "1px solid #f3f4f6",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <button
          onClick={() => !collapsed && setDropdownOpen((o) => !o)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: collapsed ? "7px" : "8px 10px",
            borderRadius: "10px",
            background: mod.accentBg,
            border: `1px solid ${mod.accentBorder}`,
            cursor: collapsed ? "default" : "pointer",
            transition: "all 0.15s",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: "28px", height: "28px", borderRadius: "7px",
              background: mod.accent, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0, transition: "background 0.3s",
            }}
          >
            <ModIcon size={14} color="#fff" />
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>
                  {mod.label}
                </div>
                <div style={{ fontSize: "10px", color: "#6b7280" }}>{mod.description}</div>
              </div>
              <ChevronDown
                size={13}
                color="#9ca3af"
                style={{
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  flexShrink: 0,
                }}
              />
            </>
          )}
        </button>

        {/* Module dropdown */}
        {dropdownOpen && !collapsed && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% - 2px)",
              left: "12px",
              right: "12px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              overflow: "hidden",
              zIndex: 100,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            {MODULES.map((m, i) => {
              const Icon = m.icon;
              const active = m.key === activeModule;
              return (
                <button
                  key={m.key}
                  onClick={() => switchModule(m.key)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    background: active ? m.accentBg : "transparent",
                    border: "none",
                    borderBottom: i < MODULES.length - 1 ? "1px solid #f9fafb" : "none",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: "28px", height: "28px", borderRadius: "7px",
                      background: active ? m.accent : "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                  >
                    <Icon size={13} color={active ? "#fff" : "#6b7280"} />
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: "13px", fontWeight: active ? 600 : 500, color: active ? "#111827" : "#374151", lineHeight: 1.2 }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: "10px", color: "#9ca3af" }}>{m.description}</div>
                  </div>
                  {active && <Check size={13} color={m.accent} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section label */}
      {!collapsed && (
        <div style={{ padding: "14px 16px 4px", fontSize: "10px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.7px", textTransform: "uppercase" }}>
          Menu
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: collapsed ? "8px" : "4px 10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : "10px",
                  padding: collapsed ? "10px" : "8px 10px",
                  borderRadius: "9px",
                  background: active ? mod.accentBg : "transparent",
                  border: "none",
                  cursor: "pointer",
                  justifyContent: collapsed ? "center" : "flex-start",
                  transition: "background 0.12s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "55%",
                      borderRadius: "0 3px 3px 0",
                      background: mod.accent,
                    }}
                  />
                )}

                <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon
                    size={16}
                    color={active ? mod.accent : "#6b7280"}
                    strokeWidth={active ? 2.5 : 2}
                    style={{ transition: "all 0.12s" }}
                  />
                </div>

                {!collapsed && (
                  <>
                    <span
                      style={{
                        fontSize: "13.5px",
                        fontWeight: active ? 600 : 400,
                        color: active ? "#111827" : "#374151",
                        flex: 1,
                        textAlign: "left",
                        letterSpacing: "-0.1px",
                        transition: "color 0.12s",
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: "10px", fontWeight: 700, color: "#fff",
                          background: "#ef4444", borderRadius: "99px",
                          padding: "1px 6px", lineHeight: "16px", flexShrink: 0,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Collapsed badge dot */}
                {collapsed && item.badge && (
                  <div
                    style={{
                      position: "absolute", top: "7px", right: "7px",
                      width: "7px", height: "7px", borderRadius: "50%",
                      background: "#ef4444", border: "1.5px solid #fff",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Divider */}
      <div style={{ height: "1px", background: "#f3f4f6", margin: "0 10px", flexShrink: 0 }} />

      {/* Bottom */}
      <div style={{ padding: collapsed ? "10px 8px" : "10px 12px", flexShrink: 0 }}>
        {!collapsed && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "7px 10px", borderRadius: "8px",
              background: "#f9fafb", border: "1px solid #f3f4f6",
              marginBottom: "8px",
            }}
          >
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "#6b7280", flex: 1 }}>System Online</span>
            <Zap size={11} color="#d1d5db" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "9px" : "8px 10px",
            borderRadius: "8px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            cursor: "pointer",
            transition: "background 0.15s",
            gap: "8px",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f3f4f6"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f9fafb"; }}
        >
          {!collapsed && (
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>
              Collapse sidebar
            </span>
          )}
          {collapsed
            ? <ChevronRight size={14} color="#9ca3af" />
            : <ChevronLeft  size={14} color="#9ca3af" />
          }
        </button>
      </div>
    </aside>
  );
}
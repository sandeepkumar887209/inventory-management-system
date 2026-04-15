import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, List, Plus, Building2, Wrench } from "lucide-react";

import { InventoryDashboard } from "./InventoryDashboard";
import { InventoryList }      from "./InventoryList";
import { LaptopForm }         from "./LaptopForm";
import { LaptopDetail }       from "./LaptopDetail";
import { SupplierPage }       from "./SupplierPage";
import { MaintenancePage }    from "./MaintenancePage";
import { Modal }              from "./ui";
import api                    from "../../services/axios";

/* ── Tab definition ── */
const TABS = [
  { id: "dashboard",   label: "Dashboard",   icon: LayoutDashboard, path: "/inventory"             },
  { id: "list",        label: "All Laptops", icon: List,            path: "/inventory/list"        },
  { id: "add",         label: "Add Laptop",  icon: Plus,            path: "/inventory/new"         },
  { id: "suppliers",   label: "Suppliers",   icon: Building2,       path: "/inventory/suppliers"   },
  { id: "maintenance", label: "Maintenance", icon: Wrench,          path: "/inventory/maintenance" },
];

export function InventoryModule() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [refresh, setRefresh] = useState(0);
  const [modal,   setModal]   = useState<null | "add" | "edit">(null);
  const [editItem,setEditItem]= useState<any>(null);

  const bump = () => setRefresh((k) => k + 1);

  /* ── Determine active tab from current URL ── */
  const activeTab =
    TABS.find((t) =>
      t.path === "/inventory"
        ? location.pathname === "/inventory" || location.pathname === "/inventory/"
        : location.pathname.startsWith(t.path)
    )?.id ?? "dashboard";

  /* ── Modal helpers ── */
  const openAdd   = () => { setEditItem(null); setModal("add"); };
  const openEdit  = (item: any) => { setEditItem(item); setModal("edit"); };
  const closeModal= () => { setModal(null); setEditItem(null); };

  const handleSubmit = async (data: any) => {
    if (editItem) {
      await api.put(`/inventory/laptops/${editItem.id}/`, data);
    } else {
      await api.post("/inventory/laptops/", data);
    }
    closeModal();
    bump();
  };

  /* ── Decide which page to render based on pathname ── */
  const renderPage = () => {
    const p = location.pathname;

    // Detail page: /inventory/<numeric-id>
    // Must check before generic prefix checks
    const detailMatch = p.match(/^\/inventory\/(\d+)$/);
    if (detailMatch) {
      return <LaptopDetail />;
    }

    if (p === "/inventory/list" || p === "/inventory/new") {
      return (
        <InventoryList
          key={refresh}
          onAddNew={openAdd}
          onEdit={openEdit}
        />
      );
    }

    if (p.startsWith("/inventory/suppliers")) {
      return <SupplierPage />;
    }

    if (p.startsWith("/inventory/maintenance")) {
      return <MaintenancePage key={refresh} onNavigate={navigate} />;
    }

    // Default: dashboard (matches /inventory and /inventory/)
    return <InventoryDashboard key={refresh} onNavigate={navigate} />;
  };

  /* ── Hide tab nav on detail pages ── */
  const isDetailPage = /^\/inventory\/\d+$/.test(location.pathname);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5" }}>

      {/* ── Top nav (hidden on detail pages) ── */}
      {!isDetailPage && (
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e8e6e1",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          {TABS.map((tab) => {
            const Icon     = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "add") {
                    if (!location.pathname.startsWith("/inventory/list")) {
                      navigate("/inventory/list");
                    }
                    setTimeout(openAdd, 50);
                  } else {
                    navigate(tab.path);
                  }
                }}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "7px",
                  padding:      "14px 16px",
                  border:       "none",
                  borderBottom: isActive ? "2px solid #1a6ef5" : "2px solid transparent",
                  background:   "transparent",
                  cursor:       "pointer",
                  fontSize:     "13px",
                  fontWeight:   isActive ? 500 : 400,
                  color:        isActive ? "#1a6ef5" : "#6b6b6b",
                  whiteSpace:   "nowrap",
                  transition:   "color 0.15s, border-color 0.15s",
                  marginBottom: "-1px",
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Page content ── */}
      <div style={{ padding: "28px 28px 48px" }}>
        {renderPage()}
      </div>

      {/* ── Add / Edit modal ── */}
      {modal && (
        <Modal
          title={modal === "edit"
            ? `Edit — ${editItem?.brand} ${editItem?.model}`
            : "Add New Laptop"}
          subtitle={modal === "edit"
            ? `S/N: ${editItem?.serial_number}`
            : "Fill in the details to add a new laptop to inventory"}
          onClose={closeModal}
          width="820px"
        >
          <LaptopForm
            laptop={editItem}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}
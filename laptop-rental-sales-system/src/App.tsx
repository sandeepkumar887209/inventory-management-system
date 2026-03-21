import { Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "./services/axios";

/* Layout */
import { Sidebar } from "./components/layout/Sidebar";
import { Header }  from "./components/layout/Header";
import { Modal }   from "./components/common/Modal";

/* Auth */
import Login       from "./components/auth/Login";
import RequireAuth from "./components/auth/RequireAuth";

/* ── ERP ── */
import { Dashboard }         from "./components/dashboard/Dashboard";
import { InventoryList }     from "./components/inventory/InventoryList";
import { LaptopForm }        from "./components/inventory/LaptopForm";
import { LaptopDetail }      from "./components/inventory/LaptopDetail";
import { SupplierPage }      from "./components/inventory/SupplierPage";
import { RentalModule }      from "./components/rentals/RentalModule";
import { CustomerList }      from "./components/customers/CustomerList";
import { CustomerDetail }    from "./components/customers/CustomerDetail";
import { CustomerForm }      from "./components/customers/CustomerForm";
import { SalesList }         from "./components/sales/SalesList";
import { SaleDetail }        from "./components/sales/SaleDetail";
import { CreateSale }        from "./components/sales/CreateSale";
import { ReportsAnalytics }  from "./components/reports/ReportsAnalytics";
import { Settings }          from "./components/settings/Settings";

/* ── CRM ── */
import { CRMPage } from "./components/crm/CRMPage";

/* ── Coming Soon placeholder ── */
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-1">{title}</h2>
      <p className="text-neutral-600">This module is coming soon.</p>
    </div>
  );
}

export default function App() {
  const [sidebarCollapsed,   setSidebarCollapsed]   = useState(false);
  const [modalOpen,          setModalOpen]          = useState(false);
  const [modalType,          setModalType]          = useState<"laptop" | null>(null);
  const [editingItem,        setEditingItem]        = useState<any>(null);
  const [refreshKey,         setRefreshKey]         = useState(0);
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);

  const navigate = useNavigate();

  const openModal = (type: "laptop", item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setEditingItem(null);
  };

  const handleLaptopSubmit = async (data: any) => {
    try {
      if (editingItem?.id) {
        await api.put(`/inventory/laptops/${editingItem.id}/`, data);
      } else {
        await api.post("/inventory/laptops/", data);
      }
      closeModal();
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to save laptop");
    }
  };

  return (
    <>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route element={<RequireAuth />}>
          <Route
            element={
              <Layout
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebar={() => setSidebarCollapsed((c) => !c)}
              />
            }
          >

            {/* ══ ERP ══════════════════════════════ */}
            <Route path="/" element={<Dashboard />} />

            {/* Inventory */}
            <Route
              path="/inventory"
              element={
                <InventoryList
                  refreshKey={refreshKey}
                  onAddNew={() => openModal("laptop")}
                  onEdit={(item) => openModal("laptop", item)}
                  onView={(item) => navigate(`/inventory/${item.id}`)}
                />
              }
            />
            <Route path="/inventory/:id"       element={<LaptopDetail />} />
            <Route path="/inventory/suppliers" element={<SupplierPage />} />

            {/* ── Rentals — all handled by RentalModule ── */}
            <Route path="/rentals/*" element={<RentalModule />} />

            {/* Sales */}
            <Route
              path="/sales"
              element={
                <SalesList
                  onCreateNew={() => navigate("/sales/new")}
                  onViewInvoice={(sale) => navigate(`/sales/${sale.id}`)}
                />
              }
            />
            <Route path="/sales/new" element={<CreateSale />} />
            <Route path="/sales/:id" element={<SaleDetail />} />

            {/* Customers */}
            <Route
              path="/customers"
              element={
                <CustomerList
                  key={customerRefreshKey}
                  onAddNew={() => navigate("/customers/new")}
                  onViewDetails={(c) => navigate(`/customers/${c.id}`)}
                />
              }
            />
            <Route
              path="/customers/new"
              element={
                <CustomerForm
                  onSuccess={() => {
                    setCustomerRefreshKey((k) => k + 1);
                    navigate("/customers");
                  }}
                />
              }
            />
            <Route path="/customers/:id" element={<CustomerDetail />} />

            {/* ERP extras */}
            <Route path="/stock"    element={<ComingSoon title="Stock Management" />} />
            <Route path="/invoices" element={<ComingSoon title="Invoices" />} />
            <Route path="/reports"  element={<ReportsAnalytics />} />

            {/* ══ CRM ══════════════════════════════ */}
            <Route path="/crm/*" element={<CRMPage />} />

            {/* ══ ACCOUNTS ═════════════════════════ */}
            <Route path="/accounts"          element={<ComingSoon title="Accounts Dashboard" />} />
            <Route path="/accounts/invoices" element={<ComingSoon title="Billing Invoices" />} />
            <Route path="/accounts/payments" element={<ComingSoon title="Payment Tracking" />} />
            <Route path="/accounts/ledger"   element={<ComingSoon title="Customer Ledger" />} />
            <Route path="/accounts/reports"  element={<ComingSoon title="Financial Reports" />} />

            {/* ══ ADMIN ════════════════════════════ */}
            <Route path="/users"    element={<ComingSoon title="Users & Roles" />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile"  element={<ComingSoon title="My Profile" />} />

          </Route>
        </Route>

      </Routes>

      {/* MODAL — laptop only (rentals now live inside RentalModule) */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Laptop" : "Add Laptop"}
      >
        {modalType === "laptop" && (
          <LaptopForm
            laptop={editingItem}
            onSubmit={handleLaptopSubmit}
            onCancel={closeModal}
          />
        )}
      </Modal>
    </>
  );
}

function Layout({ sidebarCollapsed, toggleSidebar }: any) {
  return (
    <div className="min-h-screen bg-neutral-50">

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <Header
        sidebarCollapsed={sidebarCollapsed}
        userName="Admin"
        userRole="Administrator"
        onLogout={() => {
          localStorage.removeItem("access");
          window.location.href = "/login";
        }}
      />

      <main
        className={`pt-16 transition-all ${
          sidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
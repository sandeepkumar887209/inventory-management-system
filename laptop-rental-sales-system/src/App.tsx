import { Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "./services/axios";

/* Layout */
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Modal } from "./components/common/Modal";

/* Pages */
import Login from "./components/auth/Login";
import RequireAuth from "./components/auth/RequireAuth";
import { Dashboard } from "./components/dashboard/Dashboard";
import { InventoryList } from "./components/inventory/InventoryList";
import { LaptopForm } from "./components/inventory/LaptopForm";
import { RentalList } from "./components/rentals/RentalList";
import { CreateRental } from "./components/rentals/CreateRental";
import { RentalDetail } from "./components/rentals/RentalDetail";
import { RentalReturn } from "./components/rentals/RentalReturn";
import { RentalReplacement } from "./components/rentals/RentalReplacement";
import { CustomerList } from "./components/customers/CustomerList";
import { CustomerDetail } from "./components/customers/CustomerDetail";
import { CustomerForm } from "./components/customers/CustomerForm";

import { SalesList } from "./components/sales/SalesList";
import { SaleDetail } from "./components/sales/SaleDetail";
import { CreateSale } from "./components/sales/CreateSale";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [modalType, setModalType] = useState<
    "laptop" | "rental" | "sale" | null
  >(null);

  const [editingItem, setEditingItem] = useState<any>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [rentalRefreshKey, setRentalRefreshKey] = useState(0);
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);

  const navigate = useNavigate();

  const openModal = (type: "laptop" | "rental" | "sale", item?: any) => {
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

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* PROTECTED ROUTES */}
        <Route element={<RequireAuth />}>

          <Route
            element={
              <Layout
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebar={() =>
                  setSidebarCollapsed(!sidebarCollapsed)
                }
              />
            }
          >

            <Route path="/" element={<Dashboard />} />

            {/* INVENTORY */}
            <Route
              path="/inventory"
              element={
                <InventoryList
                  refreshKey={refreshKey}
                  onAddNew={() => openModal("laptop")}
                  onEdit={(item) => openModal("laptop", item)}
                  onView={() => {}}
                />
              }
            />

            {/* SALES */}
            <Route
              path="/sales"
              element={
                <SalesList
                  onCreateNew={() => navigate("/sales/new")}
                  onViewInvoice={(sale) =>
                    navigate(`/sales/${sale.id}`)
                  }
                />
              }
            />
            <Route path="/sales/new" element={<CreateSale />} />

            <Route path="/sales/:id" element={<SaleDetail />} />

            {/* RENTALS */}
            <Route
              path="/rentals"
              element={
                <RentalList
                  refreshKey={rentalRefreshKey}
                  onCreateNew={() => openModal("rental")}
                />
              }
            />

            <Route path="/rentals/:id" element={<RentalDetail />} />
            <Route path="/rental-return" element={<RentalReturn />} />
            <Route path="/rental-replacement" element={<RentalReplacement />} />

            {/* CUSTOMERS */}
            <Route
              path="/customers"
              element={
                <CustomerList
                  key={customerRefreshKey}
                  onAddNew={() => navigate("/customers/new")}
                  onViewDetails={(c) =>
                    navigate(`/customers/${c.id}`)
                  }
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

            <Route
              path="/customers/:id"
              element={<CustomerDetail />}
            />

          </Route>
        </Route>

      </Routes>

      {/* MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={
          modalType === "laptop"
            ? editingItem
              ? "Edit Laptop"
              : "Add Laptop"
            : "Create Rental"
        }
      >

        {modalType === "laptop" && (
          <LaptopForm
            laptop={editingItem}
            onSubmit={handleLaptopSubmit}
            onCancel={closeModal}
          />
        )}

        {modalType === "rental" && (
          <CreateRental
            onSubmit={() => {
              closeModal();
              setRentalRefreshKey((k) => k + 1);
            }}
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
        userRole="Admin"
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
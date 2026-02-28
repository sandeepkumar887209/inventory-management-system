import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import api from "./services/axios";

/* Layout UI */
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

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"laptop" | "rental" | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0); // 🔥 KEY PART
  const [rentalRefreshKey, setRentalRefreshKey] = useState(0);


  const openModal = (type: "laptop" | "rental", item?: any) => {
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
      setRefreshKey((k) => k + 1); // 🔥 FORCE INVENTORY REFRESH
    } catch (err: any) {
      console.error(err.response?.data);
      alert("Failed to save laptop");
    }
  };

  const handleRentalSubmit = async (data: any) => {
    try {
      await api.post("/rentals/", data); // adjust endpoint if needed
      closeModal();
      setRentalRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error(err.response?.data);
      alert("Failed to create rental");
    }
  };


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route
            path="/"
            element={
              <Layout sidebarCollapsed={sidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}>
                <Dashboard />
              </Layout>
            }
          />

            <Route path="/rental-return" element={<RentalReturn />} />
            <Route path="/rental-replacement" element={<RentalReplacement />} />



          <Route
              path="/inventory"
              element={
                <Layout
                  sidebarCollapsed={sidebarCollapsed}
                  toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  <InventoryList
                    refreshKey={refreshKey}   // ✅ PASS AS PROP
                    onAddNew={() => openModal("laptop")}
                    onEdit={(item) => openModal("laptop", item)}
                    onView={() => {}}
                  />
                </Layout>
              }
          />
          <Route path="/rentals/:id" element={<RentalDetail />} />

          <Route
            path="/rentals"
            element={
              <Layout sidebarCollapsed={sidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}>
                <RentalList
                    refreshKey={rentalRefreshKey}
                    onCreateNew={() => openModal("rental")}
                />

              </Layout>
            }
          />
        </Route>
      </Routes>

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
          {/* Laptop Form */}
          {modalType === "laptop" && (
            <LaptopForm
              laptop={editingItem}
              onSubmit={handleLaptopSubmit}
              onCancel={closeModal}
            />
          )}

          {/* Rental Form */}
          {modalType === "rental" && (
            <CreateRental
              onSubmit={() => {
                closeModal();
                setRefreshKey((k) => k + 1);
              }}
              onCancel={closeModal}
            />
          )}
      </Modal>

    </BrowserRouter>
  );
}

function Layout({ children, sidebarCollapsed, toggleSidebar }: any) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <Header
        sidebarCollapsed={sidebarCollapsed}
        userName="Admin"
        userRole="Admin"
        onLogout={() => {
          localStorage.removeItem("access");
          window.location.href = "/login";
        }}
      />
      <main className={`pt-16 transition-all ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

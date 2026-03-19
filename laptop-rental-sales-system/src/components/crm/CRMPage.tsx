import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { List, TrendingUp } from "lucide-react";
import { LeadList } from "./LeadList";
import { LeadDetail } from "./LeadDetail";
import { LeadPipeline } from "./LeadPipeline";
import { LeadForm } from "./LeadForm";
import { Modal } from "../common/Modal";
import { Lead } from "./types";

export function CRMPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isListView = location.pathname === "/crm/leads" || location.pathname === "/crm";
  const isPipelineView = location.pathname === "/crm/pipeline";

  return (
    <>
      {/* Sub-nav for CRM views (only on top-level CRM pages) */}
      {(isListView || isPipelineView) && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate("/crm/leads")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isListView
                ? "bg-blue-600 text-white"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <List className="w-4 h-4" /> List View
          </button>
          <button
            onClick={() => navigate("/crm/pipeline")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPipelineView
                ? "bg-blue-600 text-white"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Pipeline
          </button>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <LeadList
              key={refreshKey}
              onAddNew={() => setModalOpen(true)}
              onViewDetails={(lead: Lead) => navigate(`/crm/leads/${lead.id}`)}
            />
          }
        />
        <Route
          path="/leads"
          element={
            <LeadList
              key={refreshKey}
              onAddNew={() => setModalOpen(true)}
              onViewDetails={(lead: Lead) => navigate(`/crm/leads/${lead.id}`)}
            />
          }
        />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/pipeline" element={<LeadPipeline />} />
      </Routes>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Lead"
      >
        <LeadForm
          onSuccess={() => {
            setModalOpen(false);
            setRefreshKey((k) => k + 1);
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}

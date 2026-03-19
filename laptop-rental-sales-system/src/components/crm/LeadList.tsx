import React, { useEffect, useState } from "react";
import {
  Search, Plus, Phone, Mail, Calendar,
  TrendingUp, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { Lead } from "./types";

interface LeadListProps {
  onAddNew: () => void;
  onViewDetails: (lead: Lead) => void;
}

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  NEW: "info",
  CONTACTED: "warning",
  NEGOTIATION: "neutral",
  CONVERTED: "success",
  LOST: "danger",
};

const INTENT_LABELS: Record<string, string> = {
  RENT: "Rent",
  BUY: "Buy",
  BOTH: "Rent + Buy",
};

const SOURCE_LABELS: Record<string, string> = {
  WALK_IN: "Walk In",
  REFERRAL: "Referral",
  SOCIAL_MEDIA: "Social Media",
  WEBSITE: "Website",
  COLD_CALL: "Cold Call",
  OTHER: "Other",
};

const ITEMS_PER_PAGE = 10;

export function LeadList({ onAddNew, onViewDetails }: LeadListProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/crm/leads/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setLeads(data);
    } catch {
      setError("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await api.delete(`/crm/leads/${id}/`);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch {
      alert("Failed to delete lead.");
    }
  };

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      (l.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.company || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchIntent = intentFilter === "all" || l.intent === intentFilter;
    return matchSearch && matchStatus && matchIntent;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (loading) return <div className="p-6 text-neutral-600">Loading leads...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lead Management</h1>
          <p className="text-neutral-600">{filtered.length} leads found</p>
        </div>
        <Button onClick={onAddNew}>
          <Plus className="w-4 h-4 mr-1 inline" /> Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search name, phone, email, company..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <select
            className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>

          <select
            className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={intentFilter}
            onChange={(e) => { setIntentFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Intents</option>
            <option value="RENT">Rent</option>
            <option value="BUY">Buy</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Intent</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Follow-up</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">
                  No leads found.
                </td>
              </tr>
            ) : (
              paginated.map((lead) => (
                <tr key={lead.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">{lead.name}</div>
                    {lead.company && (
                      <div className="text-sm text-neutral-500">{lead.company}</div>
                    )}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {lead.tags?.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 text-xs rounded-full text-white font-medium"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-neutral-700">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" /> {lead.phone}
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-1 text-sm text-neutral-500 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" /> {lead.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-neutral-700">{INTENT_LABELS[lead.intent]}</span>
                    <div className="text-xs text-neutral-400">{lead.expected_laptops} laptop(s)</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{SOURCE_LABELS[lead.source]}</td>
                  <td className="px-6 py-4">
                    <Badge variant={STATUS_VARIANTS[lead.status]}>{lead.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {lead.follow_up_date ? (
                      <div className="flex items-center gap-1 text-sm text-neutral-700">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {formatDate(lead.follow_up_date)}
                      </div>
                    ) : (
                      <span className="text-neutral-400 text-sm">—</span>
                    )}
                    {(lead.pending_followups ?? 0) > 0 && (
                      <div className="text-xs text-orange-500 mt-0.5">
                        {lead.pending_followups} pending
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onViewDetails(lead)}>
                      View
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(lead.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200">
            <span className="text-sm text-neutral-600">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                className="p-1 disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-1 disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

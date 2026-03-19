import React, { useEffect, useState } from "react";
import {
  Search, Plus, Eye, Edit2, ChevronLeft, ChevronRight,
  MoreVertical, Wrench, RotateCcw, AlertTriangle, Package,
  Monitor, ShoppingCart, CheckCircle, Building2,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import api from "../../services/axios";

export interface Laptop {
  id: number;
  asset_tag: string;
  brand: string;
  model: string;
  serial_number: string;
  processor: string;
  generation: string;
  ram: string;
  storage: string;
  display_size: string;
  os: string;
  color: string;
  condition: "NEW" | "GOOD" | "FAIR" | "POOR";
  status: "AVAILABLE" | "RENTED" | "SOLD" | "DEMO" | "UNDER_MAINTENANCE" | "RETURNED_TO_SUPPLIER" | "WRITTEN_OFF";
  price: number;
  rent_per_month: number;
  purchase_price: number;   // cost to company — what we paid the supplier
  purchase_date: string;
  warranty_expiry: string;
  invoice_number: string;
  supplier_name: string;
  supplier_detail?: { id: number; name: string; phone: string } | null;
  customer_detail?: { id: number; name: string; phone: string } | null;
  created_at: string;
}

interface Stats {
  total: number; available: number; rented: number; sold: number;
  under_maintenance: number; returned_to_supplier: number; written_off: number; demo: number;
}

interface InventoryListProps {
  refreshKey: number;
  onAddNew: () => void;
  onEdit:   (laptop: Laptop) => void;
  onView:   (laptop: Laptop) => void;
}

const STATUS_VARIANTS: Record<string, any> = {
  AVAILABLE:              "success",
  RENTED:                 "info",
  SOLD:                   "neutral",
  DEMO:                   "warning",
  UNDER_MAINTENANCE:      "warning",
  RETURNED_TO_SUPPLIER:   "neutral",
  WRITTEN_OFF:            "danger",
};
const STATUS_LABELS: Record<string, string> = {
  AVAILABLE:              "Available",
  RENTED:                 "Rented",
  SOLD:                   "Sold",
  DEMO:                   "Demo",
  UNDER_MAINTENANCE:      "Maintenance",
  RETURNED_TO_SUPPLIER:   "Returned",
  WRITTEN_OFF:            "Written Off",
};
const CONDITION_VARIANTS: Record<string, any> = {
  NEW: "success", GOOD: "info", FAIR: "warning", POOR: "danger",
};

const ITEMS_PER_PAGE = 10;

export function InventoryList({ refreshKey, onAddNew, onEdit, onView }: InventoryListProps) {
  const [laptops,       setLaptops]       = useState<Laptop[]>([]);
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [brandFilter,   setBrandFilter]   = useState("all");
  const [currentPage,   setCurrentPage]   = useState(1);
  const [actionMenuId,  setActionMenuId]  = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchAll(); }, [refreshKey]);

  // Close dropdown on any outside click
  useEffect(() => {
    const close = () => setActionMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [laptopRes, statsRes] = await Promise.all([
        api.get("/inventory/laptops/"),
        api.get("/inventory/laptops/stats/"),
      ]);
      setLaptops(laptopRes.data.results || laptopRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    e: React.MouseEvent,
    laptopId: number,
    endpoint: string,
    label: string,
    prompt: string,
  ) => {
    e.stopPropagation();
    const remarks = window.prompt(prompt);
    if (remarks === null) return; // user cancelled
    try {
      setActionLoading(true);
      setActionMenuId(null);
      await api.post(`/inventory/laptops/${laptopId}/${endpoint}/`, { remarks });
      fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.error || `Failed: ${label}`);
    } finally {
      setActionLoading(false);
    }
  };

  const brands = ["all", ...Array.from(new Set(laptops.map(l => l.brand))).sort()];

  const filtered = laptops.filter(l => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      l.brand.toLowerCase().includes(q) ||
      l.model.toLowerCase().includes(q) ||
      l.serial_number.toLowerCase().includes(q) ||
      (l.asset_tag      || "").toLowerCase().includes(q) ||
      (l.supplier_name  || "").toLowerCase().includes(q) ||
      (l.customer_detail?.name || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchBrand  = brandFilter  === "all" || l.brand  === brandFilter;
    return matchSearch && matchStatus && matchBrand;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const fmtINR = (n?: number | null) =>
    n != null && !isNaN(Number(n)) ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Laptop Inventory</h1>
          <p className="text-neutral-600">{filtered.length} laptops found</p>
        </div>
        <Button onClick={onAddNew}>
          <Plus className="w-4 h-4 mr-1.5 flex-shrink-0" />
          Add Laptop
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { key: "all",                  label: "Total",       value: stats.total,                icon: Package,       color: "bg-neutral-100 text-neutral-700" },
            { key: "AVAILABLE",            label: "Available",   value: stats.available,            icon: CheckCircle,   color: "bg-green-50 text-green-700"      },
            { key: "RENTED",               label: "Rented",      value: stats.rented,               icon: Monitor,       color: "bg-blue-50 text-blue-700"        },
            { key: "SOLD",                 label: "Sold",        value: stats.sold,                 icon: ShoppingCart,  color: "bg-purple-50 text-purple-700"    },
            { key: "UNDER_MAINTENANCE",    label: "Maintenance", value: stats.under_maintenance,    icon: Wrench,        color: "bg-yellow-50 text-yellow-700"    },
            { key: "RETURNED_TO_SUPPLIER", label: "Returned",    value: stats.returned_to_supplier, icon: RotateCcw,     color: "bg-orange-50 text-orange-700"    },
            { key: "WRITTEN_OFF",          label: "Written Off", value: stats.written_off,          icon: AlertTriangle, color: "bg-red-50 text-red-700"          },
          ].map(s => {
            const Icon     = s.icon;
            const isActive = statusFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => { setStatusFilter(s.key); setCurrentPage(1); }}
                className={`bg-white rounded-xl border text-left p-4 cursor-pointer hover:shadow-sm transition-all ${
                  isActive ? "border-blue-500 ring-1 ring-blue-500" : "border-neutral-200"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                </div>
                <p className="text-2xl font-bold text-neutral-900">{s.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search brand, model, serial, asset tag, supplier, customer..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select
            className="border border-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="SOLD">Sold</option>
            <option value="DEMO">Demo</option>
            <option value="UNDER_MAINTENANCE">Maintenance</option>
            <option value="RETURNED_TO_SUPPLIER">Returned to Supplier</option>
            <option value="WRITTEN_OFF">Written Off</option>
          </select>
          <select
            className="border border-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={brandFilter}
            onChange={e => { setBrandFilter(e.target.value); setCurrentPage(1); }}
          >
            {brands.map(b => (
              <option key={b} value={b}>{b === "all" ? "All Brands" : b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Asset</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Specs</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Condition</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Current With</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Supplier</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Cost to Company</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Pricing</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Warranty</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-neutral-400">
                  No laptops found.
                </td>
              </tr>
            ) : paginated.map(l => (
              <tr key={l.id} className="hover:bg-neutral-50 transition-colors">

                {/* Asset */}
                <td className="px-6 py-4">
                  <p className="font-semibold text-neutral-900 whitespace-nowrap">{l.brand} {l.model}</p>
                  <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded text-neutral-600 block w-fit mt-0.5">
                    {l.serial_number}
                  </code>
                  {l.asset_tag && (
                    <p className="text-xs text-neutral-400 mt-0.5">{l.asset_tag}</p>
                  )}
                </td>

                {/* Specs */}
                <td className="px-6 py-4 text-sm text-neutral-600">
                  <p className="whitespace-nowrap">{l.processor}</p>
                  <p className="text-neutral-500 whitespace-nowrap">Gen {l.generation} · {l.ram} · {l.storage}</p>
                  {l.display_size && (
                    <p className="text-xs text-neutral-400">{l.display_size}</p>
                  )}
                </td>

                {/* Condition */}
                <td className="px-6 py-4">
                  <Badge variant={CONDITION_VARIANTS[l.condition] || "neutral"} size="sm">
                    {l.condition}
                  </Badge>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <Badge variant={STATUS_VARIANTS[l.status] || "neutral"} size="sm">
                    {STATUS_LABELS[l.status] || l.status}
                  </Badge>
                </td>

                {/* Current With */}
                <td className="px-6 py-4 text-sm">
                  {l.customer_detail ? (
                    <div>
                      <p className="font-medium text-neutral-800 whitespace-nowrap">{l.customer_detail.name}</p>
                      <p className="text-xs text-neutral-400">{l.customer_detail.phone}</p>
                    </div>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>

                {/* Supplier */}
                <td className="px-6 py-4 text-sm">
                  {l.supplier_name ? (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span className="text-neutral-700 whitespace-nowrap">{l.supplier_name}</span>
                    </div>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>

                {/* Cost to Company */}
                <td className="px-6 py-4 text-sm">
                  <p className="font-semibold text-neutral-800">{fmtINR(l.purchase_price)}</p>
                  {l.purchase_date && (
                    <p className="text-xs text-neutral-400 mt-0.5 whitespace-nowrap">{fmtDate(l.purchase_date)}</p>
                  )}
                  {l.invoice_number && (
                    <p className="text-xs text-neutral-400">#{l.invoice_number}</p>
                  )}
                </td>

                {/* Pricing */}
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  <p className="font-medium text-neutral-800">{fmtINR(l.price)}</p>
                  <p className="text-xs text-neutral-400">{fmtINR(l.rent_per_month)}/mo</p>
                </td>

                {/* Warranty */}
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  {l.warranty_expiry ? (
                    <span className={
                      new Date(l.warranty_expiry) < new Date()
                        ? "text-red-600 font-medium"
                        : "text-green-600"
                    }>
                      {fmtDate(l.warranty_expiry)}
                    </span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>

                {/* ── Actions — fixed alignment ── */}
                <td className="px-6 py-4">
                  <div
                    className="flex items-center gap-0.5 relative"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* VIEW — this is what was broken: onView was () => {} in App.tsx */}
                    <button
                      onClick={() => onView(l)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    </button>

                    {/* EDIT */}
                    <button
                      onClick={() => onEdit(l)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit laptop"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    </button>

                    {/* MORE */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setActionMenuId(actionMenuId === l.id ? null : l.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-lg transition-colors"
                      title="More actions"
                    >
                      <MoreVertical className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    </button>

                    {/* Dropdown */}
                    {actionMenuId === l.id && (
                      <div
                        className="absolute right-0 top-9 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-30"
                        onClick={e => e.stopPropagation()}
                      >
                        {l.status !== "UNDER_MAINTENANCE"
                          && l.status !== "RETURNED_TO_SUPPLIER"
                          && l.status !== "WRITTEN_OFF"
                          && l.status !== "SOLD" && (
                          <button
                            onClick={e => handleAction(e, l.id, "send-maintenance", "Maintenance", "Remarks for maintenance (optional):")}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 text-neutral-700 text-sm"
                          >
                            <Wrench className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            Send for Maintenance
                          </button>
                        )}

                        {l.status === "UNDER_MAINTENANCE" && (
                          <button
                            onClick={e => handleAction(e, l.id, "return-from-maintenance", "Maintenance Done", "Remarks (optional):")}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 text-neutral-700 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            Return from Maintenance
                          </button>
                        )}

                        {l.status !== "RETURNED_TO_SUPPLIER"
                          && l.status !== "WRITTEN_OFF"
                          && l.status !== "SOLD"
                          && l.status !== "RENTED" && (
                          <button
                            onClick={e => handleAction(e, l.id, "return-to-supplier", "Return to Supplier", "Reason for returning to supplier:")}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 text-neutral-700 text-sm"
                          >
                            <RotateCcw className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            Return to Supplier
                          </button>
                        )}

                        {l.status !== "WRITTEN_OFF"
                          && l.status !== "SOLD"
                          && l.status !== "RENTED" && (
                          <>
                            <div className="my-1 border-t border-neutral-100" />
                            <button
                              onClick={e => handleAction(e, l.id, "write-off", "Write Off", "Reason for writing off (required):")}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm"
                            >
                              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                              Write Off
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200">
            <span className="text-sm text-neutral-600">
              Page {currentPage} of {totalPages} · {filtered.length} total
            </span>
            <div className="flex items-center gap-1">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-neutral-700 px-2">{currentPage}</span>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
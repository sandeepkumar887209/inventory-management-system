import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Wrench, RotateCcw, AlertTriangle,
  CheckCircle, Clock, Package, Edit2,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import api from "../../services/axios";

const STATUS_VARIANTS: Record<string, any> = {
  AVAILABLE: "success", RENTED: "info", SOLD: "neutral",
  DEMO: "warning", UNDER_MAINTENANCE: "warning",
  RETURNED_TO_SUPPLIER: "neutral", WRITTEN_OFF: "danger",
};
const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available", RENTED: "Rented", SOLD: "Sold",
  DEMO: "Demo", UNDER_MAINTENANCE: "Under Maintenance",
  RETURNED_TO_SUPPLIER: "Returned to Supplier", WRITTEN_OFF: "Written Off",
};
const ACTION_ICONS: Record<string, React.ReactNode> = {
  ADDED:                <Package className="w-4 h-4 text-blue-500" />,
  RENTED_OUT:           <Clock className="w-4 h-4 text-blue-500" />,
  RETURNED:             <CheckCircle className="w-4 h-4 text-green-500" />,
  SOLD:                 <CheckCircle className="w-4 h-4 text-purple-500" />,
  SENT_FOR_MAINTENANCE: <Wrench className="w-4 h-4 text-yellow-500" />,
  MAINTENANCE_DONE:     <CheckCircle className="w-4 h-4 text-green-500" />,
  RETURNED_TO_SUPPLIER: <RotateCcw className="w-4 h-4 text-orange-500" />,
  WRITTEN_OFF:          <AlertTriangle className="w-4 h-4 text-red-500" />,
  STATUS_CHANGED:       <Clock className="w-4 h-4 text-neutral-400" />,
  SPECS_UPDATED:        <Edit2 className="w-4 h-4 text-neutral-400" />,
};

export function LaptopDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [laptop,   setLaptop]   = useState<any>(null);
  const [history,  setHistory]  = useState<any[]>([]);
  const [movements,setMovements]= useState<any[]>([]);
  const [activeTab,setActiveTab]= useState<"history"|"movements">("history");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [lRes, hRes, mRes] = await Promise.all([
        api.get(`/inventory/laptops/${id}/`),
        api.get(`/inventory/laptops/${id}/history/`),
        api.get(`/inventory/laptops/${id}/movements/`),
      ]);
      setLaptop(lRes.data);
      setHistory(Array.isArray(hRes.data) ? hRes.data : hRes.data.results || []);
      setMovements(Array.isArray(mRes.data) ? mRes.data : mRes.data.results || []);
    } catch { alert("Failed to load laptop details."); }
    finally { setLoading(false); }
  };

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
  const fmtDT = (d: string) =>
    new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  const fmtINR = (n?: number) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  if (loading) return <div className="p-6 text-neutral-600">Loading...</div>;
  if (!laptop)  return <div className="p-6 text-red-500">Laptop not found.</div>;

  const isWarrantyExpired = laptop.warranty_expiry && new Date(laptop.warranty_expiry) < new Date();

  return (
    <div className="space-y-6">

      {/* Back */}
      <Button variant="secondary" onClick={() => navigate("/inventory")}>
        <ChevronLeft className="w-4 h-4 mr-1 inline" /> Back to Inventory
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {laptop.brand} {laptop.model}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant={STATUS_VARIANTS[laptop.status] || "neutral"}>
              {STATUS_LABELS[laptop.status] || laptop.status}
            </Badge>
            {laptop.asset_tag && (
              <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                {laptop.asset_tag}
              </code>
            )}
            <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
              {laptop.serial_number}
            </code>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/inventory/edit/${laptop.id}`)}>
          <Edit2 className="w-4 h-4 mr-1 inline" /> Edit
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Specs */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Specifications
          </h3>
          <div className="space-y-2 text-sm">
            {[
              ["Processor",    laptop.processor],
              ["Generation",   laptop.generation],
              ["RAM",          laptop.ram],
              ["Storage",      laptop.storage],
              ["Display",      laptop.display_size],
              ["OS",           laptop.os],
              ["Color",        laptop.color],
              ["Condition",    laptop.condition],
            ].filter(([,v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-neutral-500">{k}</span>
                <span className="font-medium text-neutral-800">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Purchase Details
          </h3>
          <div className="space-y-2 text-sm">
            {[
              ["From",          laptop.purchased_from || laptop.supplier_detail?.name],
              ["Date",          fmtDate(laptop.purchase_date)],
              ["Cost",          fmtINR(laptop.purchase_price)],
              ["Invoice",       laptop.invoice_number],
              ["Warranty",      laptop.warranty_expiry ? (
                <span className={isWarrantyExpired ? "text-red-600 font-medium" : "text-green-600"}>
                  {fmtDate(laptop.warranty_expiry)}{isWarrantyExpired ? " (Expired)" : ""}
                </span>
              ) : "—"],
            ].filter(([,v]) => v && v !== "—").map(([k, v]) => (
              <div key={String(k)} className="flex justify-between">
                <span className="text-neutral-500">{k}</span>
                <span className="font-medium text-neutral-800">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & Current */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Pricing & Assignment
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Sale Price</span>
              <span className="font-medium text-neutral-800">{fmtINR(laptop.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Rent/Month</span>
              <span className="font-medium text-neutral-800">{fmtINR(laptop.rent_per_month)}</span>
            </div>
            {laptop.purchase_price && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Cost Price</span>
                <span className="font-medium text-neutral-800">{fmtINR(laptop.purchase_price)}</span>
              </div>
            )}
            <hr className="border-neutral-100 my-2" />
            <div className="flex justify-between">
              <span className="text-neutral-500">Assigned To</span>
              <span className="font-medium text-neutral-800">
                {laptop.customer_detail?.name || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Added On</span>
              <span className="font-medium text-neutral-800">{fmtDate(laptop.created_at)}</span>
            </div>
          </div>
          {laptop.internal_notes && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-xs font-semibold text-yellow-700 mb-1">Internal Notes</p>
              <p className="text-xs text-yellow-800">{laptop.internal_notes}</p>
            </div>
          )}
        </div>

      </div>

      {/* History + Movements tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="flex border-b border-neutral-200">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
            onClick={() => setActiveTab("history")}
          >
            History ({history.length})
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "movements"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
            onClick={() => setActiveTab("movements")}
          >
            Stock Movements ({movements.length})
          </button>
        </div>

        <div className="p-4">
          {activeTab === "history" && (
            history.length === 0 ? (
              <p className="text-center text-neutral-400 py-8">No history yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h: any) => (
                  <div key={h.id} className="flex gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center">
                      {ACTION_ICONS[h.action] || <Clock className="w-4 h-4 text-neutral-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-neutral-800">
                          {h.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-neutral-400 flex-shrink-0">{fmtDT(h.created_at)}</span>
                      </div>
                      {h.from_status && h.to_status && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {h.from_status} → {h.to_status}
                        </p>
                      )}
                      {h.customer_name && (
                        <p className="text-xs text-neutral-500">Customer: {h.customer_name}</p>
                      )}
                      {h.remarks && (
                        <p className="text-xs text-neutral-600 mt-1 italic">"{h.remarks}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "movements" && (
            movements.length === 0 ? (
              <p className="text-center text-neutral-400 py-8">No movements yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">By</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {movements.map((m: any) => (
                      <tr key={m.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-800">
                          {m.movement_type.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{m.remarks || "—"}</td>
                        <td className="px-4 py-3 text-neutral-500">{m.created_by_name || "System"}</td>
                        <td className="px-4 py-3 text-neutral-500">{fmtDT(m.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

    </div>
  );
}
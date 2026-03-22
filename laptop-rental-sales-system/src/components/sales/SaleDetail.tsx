import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, RotateCcw, RefreshCw, Check, AlertCircle,
  Laptop, User, Calendar, IndianRupee, Package
} from "lucide-react";
import { Badge } from "../common/Badge";
import api from "../../services/axios";

const fmtINR = (n: any) =>
  n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Return state
  const [showReturn, setShowReturn] = useState(false);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState("");

  // Replacement state
  const [showReplace, setShowReplace] = useState(false);
  const [oldLaptopId, setOldLaptopId] = useState<string>("");
  const [newLaptopId, setNewLaptopId] = useState<string>("");
  const [availableLaptops, setAvailableLaptops] = useState<any[]>([]);
  const [submittingReplace, setSubmittingReplace] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  useEffect(() => {
    fetchSale();
  }, [id]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sales/sale/${id}/`);
      setSale(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableLaptops = async () => {
    try {
      setLoadingAvailable(true);
      const res = await api.get("/inventory/laptops/?status=AVAILABLE");
      setAvailableLaptops(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const toggleCheck = (laptopId: number) => {
    setCheckedIds((prev) =>
      prev.includes(laptopId) ? prev.filter((x) => x !== laptopId) : [...prev, laptopId]
    );
  };

  const handleReturn = async () => {
    if (checkedIds.length === 0) return;
    try {
      setSubmittingReturn(true);
      // Update each selected laptop status back to AVAILABLE
      await Promise.all(
        checkedIds.map((laptopId) =>
          api.post(`/inventory/laptops/${laptopId}/return-from-maintenance/`, {
            remarks: returnRemarks || `Returned from Sale #${id}`,
          }).catch(() =>
            // Fallback: try direct status update
            api.patch(`/inventory/laptops/${laptopId}/`, { status: "AVAILABLE", customer: null })
          )
        )
      );
      // Mark sale as RETURNED
      await api.patch(`/sales/sale/${id}/`, { status: "RETURNED" });
      setShowReturn(false);
      setCheckedIds([]);
      setReturnRemarks("");
      fetchSale();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Return failed. Please try again.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleReplace = async () => {
    if (!oldLaptopId || !newLaptopId) return;
    try {
      setSubmittingReplace(true);
      // Mark old laptop as AVAILABLE
      await api.patch(`/inventory/laptops/${oldLaptopId}/`, {
        status: "AVAILABLE",
        customer: null,
      });
      // Mark new laptop as SOLD and assign to customer
      await api.patch(`/inventory/laptops/${newLaptopId}/`, {
        status: "SOLD",
        customer: sale.customer,
      });
      // Create stock movements
      await api.post("/inventory/stockmovement/", {
        laptop: Number(oldLaptopId),
        movement_type: "RETURN",
        quantity: 1,
        remarks: `Replacement return from Sale #${id}`,
      });
      await api.post("/inventory/stockmovement/", {
        laptop: Number(newLaptopId),
        movement_type: "SOLD",
        quantity: 1,
        remarks: `Replacement for Sale #${id}`,
      });
      setShowReplace(false);
      setOldLaptopId("");
      setNewLaptopId("");
      fetchSale();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Replacement failed. Please try again.");
    } finally {
      setSubmittingReplace(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-400 text-sm">Loading sale details...</div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-sm">Sale not found.</div>
      </div>
    );
  }

  const soldItems = sale.items_detail || [];
  const isCompleted = sale.status === "COMPLETED";
  const gstAmount = (Number(sale.subtotal) * Number(sale.gst)) / 100;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/sales")}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Sales
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">Sale #{sale.id}</h1>
            <Badge variant={isCompleted ? "success" : "warning"}>{sale.status}</Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            {fmtDate(sale.created_at)} · {soldItems.length} laptop{soldItems.length !== 1 ? "s" : ""}
          </p>
        </div>

        {isCompleted && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowReturn(!showReturn);
                setShowReplace(false);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Return
            </button>
            <button
              onClick={() => {
                setShowReplace(!showReplace);
                setShowReturn(false);
                if (!showReplace) loadAvailableLaptops();
              }}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Replace
            </button>
          </div>
        )}
      </div>

      {/* Return Panel */}
      {showReturn && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-red-900 text-sm">Select Laptops to Return</h3>
          </div>
          <div className="space-y-2">
            {soldItems.map((item: any) => (
              <label
                key={item.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  checkedIds.includes(item.laptop?.id)
                    ? "border-red-400 bg-white"
                    : "border-red-200 bg-white/60 hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedIds.includes(item.laptop?.id)}
                  onChange={() => toggleCheck(item.laptop?.id)}
                  className="w-4 h-4 accent-red-600"
                />
                <div className="flex-1">
                  <span className="font-medium text-sm text-neutral-900">
                    {item.laptop?.brand} {item.laptop?.model}
                  </span>
                  <span className="text-xs text-neutral-500 ml-2">{item.laptop?.serial_number}</span>
                </div>
                <span className="text-sm font-medium text-neutral-700">{fmtINR(item.sale_price)}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Return Reason (optional)</label>
            <textarea
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. Customer changed mind, defective unit..."
              className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReturn}
              disabled={checkedIds.length === 0 || submittingReturn}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <Check className="w-4 h-4" />
              {submittingReturn ? "Processing..." : `Confirm Return (${checkedIds.length})`}
            </button>
            <button
              onClick={() => { setShowReturn(false); setCheckedIds([]); setReturnRemarks(""); }}
              className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          {checkedIds.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Select at least one laptop to return
            </div>
          )}
        </div>
      )}

      {/* Replace Panel */}
      {showReplace && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-700" />
            <h3 className="font-semibold text-amber-900 text-sm">Replace a Laptop</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Laptop to Replace (from this sale)
              </label>
              <select
                value={oldLaptopId}
                onChange={(e) => setOldLaptopId(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">— Select laptop to swap out —</option>
                {soldItems.map((item: any) => (
                  <option key={item.laptop?.id} value={item.laptop?.id}>
                    {item.laptop?.brand} {item.laptop?.model} ({item.laptop?.serial_number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Replacement Laptop (available inventory)
              </label>
              {loadingAvailable ? (
                <div className="px-3 py-2 border border-amber-200 rounded-lg text-sm text-neutral-400">
                  Loading available laptops...
                </div>
              ) : (
                <select
                  value={newLaptopId}
                  onChange={(e) => setNewLaptopId(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">— Select replacement laptop —</option>
                  {availableLaptops.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.brand} {l.model} ({l.serial_number}) · {fmtINR(l.price)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReplace}
              disabled={!oldLaptopId || !newLaptopId || submittingReplace}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              {submittingReplace ? "Processing..." : "Confirm Replacement"}
            </button>
            <button
              onClick={() => { setShowReplace(false); setOldLaptopId(""); setNewLaptopId(""); }}
              className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Info */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <User className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customer</span>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-neutral-900 text-base">{sale.customer_detail?.name || "—"}</div>
            {sale.customer_detail?.phone && (
              <div className="text-sm text-neutral-500">{sale.customer_detail.phone}</div>
            )}
            {sale.customer_detail?.email && (
              <div className="text-sm text-neutral-500">{sale.customer_detail.email}</div>
            )}
            {sale.customer_detail?.customer_type && (
              <Badge variant="neutral">
                {sale.customer_detail.customer_type === "company" ? "Corporate" : "Individual"}
              </Badge>
            )}
          </div>
        </div>

        {/* Sale Summary */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <IndianRupee className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Payment Summary</span>
          </div>
          <div className="space-y-2.5">
            {[
              ["Subtotal", fmtINR(sale.subtotal)],
              ["GST (" + sale.gst + "%)", fmtINR(gstAmount)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-neutral-500">{label}</span>
                <span className="text-neutral-700">{value}</span>
              </div>
            ))}
            <div className="border-t border-neutral-100 pt-2.5 flex justify-between">
              <span className="font-semibold text-neutral-900">Total</span>
              <span className="font-bold text-neutral-900 text-base">{fmtINR(sale.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Laptops Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-100">
          <Laptop className="w-4 h-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-700">
            Laptops Sold ({soldItems.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                {["Laptop", "Serial Number", "Specs", "Sale Price", "Laptop Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {soldItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-neutral-900">
                      {item.laptop?.brand} {item.laptop?.model}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono">
                      {item.laptop?.serial_number}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-neutral-500">
                      {[item.laptop?.processor, item.laptop?.ram, item.laptop?.storage]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-neutral-900">{fmtINR(item.sale_price)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={
                        item.laptop?.status === "SOLD"
                          ? "info"
                          : item.laptop?.status === "AVAILABLE"
                          ? "success"
                          : "neutral"
                      }
                    >
                      {item.laptop?.status || "—"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {soldItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-neutral-400 text-sm">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
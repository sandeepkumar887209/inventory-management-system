import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, RefreshCw, ShoppingCart, TrendingUp, Package, IndianRupee } from "lucide-react";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import api from "../../services/axios";

export function SalesList({ onCreateNew, onViewInvoice }: any) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sales/sale/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setSales(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (s.customer_detail?.name || "").toLowerCase().includes(q) ||
      String(s.id).includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const completedSales = sales.filter((s) => s.status === "COMPLETED").length;
  const returnedSales = sales.filter((s) => s.status === "RETURNED").length;

  const fmtINR = (n: any) =>
    n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-neutral-600 mt-1">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSales}
            className="p-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-1" />
            New Sale
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500">Total Sales</span>
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{sales.length}</div>
          <div className="text-xs text-neutral-400 mt-1">All transactions</div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500">Total Revenue</span>
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{fmtINR(totalRevenue)}</div>
          <div className="text-xs text-neutral-400 mt-1">Gross revenue</div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500">Completed</span>
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{completedSales}</div>
          <div className="text-xs text-neutral-400 mt-1">Successful sales</div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500">Returned</span>
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{returnedSales}</div>
          <div className="text-xs text-neutral-400 mt-1">Sales returned</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by customer name or sale ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">Sale ID</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Subtotal</th>
              <th className="p-3 text-left">GST</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="p-3">
                      <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-neutral-400">
                  No sales found
                </td>
              </tr>
            ) : (
              filtered.map((sale) => (
                <tr key={sale.id} className="border-b">
                  <td className="p-3">#{sale.id}</td>
                  <td className="p-3">
                    <div>{sale.customer_detail?.name || "—"}</div>
                    {sale.customer_detail?.phone && (
                      <div className="text-xs text-neutral-400">{sale.customer_detail.phone}</div>
                    )}
                  </td>
                  <td className="p-3">{sale.total_items || 0}</td>
                  <td className="p-3">{fmtINR(sale.subtotal)}</td>
                  <td className="p-3">{sale.gst}%</td>
                  <td className="p-3 font-semibold">{fmtINR(sale.total_amount)}</td>
                  <td className="p-3">{fmtDate(sale.created_at)}</td>
                  <td className="p-3">
                    <Badge variant={sale.status === "COMPLETED" ? "success" : "warning"}>
                      {sale.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="secondary" onClick={() => onViewInvoice(sale)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && filtered.length > 0 && (
          <div className="p-3 border-t text-sm text-neutral-500">
            Showing <span className="font-medium">{filtered.length}</span> of{" "}
            <span className="font-medium">{sales.length}</span> sales
          </div>
        )}
      </div>

    </div>
  );
}
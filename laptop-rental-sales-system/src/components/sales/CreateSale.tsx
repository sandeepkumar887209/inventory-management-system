import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "../common/Button";
import api from "../../services/axios";

const fmtINR = (n: any) =>
  n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

export function CreateSale() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [laptops, setLaptops] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [gst, setGst] = useState<number>(18);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/customers/customers/").then((r) =>
        setCustomers(Array.isArray(r.data) ? r.data : r.data.results || [])
      ),
      api.get("/inventory/laptops/?status=AVAILABLE").then((r) =>
        setLaptops(Array.isArray(r.data) ? r.data : r.data.results || [])
      ),
    ]).catch(console.error);
  }, []);

  const filteredLaptops = laptops.filter((l) => {
    const q = search.toLowerCase();
    return (
      !q ||
      l.brand.toLowerCase().includes(q) ||
      l.model.toLowerCase().includes(q) ||
      l.serial_number.toLowerCase().includes(q)
    );
  });

  const toggleLaptop = (laptop: any) => {
    const exists = items.find((i) => i.laptop_id === laptop.id);
    if (exists) {
      setItems(items.filter((i) => i.laptop_id !== laptop.id));
    } else {
      setItems([
        ...items,
        {
          laptop_id: laptop.id,
          brand: laptop.brand,
          model: laptop.model,
          serial_number: laptop.serial_number,
          base_price: laptop.price || 0,
          sale_price: laptop.price || 0,
        },
      ]);
    }
  };

  const updatePrice = (laptopId: number, value: string) => {
    setItems(items.map((i) =>
      i.laptop_id === laptopId ? { ...i, sale_price: parseFloat(value) || 0 } : i
    ));
  };

  const removeItem = (laptopId: number) => {
    setItems(items.filter((i) => i.laptop_id !== laptopId));
  };

  const subtotal = items.reduce((sum, i) => sum + Number(i.sale_price), 0);
  const gstAmount = (subtotal * gst) / 100;
  const total = subtotal + gstAmount;

  const handleSubmit = async () => {
    setError("");
    if (!selectedCustomer) { setError("Please select a customer."); return; }
    if (items.length === 0) { setError("Please select at least one laptop."); return; }

    try {
      setLoading(true);
      await api.post("/sales/sale/", {
        customer: Number(selectedCustomer),
        gst,
        items: items.map((i) => ({ laptop_id: i.laptop_id, sale_price: i.sale_price })),
      });
      navigate("/sales");
    } catch (err: any) {
      setError(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || "Failed to create sale.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/sales")}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Sales
      </button>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Create New Sale</h1>
        <p className="text-sm text-neutral-500 mt-1">Select a customer and laptops to process the sale</p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer + Laptops */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Select */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">Customer</h2>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Select a customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Laptop Selection */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">
              Available Laptops
              <span className="ml-2 text-neutral-400 font-normal">({filteredLaptops.length} available)</span>
            </h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by brand, model, serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filteredLaptops.map((l) => {
                const selected = items.some((i) => i.laptop_id === l.id);
                return (
                  <label
                    key={l.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      selected
                        ? "border-blue-400 bg-blue-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selected ? "bg-blue-600 border-blue-600" : "border-neutral-300"
                      }`}
                      onClick={() => toggleLaptop(l)}
                    >
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => toggleLaptop(l)}>
                      <div className="font-medium text-sm text-neutral-900">
                        {l.brand} {l.model}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {l.serial_number} · {l.processor} · {l.ram} · {l.storage}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0" onClick={() => toggleLaptop(l)}>
                      <div className="font-semibold text-sm text-neutral-900">{fmtINR(l.price)}</div>
                    </div>
                  </label>
                );
              })}
              {filteredLaptops.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-sm">No available laptops found</div>
              )}
            </div>
          </div>

          {/* Selected items with price override */}
          {items.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-neutral-700 mb-3">
                Selected Laptops ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.laptop_id}
                    className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-neutral-900">
                        {item.brand} {item.model}
                      </div>
                      <div className="text-xs text-neutral-400">{item.serial_number}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Base: {fmtINR(item.base_price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-neutral-400">₹</span>
                      <input
                        type="number"
                        value={item.sale_price}
                        onChange={(e) => updatePrice(item.laptop_id, e.target.value)}
                        className="w-28 px-2 py-1.5 border border-neutral-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={0}
                      />
                      <button
                        onClick={() => removeItem(item.laptop_id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-700 mb-4">Order Summary</h2>

            {/* GST */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">GST Rate</label>
              <select
                value={gst}
                onChange={(e) => setGst(Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {[0, 5, 12, 18, 28].map((v) => (
                  <option key={v} value={v}>{v}%</option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5 pb-3 border-b border-neutral-100">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Items</span>
                <span className="text-neutral-700">{items.length} laptop{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="text-neutral-700">{fmtINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">GST ({gst}%)</span>
                <span className="text-neutral-700">{fmtINR(gstAmount)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-3 mb-5">
              <span className="font-semibold text-neutral-900">Total</span>
              <span className="font-bold text-lg text-neutral-900">{fmtINR(total)}</span>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedCustomer || items.length === 0}
              className="w-full"
            >
              {loading ? "Processing..." : "Confirm Sale"}
            </Button>
            <button
              onClick={() => navigate("/sales")}
              className="w-full mt-2 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>

          {items.length === 0 && (
            <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-xl p-4 text-center">
              <Plus className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Select laptops from the list to add them here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
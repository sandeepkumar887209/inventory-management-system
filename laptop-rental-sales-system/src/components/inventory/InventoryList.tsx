import React, { useEffect, useState } from "react";
import {
  Search,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import {
  getLaptops,
} from "../../services/inventory";

interface Laptop {
  id: number;
  brand: string;
  model: string;
  serial_number: string;
  processor: string;
  generation: string;
  ram: string;
  storage: string;
  price: number;
  rent_per_month: number;
  purchased_from?: string;
  description: any;
  status: "AVAILABLE" | "RENTED" | "SOLD" | "SCRAP" | "DEMO";
  customer?: {
    id: number;
    name: string;
  } | null;
}

interface InventoryListProps {
  refreshKey: number;
  onAddNew: () => void;
  onEdit: (laptop: Laptop) => void;
}

export function InventoryList({
  refreshKey,
  onAddNew,
  onEdit,
}: InventoryListProps) {

  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedLaptop, setSelectedLaptop] = useState<Laptop | null>(null);

  const itemsPerPage = 10;

  const fetchLaptops = async () => {
    try {
      const res = await getLaptops();
      setLaptops(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaptops();
  }, [refreshKey]);

  const brands = ["all", ...Array.from(new Set(laptops.map(l => l.brand)))];

  const filteredLaptops = laptops.filter(l => {
    const matchesSearch =
      l.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.serial_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || l.status === statusFilter;

    const matchesBrand =
      brandFilter === "all" || l.brand === brandFilter;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  const totalPages = Math.ceil(filteredLaptops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLaptops = filteredLaptops.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusBadge = (status: Laptop["status"]) => {
    const variants: any = {
      AVAILABLE: "success",
      RENTED: "info",
      SOLD: "neutral",
      SCRAP: "danger",
      DEMO: "warning",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return <div className="p-6 text-neutral-600">Loading inventory...</div>;
  }

  /* ================= DETAILS VIEW ================= */
  if (selectedLaptop) {
    return (
      <div className="space-y-6">
        <Button variant="secondary" onClick={() => setSelectedLaptop(null)}>
          ← Back to Inventory
        </Button>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-6">
          <h1 className="text-2xl font-bold">
            {selectedLaptop.brand} {selectedLaptop.model}
          </h1>

          <div className="grid grid-cols-2 gap-4 text-sm">

            <div><strong>Serial Number:</strong> {selectedLaptop.serial_number}</div>
            <div><strong>Status:</strong> {selectedLaptop.status}</div>

            <div><strong>Processor:</strong> {selectedLaptop.processor}</div>
            <div><strong>Generation:</strong> {selectedLaptop.generation}</div>

            <div><strong>RAM:</strong> {selectedLaptop.ram}</div>
            <div><strong>Storage:</strong> {selectedLaptop.storage}</div>

            <div><strong>Price:</strong> ₹{selectedLaptop.price}</div>
            <div><strong>Rent Per Month:</strong> ₹{selectedLaptop.rent_per_month}</div>

            <div><strong>Purchased From:</strong> {selectedLaptop.purchased_from || "-"}</div>

            <div>
              <strong>Current Customer:</strong>{" "}
              {selectedLaptop.customer_detail?.name || "None"}
            </div>

            <div className="col-span-2">
              <strong>Description:</strong>
              <pre className="bg-neutral-100 p-3 rounded mt-2 text-xs">
                {JSON.stringify(selectedLaptop.description, null, 2)}
              </pre>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /* ================= TABLE VIEW ================= */

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Laptop Inventory
          </h1>
          <p className="text-neutral-600">
            {filteredLaptops.length} laptops found
          </p>
        </div>
        <Button onClick={onAddNew}>
          ✚ Add Laptop
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              placeholder="Search brand, model, serial..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="border rounded-lg px-4 py-2"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="SOLD">Sold</option>
            <option value="SCRAP">Scrap</option>
            <option value="DEMO">Demo</option>
          </select>

          <select
            className="border rounded-lg px-4 py-2"
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
          >
            {brands.map(b => (
              <option key={b} value={b}>
                {b === "all" ? "All Brands" : b}
              </option>
            ))}
          </select>

        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left">Laptop</th>
              <th className="px-6 py-4">Specs</th>
              <th className="px-6 py-4">Serial</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedLaptops.map(l => (
              <tr key={l.id} className="border-t hover:bg-neutral-50">
                <td className="px-6 py-4">
                  <p className="font-medium">{l.brand}</p>
                  <p className="text-sm text-neutral-600">{l.model}</p>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-600">
                  {l.processor}<br />
                  Gen: {l.generation}<br />
                  {l.ram} • {l.storage}
                </td>
                <td className="px-6 py-4">
                  <code className="bg-neutral-100 px-2 py-1 rounded">
                    {l.serial_number}
                  </code>
                </td>
                <td className="px-6 py-4">{getStatusBadge(l.status)}</td>
                <td className="px-6 py-4">
                  ₹{l.price.toLocaleString()}
                  <div className="text-sm text-neutral-600">
                    ₹{l.rent_per_month}/mo
                  </div>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => setSelectedLaptop(l)}>
                    <Eye className="w-4 h-4 text-green-600" />
                  </button>
                  <button onClick={() => onEdit(l)}>
                    <Edit className="w-4 h-4 text-blue-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
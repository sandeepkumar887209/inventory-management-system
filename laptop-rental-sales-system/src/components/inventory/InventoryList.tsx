import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import {
  getLaptops,
  deleteLaptop,
} from "../../services/inventory";

interface Laptop {
  id: number;
  brand: string;
  model: string;
  serial_number: string;
  processor: string;
  ram: string;
  storage: string;
  condition: "Excellent" | "Good" | "Fair";
  status: "Available" | "Rented" | "Sold" | "Maintenance";
  price: number;
  rental_price: number;
  purchase_date: string;
}

interface InventoryListProps {
  onAddNew: () => void;
  onEdit: (laptop: Laptop) => void;
  onView: (laptop: Laptop) => void;
}


export function InventoryList({
  refreshKey,
  onAddNew,
  onEdit,
  onView,
}: InventoryListProps) {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* ================= FETCH DATA ================= */
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


  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this laptop?")) return;
    await deleteLaptop(id);
    fetchLaptops();
  };

  /* ================= FILTERING ================= */
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

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredLaptops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLaptops = filteredLaptops.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusBadge = (status: Laptop["status"]) => {
    const variants: any = {
      Available: "success",
      Rented: "info",
      Sold: "neutral",
      Maintenance: "warning",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return <div className="p-6 text-neutral-600">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Laptop Inventory
          </h1>
          <p className="text-neutral-600">
            {filteredLaptops.length} laptops found
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            🡻 Export
          </Button>
          <Button onClick={onAddNew}>
            ✚ Add Laptop
          </Button>
        </div>
      </div>

      {/* FILTERS */}
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
            <option value="Maintenance">Maintenance</option>
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

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left">Laptop</th>
              <th className="px-6 py-4">Specs</th>
              <th className="px-6 py-4">Serial</th>
              <th className="px-6 py-4">Condition</th>
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
                  {l.ram} • {l.storage}
                </td>
                <td className="px-6 py-4">
                  <code className="bg-neutral-100 px-2 py-1 rounded">
                    {l.serial_number}
                  </code>
                </td>
                <td className="px-6 py-4">{l.condition}</td>
                <td className="px-6 py-4">{getStatusBadge(l.status)}</td>
                <td className="px-6 py-4">
                  ₹{l.price.toLocaleString()}
                  <div className="text-sm text-neutral-600">
                    ₹{l.rent_per_month}/mo
                  </div>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => onView(l)}>
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEdit(l)}>
                    <Edit className="w-4 h-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(l.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-600">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

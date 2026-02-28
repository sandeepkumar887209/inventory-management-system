import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import api from "../../services/axios";

/* 🔷 BACKEND CUSTOMER TYPE */
interface Customer {
  id: number;
  name: string;
  customer_type: "individual" | "company";
  phone: string;
  email?: string;
  created_at?: string;
}

interface CustomerListProps {
  onAddNew: () => void;
  onViewDetails: (customer: Customer) => void;
}

export function CustomerList({
  onAddNew,
  onViewDetails,
}: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const itemsPerPage = 10;

  /* ================= FETCH CUSTOMERS ================= */
  useEffect(() => {
    setLoading(true);
    setError("");

    api
      .get("/customers/customers/")
      .then((res) => {
        const data = res.data.results || res.data;
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load customers.");
        setLoading(false);
      });
  }, []);

  /* ================= FILTER LOGIC ================= */
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.id).includes(searchTerm);

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "Individual" && c.customer_type === "individual") ||
      (typeFilter === "Corporate" && c.customer_type === "company");

    return matchesSearch && matchesType;
  });

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  /* ================= RENDER ================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">
            Customer Management
          </h1>
          <p className="text-neutral-600">
            {filteredCustomers.length} customers
          </p>
        </div>
        <Button onClick={onAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SEARCH */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* TYPE FILTER */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Individual">Individual</option>
            <option value="Corporate">Corporate</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left">Customer</th>
              <th className="px-6 py-4 text-left">Contact</th>
              <th className="px-6 py-4 text-left">Type</th>
              <th className="px-6 py-4 text-left">Joined</th>
              <th className="px-6 py-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {/* LOADING */}
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  Loading customers...
                </td>
              </tr>
            )}

            {/* ERROR */}
            {!loading && error && (
              <tr>
                <td colSpan={5} className="text-center text-red-500 py-6">
                  {error}
                </td>
              </tr>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && paginatedCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  No customers found
                </td>
              </tr>
            )}

            {/* DATA */}
            {!loading &&
              !error &&
              paginatedCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{c.name}</p>
                    <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded">
                      ID-{c.id}
                    </code>
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      {c.email || "-"}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      {c.phone}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        c.customer_type === "company"
                          ? "info"
                          : "neutral"
                      }
                    >
                      {c.customer_type === "company"
                        ? "Corporate"
                        : "Individual"}
                    </Badge>
                  </td>

                  <td className="px-6 py-4">
                    {formatDate(c.created_at)}
                  </td>

                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onViewDetails(c)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t">
            <span className="text-sm text-neutral-600">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                className="p-1"
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage === 1}
              >
                <ChevronLeft />
              </button>

              <button
                className="p-1"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
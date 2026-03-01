import React, { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";

interface RentalListProps {
  refreshKey: number;
  onCreateNew: () => void;
}

export function RentalList({ refreshKey, onCreateNew }: RentalListProps) {
  const [rentals, setRentals] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRentals();
    fetchCustomers();
  }, [refreshKey]);

  const fetchRentals = async () => {
    try {
      const res = await api.get("/rentals/rental/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setRentals(data);
    } catch (error) {
      console.error("Rental fetch error:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers/customers/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setCustomers(data);
    } catch (error) {
      console.error("Customer fetch error:", error);
    }
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "N/A";
  };

  const filteredRentals = rentals.filter((rental) => {
    const customerName = String(
      rental.customer_detail?.name || getCustomerName(rental.customer)
    ).toLowerCase();

    const matchesSearch = customerName.includes(
      searchTerm.toLowerCase()
    );

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : rental.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    if (status === "ONGOING") {
      return <Badge variant="success">Ongoing</Badge>;
    }
    if (status === "RETURNED") {
      return <Badge variant="info">Returned</Badge>;
    }
    if (status === "REPLACED") {
      return <Badge variant="warning">Replaced</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">
            Rental Management
          </h1>
          <p className="text-neutral-600">
            {filteredRentals.length} rentals
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={onCreateNew}>
            ✚ New Rental
          </Button>

          <Button onClick={() => navigate("/rental-return")}>
            🔁 Rental Return
          </Button>

          <Button onClick={() => navigate("/rental-replacement")}>
            🔄 Replacement
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="flex gap-4">

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ONGOING">Ongoing</option>
            <option value="RETURNED">Returned</option>
            <option value="REPLACED">Replaced</option>
          </select>

        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Laptops</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Total Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {filteredRentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/rentals/${rental.id}`)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {rental.id}
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    {rental.customer_detail?.name || getCustomerName(rental.customer)}
                  </td>

                  <td className="px-6 py-4">
                    {rental.items_detail?.length || 0}{" "}
                    {(rental.items_detail?.length || 0) === 1
                      ? "Laptop"
                      : "Laptops"}
                  </td>

                  <td className="px-6 py-4">
                    {getStatusBadge(rental.status)}
                  </td>

                  <td className="px-6 py-4 font-medium">
                    ₹{rental.total_amount}
                  </td>

                  <td className="px-6 py-4">
                    {new Date(rental.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {filteredRentals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-neutral-500">
                    No rentals found
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
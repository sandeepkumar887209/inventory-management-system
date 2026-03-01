import React, { useEffect, useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";

export function RentalReturn() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [rentedLaptops, setRentedLaptops] = useState<any[]>([]);
  const [selectedLaptops, setSelectedLaptops] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers/customers/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  // Fetch rented laptops (customer + RENTED)
  const fetchRentedLaptops = async (customerId: number) => {
    try {
      const res = await api.get(
        `/inventory/laptops/?status=RENTED&customer=${customerId}`
      );

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setRentedLaptops(data);
      setSelectedLaptops([]);
    } catch (error) {
      console.error("Error fetching rented laptops:", error);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    fetchRentedLaptops(customer.id);
  };

  const toggleLaptop = (id: number) => {
    setSelectedLaptops((prev) =>
      prev.includes(id)
        ? prev.filter((l) => l !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }

    if (selectedLaptops.length === 0) {
      alert("Select at least one laptop to return");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Find active rental
      const rentalRes = await api.get("/rentals/rental/");
      const rentals = Array.isArray(rentalRes.data)
        ? rentalRes.data
        : rentalRes.data.results || [];

      const activeRental = rentals.find(
        (r: any) =>
          (r.customer === selectedCustomer.id ||
            r.customer_detail?.id === selectedCustomer.id) &&
          r.status === "ONGOING"
      );

      if (!activeRental) {
        alert("No active rental found for this customer");
        return;
      }

      // 2️⃣ Update each laptop
      for (let laptopId of selectedLaptops) {
        // Update laptop status
        await api.patch(`/inventory/laptops/${laptopId}/`, {
          status: "AVAILABLE",
          customer: null,
        });

        // Create stock movement
        await api.post("/inventory/stockmovement/", {
          laptop: laptopId,
          movement_type: "RETURN",
          quantity: 1,
          remarks: `Returned from Rental #${activeRental.id}`,
        });
      }

      // 3️⃣ Update rental status
      await api.patch(`/rentals/rental/${activeRental.id}/`, {
        status: "RETURNED",
        actual_return_date: new Date().toISOString().split("T")[0],
      });

      alert("Return successful ✅");
      navigate("/rentals");
    } catch (error: any) {
      console.error(error.response?.data || error);
      alert("Error while returning laptops");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rental Return</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-4">
        <input
          type="text"
          placeholder="Search customer..."
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-2"
        />

        <div className="max-h-60 overflow-y-auto space-y-2">
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className={`border p-3 rounded cursor-pointer ${
                selectedCustomer?.id === c.id
                  ? "border-blue-500 bg-blue-50"
                  : ""
              }`}
              onClick={() => handleCustomerSelect(c)}
            >
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-neutral-600">📞 {c.phone}</div>
              <div className="text-sm text-neutral-600">✉ {c.email}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedCustomer && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-4">
          <h2 className="font-bold text-lg">
            Select Laptops to Return for {selectedCustomer.name}
          </h2>

          {rentedLaptops.length === 0 ? (
            <p>No rented laptops found.</p>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {rentedLaptops.map((laptop) => (
                  <label
                    key={laptop.id}
                    className="flex items-center space-x-2 border p-3 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLaptops.includes(laptop.id)}
                      onChange={() => toggleLaptop(laptop.id)}
                    />
                    <span>
                      {laptop.brand} {laptop.model} (
                      {laptop.serial_number})
                    </span>
                  </label>
                ))}
              </div>

              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Processing..." : "Submit Return"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
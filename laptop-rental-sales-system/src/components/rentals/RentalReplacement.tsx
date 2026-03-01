import React, { useEffect, useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";

export function RentalReplacement() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [rentedLaptops, setRentedLaptops] = useState<any[]>([]);
  const [availableLaptops, setAvailableLaptops] = useState<any[]>([]);

  const [oldLaptop, setOldLaptop] = useState("");
  const [newLaptop, setNewLaptop] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchAvailableLaptops();
  }, []);

  const fetchCustomers = async () => {
    const res = await api.get("/customers/customers/");
    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || [];
    setCustomers(data);
  };

  const fetchAvailableLaptops = async () => {
    const res = await api.get("/inventory/laptops/?status=AVAILABLE");
    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || [];
    setAvailableLaptops(data);
  };

  const fetchRentedLaptops = async (customerId: number) => {
    const res = await api.get(
      `/inventory/laptops/?status=RENTED&customer=${customerId}`
    );
    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || [];
    setRentedLaptops(data);
    setOldLaptop("");
    setNewLaptop("");
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    fetchRentedLaptops(customer.id);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !oldLaptop || !newLaptop) {
      alert("Select all fields");
      return;
    }

    if (oldLaptop === newLaptop) {
      alert("Old and new laptop cannot be same");
      return;
    }

    try {
      setLoading(true);

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
        alert("No active rental found");
        return;
      }

      await api.post(
        `/rentals/rental/${activeRental.id}/replace_laptop/`,
        {
          old_laptop: Number(oldLaptop),
          new_laptop: Number(newLaptop),
        }
      );

      alert("Replacement successful ✅");
      navigate("/rentals");
    } catch (error: any) {
      console.error(error.response?.data || error);
      alert("Error while saving replacement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rental Replacement</h1>

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
              className="border p-3 rounded cursor-pointer"
              onClick={() => handleCustomerSelect(c)}
            >
              <div className="font-semibold">{c.name}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedCustomer && rentedLaptops.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-4">
          <select
            value={oldLaptop}
            onChange={(e) => setOldLaptop(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Old Laptop</option>
            {rentedLaptops.map((l) => (
              <option key={l.id} value={l.id}>
                {l.brand} {l.model} ({l.serial_number})
              </option>
            ))}
          </select>

          <select
            value={newLaptop}
            onChange={(e) => setNewLaptop(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select New Laptop</option>
            {availableLaptops.map((l) => (
              <option key={l.id} value={l.id}>
                {l.brand} {l.model} ({l.serial_number})
              </option>
            ))}
          </select>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : "Submit Replacement"}
          </Button>
        </div>
      )}
    </div>
  );
}
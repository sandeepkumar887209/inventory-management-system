import React, { useEffect, useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";

interface Laptop {
  id: number;
  brand: string;
  model: string;
  serial_number: string;
  status: string; // RENTED or AVAILABLE
}

interface RentalItem {
  id: number;
  laptop: Laptop;
}

interface Rental {
  id: number;
  customer_detail: { name: string };
  items_detail: RentalItem[];
  status: string;
}

export function RentalReturn() {
  const navigate = useNavigate();

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [selectedLaptops, setSelectedLaptops] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const res = await api.get("/rentals/rental/");
      const data: Rental[] = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      // Only ongoing rentals
      setRentals(data.filter((r) => r.status === "ONGOING"));
    } catch (error) {
      console.error("Fetch rental error:", error);
    }
  };

  const handleRentalChange = (id: string) => {
    const rental = rentals.find((r) => r.id === Number(id)) || null;
    setSelectedRental(rental);
    setSelectedLaptops([]);
  };

  const handleLaptopToggle = (laptopId: number) => {
    setSelectedLaptops((prev) =>
      prev.includes(laptopId)
        ? prev.filter((id) => id !== laptopId)
        : [...prev, laptopId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedRental || selectedLaptops.length === 0) {
      alert("Please select rental and at least one laptop");
      return;
    }

    try {
      setLoading(true);

      await api.post(
        `/rentals/rental/${selectedRental.id}/return_laptops/`,
        {
          laptops: selectedLaptops,
        }
      );

      alert("Return successful");

      // Reset state
      setSelectedRental(null);
      setSelectedLaptops([]);

      // Redirect back to list
      navigate("/rentals");

    } catch (error: any) {
      console.error(error.response?.data || error);
      alert(
        "Error while saving return. Make sure the laptop is still rented and not already returned."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rental Return</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-4">
        
        {/* Rental Dropdown */}
        <div>
          <label className="block mb-2 text-sm font-medium">
            Select Rental
          </label>
          <select
            className="w-full border border-neutral-200 rounded-lg p-2"
            value={selectedRental?.id || ""}
            onChange={(e) => handleRentalChange(e.target.value)}
          >
            <option value="">-- Select Rental --</option>
            {rentals.map((r) => (
              <option key={r.id} value={r.id}>
                Rental #{r.id} - {r.customer_detail?.name}
              </option>
            ))}
          </select>
        </div>

        {/* Laptop Checkboxes */}
        {selectedRental && (
          <div>
            <label className="block mb-2 text-sm font-medium">
              Select Laptops
            </label>

            <div className="space-y-2 border rounded p-2 max-h-64 overflow-y-auto">
              {selectedRental.items_detail.map((item) => {
                const isReturned = item.laptop.status !== "RENTED";

                return (
                  <label
                    key={item.laptop.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      value={item.laptop.id}
                      checked={selectedLaptops.includes(item.laptop.id)}
                      onChange={() =>
                        handleLaptopToggle(item.laptop.id)
                      }
                      disabled={isReturned}
                    />

                    <span
                      className={
                        isReturned
                          ? "text-gray-400 line-through"
                          : ""
                      }
                    >
                      {item.laptop.brand} {item.laptop.model} (
                      {item.laptop.serial_number})
                      {isReturned && " - Already Returned"}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : "Submit Return"}
        </Button>
      </div>
    </div>
  );
}
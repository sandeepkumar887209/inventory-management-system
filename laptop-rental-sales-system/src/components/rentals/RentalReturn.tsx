import React, { useEffect, useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";

export function RentalReturn() {
  const navigate = useNavigate();

  const [rentals, setRentals] = useState<any[]>([]);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [selectedLaptop, setSelectedLaptop] = useState("");

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const res = await api.get("/rentals/rental/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setRentals(data.filter((r: any) => r.status === "ONGOING"));
    } catch (error) {
      console.error("Fetch rental error:", error);
    }
  };

  const handleRentalChange = (id: string) => {
    const rental = rentals.find((r) => r.id === Number(id));
    setSelectedRental(rental);
    setSelectedLaptop("");
  };

  const handleSubmit = async () => {
    if (!selectedRental || !selectedLaptop) {
      alert("Please select rental and laptop");
      return;
    }

    try {
      await api.post("/rentals/return/", {
        rental: selectedRental.id,
        laptop: Number(selectedLaptop),
      });

      alert("Return successful");
      navigate("/rentals");
    } catch (error: any) {
      console.error(error.response?.data || error);
      alert("Error while saving return");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rental Return</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-4">

        <div>
          <label className="block mb-2 text-sm font-medium">Select Rental</label>
          <select
            className="w-full border border-neutral-200 rounded-lg p-2"
            onChange={(e) => handleRentalChange(e.target.value)}
          >
            <option value="">-- Select Rental --</option>
            {rentals.map((r) => (
              <option key={r.id} value={r.id}>
                Rental #{r.id} - {r.customer_detail}
              </option>
            ))}
          </select>
        </div>

        {selectedRental && (
          <div>
            <label className="block mb-2 text-sm font-medium">Select Laptop</label>
            <select
              className="w-full border border-neutral-200 rounded-lg p-2"
              value={selectedLaptop}
              onChange={(e) => setSelectedLaptop(e.target.value)}
            >
              <option value="">-- Select Laptop --</option>
              {selectedRental.items_detail?.map((item: any) => (
                <option key={item.laptop} value={item.laptop}>
                  {item.laptop_detail}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button onClick={handleSubmit}>
          Submit Return
        </Button>
      </div>
    </div>
  );
}
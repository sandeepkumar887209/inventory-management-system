import React, { useEffect, useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";

export function RentalReplacement() {
  const navigate = useNavigate();

  const [rentals, setRentals] = useState<any[]>([]);
  const [availableLaptops, setAvailableLaptops] = useState<any[]>([]);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [oldLaptop, setOldLaptop] = useState("");
  const [newLaptop, setNewLaptop] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const rentalRes = await api.get("/rentals/rental/");
      const laptopRes = await api.get("/inventory/laptop/");

      const rentalData = Array.isArray(rentalRes.data)
        ? rentalRes.data
        : rentalRes.data.results || [];

      const laptopData = Array.isArray(laptopRes.data)
        ? laptopRes.data
        : laptopRes.data.results || [];

      setRentals(rentalData.filter((r: any) => r.status === "ONGOING"));
      setAvailableLaptops(
        laptopData.filter((l: any) => l.status === "AVAILABLE")
      );

    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleRentalChange = (id: string) => {
    const rental = rentals.find((r) => r.id === Number(id));
    setSelectedRental(rental);
    setOldLaptop("");
  };

  const handleSubmit = async () => {
    if (!selectedRental || !oldLaptop || !newLaptop) {
      alert("Please fill all fields");
      return;
    }

    try {
      await api.post("/rentals/replacement/", {
        rental: selectedRental.id,
        old_laptop: Number(oldLaptop),
        new_laptop: Number(newLaptop),
      });

      alert("Replacement successful");
      navigate("/rentals");

    } catch (error: any) {
      console.error(error.response?.data || error);
      alert("Error while saving replacement");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rental Replacement</h1>

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
            <label className="block mb-2 text-sm font-medium">Old Laptop</label>
            <select
              className="w-full border border-neutral-200 rounded-lg p-2"
              value={oldLaptop}
              onChange={(e) => setOldLaptop(e.target.value)}
            >
              <option value="">-- Select Old Laptop --</option>
              {selectedRental.items_detail?.map((item: any) => (
                <option key={item.laptop} value={item.laptop}>
                  {item.laptop_detail}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block mb-2 text-sm font-medium">New Laptop</label>
          <select
            className="w-full border border-neutral-200 rounded-lg p-2"
            value={newLaptop}
            onChange={(e) => setNewLaptop(e.target.value)}
          >
            <option value="">-- Select New Laptop --</option>
            {availableLaptops.map((l) => (
              <option key={l.id} value={l.id}>
                {l.serial_number}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handleSubmit}>
          Submit Replacement
        </Button>

      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";

export function CreateRental() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [customers, setCustomers] = useState<any[]>([]);
  const [laptops, setLaptops] = useState<any[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [laptopSearch, setLaptopSearch] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedLaptops, setSelectedLaptops] = useState<any[]>([]);

  const [gst, setGst] = useState(18);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const c = await api.get("/customers/customers");
      const l = await api.get("/inventory/laptops/?status=AVAILABLE");

      setCustomers(c.data.results || c.data);
      setLaptops(l.data.results || l.data);
    } catch (error) {
      console.error("Load error:", error);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredLaptops = laptops.filter(
    (l) =>
      l.brand.toLowerCase().includes(laptopSearch.toLowerCase()) ||
      l.model.toLowerCase().includes(laptopSearch.toLowerCase())
  );

  const toggleLaptop = (laptop: any) => {
    const exists = selectedLaptops.find((l) => l.id === laptop.id);

    if (exists) {
      setSelectedLaptops(selectedLaptops.filter((l) => l.id !== laptop.id));
    } else {
      setSelectedLaptops([
        ...selectedLaptops,
        {
          ...laptop,
          actual_price: laptop.rent_per_month,
          discounted_price: laptop.rent_per_month,
        },
      ]);
    }
  };

  const updateDiscountedPrice = (id: number, value: number) => {
    setSelectedLaptops(
      selectedLaptops.map((l) =>
        l.id === id ? { ...l, discounted_price: value } : l
      )
    );
  };

  const subtotal = selectedLaptops.reduce(
    (sum, l) => sum + Number(l.discounted_price),
    0
  );

  const gstAmount = (subtotal * gst) / 100;
  const total = subtotal + gstAmount;

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      alert("Please select customer");
      return;
    }

    if (selectedLaptops.length === 0) {
      alert("Please select at least one laptop");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customer: selectedCustomer.id,
        expected_return_date: new Date().toISOString().split("T")[0],
        gst: gst,
        subtotal: subtotal,
        total_amount: total,
        items: selectedLaptops.map((l) => ({
          laptop_id: l.id,   // 🔥 THIS IS THE FIX
          rent_price: l.discounted_price,
        })),
      };

      console.log("Sending Payload:", payload);

      await api.post("/rentals/rental/", payload);

      alert("Rental Created Successfully ✅");

      navigate("/rentals");

    } catch (error: any) {
      console.error("Backend Error:", error.response?.data);
      alert(
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Error creating rental"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border space-y-6 max-w-5xl mx-auto">

      <h2 className="text-2xl font-bold text-center">Create Rental</h2>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 1: Select Customer</h3>

          <input
            type="text"
            placeholder="Search customer..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />

          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={`border p-4 rounded cursor-pointer ${
                  selectedCustomer?.id === c.id
                    ? "border-blue-500 bg-blue-50"
                    : ""
                }`}
              >
                <div className="font-semibold text-lg">{c.name}</div>
                <div className="text-sm text-neutral-600">📞 {c.phone}</div>
                <div className="text-sm text-neutral-600">✉ {c.email}</div>
                <div className="text-sm text-neutral-600">🏢 {c.company}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!selectedCustomer}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 2: Select Laptop(s)</h3>

          <input
            type="text"
            placeholder="Search laptop..."
            value={laptopSearch}
            onChange={(e) => setLaptopSearch(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />

          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredLaptops.map((l) => (
              <div
                key={l.id}
                onClick={() => toggleLaptop(l)}
                className={`border p-4 rounded cursor-pointer ${
                  selectedLaptops.find((x) => x.id === l.id)
                    ? "border-blue-500 bg-blue-50"
                    : ""
                }`}
              >
                <div className="font-semibold">
                  {l.brand} {l.model}
                </div>
                <div className="text-sm text-neutral-600">
                  Serial: {l.serial_number}
                </div>
                <div className="text-sm text-neutral-600">
                  Rent: ₹{l.rent_per_month}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button onClick={() => setStep(1)}>Previous</Button>
            <Button onClick={() => setStep(3)} disabled={selectedLaptops.length === 0}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Step 3: Pricing</h3>

          {selectedLaptops.map((l) => (
            <div key={l.id} className="border p-4 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {l.brand} {l.model}
                </div>
                <div className="text-sm text-neutral-500">
                  Actual Price: ₹{l.actual_price}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">
                  Discounted Price (₹)
                </label>
                <input
                  type="number"
                  value={l.discounted_price}
                  onChange={(e) =>
                    updateDiscountedPrice(l.id, Number(e.target.value))
                  }
                  className="border px-2 py-1 rounded w-40"
                />
              </div>
            </div>
          ))}

          <div>
            <label className="font-medium">GST %</label>
            <input
              type="number"
              value={gst}
              onChange={(e) => setGst(Number(e.target.value))}
              className="border px-3 py-2 rounded w-full mt-1"
            />
          </div>

          <div className="flex justify-between">
            <Button onClick={() => setStep(2)}>Previous</Button>
            <Button onClick={() => setStep(4)}>Next</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 bg-neutral-50 p-6 rounded border">

          <h3 className="text-xl font-bold text-center">Invoice Preview</h3>

          <div className="space-y-1">
            <div><strong>Customer:</strong> {selectedCustomer.name}</div>
            <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
            <div><strong>Email:</strong> {selectedCustomer.email}</div>
          </div>

          <table className="w-full border mt-4">
            <thead className="bg-white">
              <tr>
                <th className="p-2 text-left">Laptop</th>
                <th className="p-2 text-left">Actual</th>
                <th className="p-2 text-left">Discounted</th>
              </tr>
            </thead>
            <tbody>
              {selectedLaptops.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-2">
                    {l.brand} {l.model}
                  </td>
                  <td className="p-2">₹{l.actual_price}</td>
                  <td className="p-2">₹{l.discounted_price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="flex justify-between">
            <span>GST</span>
            <span>₹{gstAmount}</span>
          </div>

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{total}</span>
          </div>

          <div className="flex justify-between mt-4">
            <Button onClick={() => setStep(3)}>Previous</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Confirm Rental"}
            </Button>
          </div>

        </div>
      )}
    </div>
  );
}
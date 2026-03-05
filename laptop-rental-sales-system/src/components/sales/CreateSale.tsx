import { useEffect, useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";

export function CreateSale() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [laptops, setLaptops] = useState<any[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [items, setItems] = useState<any[]>([]);

  const [gst, setGst] = useState(18);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchLaptops();
  }, []);

  const fetchCustomers = async () => {
    const res = await api.get("/customers/customers/");
    const data = Array.isArray(res.data) ? res.data : res.data.results || [];
    setCustomers(data);
  };

  const fetchLaptops = async () => {
    const res = await api.get("/inventory/laptops/?status=AVAILABLE");
    const data = Array.isArray(res.data) ? res.data : res.data.results || [];
    setLaptops(data);
  };

  const toggleLaptop = (laptop: any) => {
    const exists = items.find((i) => i.laptop_id === laptop.id);

    if (exists) {
      setItems(items.filter((i) => i.laptop_id !== laptop.id));
    } else {
      setItems([
        ...items,
        {
          laptop_id: laptop.id,
          brand: laptop.brand,
          model: laptop.model,
          serial_number: laptop.serial_number,
          base_price: laptop.price || 0,
          sale_price: laptop.price || 0,
        },
      ]);
    }
  };

  const updatePrice = (index: number, value: number) => {
    const updated = [...items];
    updated[index].sale_price = value;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, i) => sum + Number(i.sale_price), 0);

  const gstAmount = (subtotal * gst) / 100;

  const total = subtotal + gstAmount;

  const handleSubmit = async () => {
    if (!selectedCustomer || items.length === 0) {
      alert("Please select customer and laptop");
      return;
    }

    try {
      setLoading(true);

      await api.post("/sales/sale/", {
        customer: Number(selectedCustomer),
        gst: gst,
        items: items.map((i) => ({
          laptop_id: i.laptop_id,
          sale_price: i.sale_price,
        })),
      });

      alert("Sale created successfully ✅");

      navigate("/sales");

    } catch (error) {
      console.error(error);
      alert("Error creating sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Create Sale</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">

        {/* Customer */}
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Select Customer</option>

          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Laptop List */}
        <div className="max-h-60 overflow-y-auto space-y-2 border p-3 rounded">

          {laptops.map((l) => {
            const checked = items.find((i) => i.laptop_id === l.id);

            return (
              <label
                key={l.id}
                className="flex items-center space-x-2 border p-2 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!checked}
                  onChange={() => toggleLaptop(l)}
                />

                <span className="flex-1">
                  {l.brand} {l.model} ({l.serial_number})
                </span>

                <span className="text-sm text-gray-500">
                  ₹{l.price}
                </span>
              </label>
            );
          })}

        </div>

        {/* Selected Items */}
        {items.length > 0 && (

          <div className="border rounded p-4 space-y-3">

            <h2 className="font-semibold">Selected Laptops</h2>

            {items.map((item, index) => (

              <div
                key={item.laptop_id}
                className="flex items-center justify-between gap-3 border p-2 rounded"
              >

                <div className="flex-1">

                  {item.brand} {item.model} ({item.serial_number})

                  <div className="text-sm text-gray-500">
                    Base Price: ₹{item.base_price}
                  </div>

                </div>

                <input
                  type="number"
                  value={item.sale_price}
                  onChange={(e) =>
                    updatePrice(index, Number(e.target.value))
                  }
                  className="border p-1 rounded w-32"
                />

              </div>

            ))}

          </div>

        )}

        {/* GST */}
        <div className="flex items-center gap-3">

          <span>GST %</span>

          <input
            type="number"
            value={gst}
            onChange={(e) => setGst(Number(e.target.value))}
            className="border p-2 rounded w-24"
          />

        </div>

        {/* Summary */}
        <div className="border rounded p-4 space-y-2">

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>GST</span>
            <span>₹{gstAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

        </div>

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Create Sale"}
        </Button>

      </div>

    </div>
  );
}
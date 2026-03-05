import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../common/Button";
import api from "../../services/axios";

export function CustomerForm({ onSuccess }: any) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    customer_type: "individual",
    phone: "",
    email: "",
    address: "",
  });

  const handleSubmit = async () => {
    try {
      await api.post("/customers/customers/", form);
      alert("Customer Created Successfully ✅");
      onSuccess();
    } catch (err) {
      alert("Error creating customer");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold">Add Customer</h2>

      <input
        className="border px-3 py-2 rounded w-full"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <select
        className="border px-3 py-2 rounded w-full"
        value={form.customer_type}
        onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
      >
        <option value="individual">Individual</option>
        <option value="company">Company</option>
      </select>

      <input
        className="border px-3 py-2 rounded w-full"
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      <input
        className="border px-3 py-2 rounded w-full"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <textarea
        className="border px-3 py-2 rounded w-full"
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />

      <div className="flex gap-2">
        <Button onClick={handleSubmit}>Save</Button>
        <Button variant="secondary" onClick={() => navigate("/customers")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
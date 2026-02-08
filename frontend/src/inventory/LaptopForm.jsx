import { useState } from "react";
import api from "../api/axios";

export default function LaptopForm() {
  const [data, setData] = useState({
    brand: "",
    model: "",
    serial_number: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    await api.post("/inventory/laptops/", data);
    alert("Laptop added ✅");
  };

  return (
    <form onSubmit={submit}>
      <input placeholder="Brand" onChange={(e) => setData({ ...data, brand: e.target.value })} />
      <input placeholder="Model" onChange={(e) => setData({ ...data, model: e.target.value })} />
      <input placeholder="Serial" onChange={(e) => setData({ ...data, serial_number: e.target.value })} />
      <button>Add</button>
    </form>
  );
}

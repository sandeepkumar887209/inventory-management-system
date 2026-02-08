import { useState } from "react";
import api from "../api/axios";

export default function StockMovement() {
  const [data, setData] = useState({
    laptop: "",
    movement_type: "IN",
    remarks: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    await api.post("/inventory/stock-movements/", data);
    alert("Stock updated ✅");
  };

  return (
    <form onSubmit={submit}>
      <input placeholder="Laptop ID" onChange={(e) => setData({ ...data, laptop: e.target.value })} />
      <select onChange={(e) => setData({ ...data, movement_type: e.target.value })}>
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
      </select>
      <textarea onChange={(e) => setData({ ...data, remarks: e.target.value })} />
      <button>Submit</button>
    </form>
  );
}

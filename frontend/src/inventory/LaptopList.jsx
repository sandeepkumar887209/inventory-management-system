import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function LaptopList() {
  const [laptops, setLaptops] = useState([]);

  useEffect(() => {
    api.get("/inventory/laptops/").then((res) => {
      setLaptops(res.data.results || res.data);
    });
  }, []);

  return (
    <div>
      <h2>Laptops</h2>
      <Link to="/inventory/create">+ Add Laptop</Link>

      <ul>
        {laptops.map((l) => (
          <li key={l.id}>
            {l.brand} {l.model} — {l.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

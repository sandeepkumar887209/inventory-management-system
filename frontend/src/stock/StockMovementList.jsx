import { useEffect, useState } from "react";
import axios from "../api/axios";
import { Link } from "react-router-dom";

export default function StockMovementList() {
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/inventory/stock-movements/")
      .then((res) => setMovements(res.data))
      .catch(() => setError("Failed to load stock movements"));
  }, []);

  return (
    <div>
      <h2>Stock Movements</h2>

      <Link to="/stock/create">+ New Movement</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border="1" cellPadding="8" style={{ marginTop: "10px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Laptop</th>
            <th>Type</th>
            <th>Remarks</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>
                {m.laptop?.brand} {m.laptop?.model}
              </td>
              <td>{m.movement_type}</td>
              <td>{m.remarks || "-"}</td>
              <td>{new Date(m.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

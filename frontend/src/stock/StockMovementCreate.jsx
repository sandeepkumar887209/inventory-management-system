import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function StockMovementCreate() {
  const navigate = useNavigate();

  const [laptops, setLaptops] = useState([]);
  const [laptop, setLaptop] = useState("");
  const [movementType, setMovementType] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/inventory/laptops/")
      .then((res) => setLaptops(res.data))
      .catch(() => setError("Failed to load laptops"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("/inventory/stock-movements/", {
        laptop,
        movement_type: movementType,
        remarks,
      });
      navigate("/stock");
    } catch {
      setError("Failed to create stock movement");
    }
  };

  return (
    <div>
      <h2>Create Stock Movement</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Laptop</label>
          <br />
          <select
            value={laptop}
            onChange={(e) => setLaptop(e.target.value)}
            required
          >
            <option value="">-- Select Laptop --</option>
            {laptops.map((l) => (
              <option key={l.id} value={l.id}>
                {l.brand} {l.model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Movement Type</label>
          <br />
          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            required
          >
            <option value="">-- Select Type --</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="RETURN">RETURN</option>
            <option value="DAMAGE">DAMAGE</option>
          </select>
        </div>

        <div>
          <label>Remarks</label>
          <br />
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <br />
        <button type="submit">Save</button>
      </form>
    </div>
  );
}

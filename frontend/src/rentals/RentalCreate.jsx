import { useEffect, useState } from "react";
import api from "../api/axios";

export default function RentalCreate() {
  const [customers, setCustomers] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const customerRes = await api.get("customers/customers/");
      const laptopRes = await api.get(
        "inventory/laptops/?status=AVAILABLE"
      );

      console.log("Customers API:", customerRes.data);
      console.log("Laptops API:", laptopRes.data);

      setCustomers(
        Array.isArray(customerRes.data)
          ? customerRes.data
          : customerRes.data.results || []
      );

      setLaptops(
        Array.isArray(laptopRes.data)
          ? laptopRes.data
          : laptopRes.data.results || []
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    }
  };

  if (error) {
    return <h3 style={{ color: "red" }}>{error}</h3>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Create Rental</h2>

      <div>
        <label>Customer</label>
        <br />
        <select>
          <option value="">-- Select Customer --</option>
          {customers.length === 0 && (
            <option>No customers found</option>
          )}
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || c.company_name || "Unnamed"}
            </option>
          ))}
        </select>
      </div>

      <br />

      <div>
        <label>Laptop</label>
        <br />
        <select>
          <option value="">-- Select Laptop --</option>
          {laptops.length === 0 && (
            <option>No laptops available</option>
          )}
          {laptops.map((l) => (
            <option key={l.id} value={l.id}>
              {l.brand} {l.model}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

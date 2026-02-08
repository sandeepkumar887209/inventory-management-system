import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function RentalList() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/rentals/rental/")
      .then(res => {
        setRentals(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load rentals", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading rentals...</p>;

  return (
    <div>
      <h2>Rentals</h2>

      <Link to="/rentals/create">
        <button>+ New Rental</button>
      </Link>

      <table border="1" cellPadding="10" style={{ marginTop: "10px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Laptop</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {rentals.map(rental => (
            <tr key={rental.id}>
              <td>{rental.id}</td>

              {/* ✅ CUSTOMER NAME */}
              <td>{rental.customer?.name}</td>

              {/* ✅ LAPTOP BRAND + MODEL */}
              <td>
                {rental.laptop?.brand} {rental.laptop?.model}
              </td>

              <td>{rental.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

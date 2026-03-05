import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";
import { Badge } from "../common/Badge";

export function RentalDetail() {
  const { id } = useParams();
  const [rental, setRental] = useState<any>(null);

  useEffect(() => {
    fetchRental();
  }, []);

  const fetchRental = async () => {
    try {
      const res = await api.get(`/rentals/rental/${id}/`);
      setRental(res.data);
      console.log(res.data);
    } catch (error) {
      console.error("Error fetching rental detail:", error);
    }
  };

  if (!rental) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Rental #{rental.id}</h1>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        {/* Customer Info */}
        <div>
          <strong>Customer:</strong> {rental.customer_detail.name}
        </div>

        <div>
          <strong>Status:</strong>{" "}
          {rental.status === "ONGOING" ? (
            <Badge variant="success">Ongoing</Badge>
          ) : rental.status === "RETURNED" ? (
            <Badge variant="info">Returned</Badge>
          ) : (
            <Badge variant="warning">Replaced</Badge>
          )}
        </div>

        <div>
          <strong>Rent Start Date:</strong> {rental.rent_date}
        </div>

        <hr />

        <h2 className="font-semibold text-lg">Rental Items</h2>

        {/* Rental Items Table */}
        {rental.items_detail && rental.items_detail.length > 0 ? (
          <table className="w-full border">
            <thead>
              <tr className="bg-neutral-100">
                <th className="p-2 text-left">Laptop</th>
                <th className="p-2 text-left">Rent Price</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rental.items_detail.map((item: any) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">
                    {item.laptop.brand} {item.laptop.model} ({item.laptop.processor},{" "}
                    {item.laptop.ram}, {item.laptop.storage})
                  </td>
                  <td className="p-2">₹{item.rent_price}</td>
                  <td className="p-2">
                    {item.laptop.status === "RENTED" ? (
                      <Badge variant="success">Rented</Badge>
                    ) : (
                      <Badge variant="info">{item.laptop.status}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No rental items found</div>
        )}

        <hr />

        {/* Payment Summary */}
        <div className="space-y-2">
          <div>
            <strong>Subtotal:</strong> ₹{rental.subtotal}
          </div>

          <div>
            <strong>GST (%):</strong> {rental.gst}%
          </div>

          <div className="font-bold text-lg">
            Total: ₹{rental.total_amount}
          </div>
        </div>
      </div>
    </div>
  );
}
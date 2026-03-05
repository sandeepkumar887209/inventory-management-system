import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";

export function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await api.get(`/customers/customers/${id}/rentals/`);
    setData(res.data);
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Customer Details</h2>

      <div className="bg-white p-6 rounded-xl border space-y-2">
        <div>Total Rentals: {data.total_rentals}</div>
        <div>Active Rentals: {data.active_rentals}</div>
        <div>Returned Rentals: {data.returned_rentals}</div>
        <div>Total Revenue: ₹{data.total_revenue}</div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3 text-left">Rental ID</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Subtotal</th>
              <th className="p-3 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.rentals.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">#{r.id}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">₹{r.subtotal}</td>
                <td className="p-3">₹{r.total_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";

export function SalesList({ onCreateNew, onViewInvoice }: any) {

  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {

    const res = await api.get("/sales/sale/");

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || [];

    setSales(data);
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between">

        <h1 className="text-2xl font-bold">Sales</h1>

        <Button onClick={onCreateNew}>
          Create Sale
        </Button>

      </div>

      <div className="bg-white rounded-xl shadow border">

        <table className="w-full">

          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">Sale ID</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Subtotal</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>

            {sales.map((sale) => (

              <tr key={sale.id} className="border-b">

                <td className="p-3">
                  #{sale.id}
                </td>

                <td className="p-3">
                  {sale.customer_detail?.name}
                </td>

                <td className="p-3">
                  {sale.total_items}
                </td>

                <td className="p-3">
                  ₹{sale.subtotal}
                </td>

                <td className="p-3 font-semibold">
                  ₹{sale.total_amount}
                </td>

                <td className="p-3">
                  {sale.created_at?.split("T")[0]}
                </td>

                <td className="p-3">

                  <Button
                    onClick={() => onViewInvoice(sale)}
                  >
                    View
                  </Button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
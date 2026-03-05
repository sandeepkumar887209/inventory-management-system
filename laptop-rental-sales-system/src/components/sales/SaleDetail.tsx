import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";

export function SaleDetail() {

  const { id } = useParams();

  const [sale, setSale] = useState<any>(null);

  useEffect(() => {
    fetchSale();
  }, []);

  const fetchSale = async () => {

    const res = await api.get(`/sales/sale/${id}/`);

    setSale(res.data);

  };

  if (!sale) return <p>Loading...</p>;

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        Sale Invoice #{sale.id}
      </h1>

      {/* Customer Info */}

      <div className="bg-white p-6 rounded-xl shadow border space-y-2">

        <p>
          <b>Customer:</b> {sale.customer_detail?.name}
        </p>

        <p>
          <b>Email:</b> {sale.customer_detail?.email}
        </p>

        <p>
          <b>Phone:</b> {sale.customer_detail?.phone}
        </p>

        <p>
          <b>Date:</b> {sale.created_at?.split("T")[0]}
        </p>

      </div>


      {/* Items */}

      <div className="bg-white p-6 rounded-xl shadow border">

        <h2 className="font-bold mb-4">
          Laptops Sold
        </h2>

        <table className="w-full">

          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Brand</th>
              <th className="p-2 text-left">Model</th>
              <th className="p-2 text-left">Serial</th>
              <th className="p-2 text-left">Price</th>
            </tr>
          </thead>

          <tbody>

            {sale.items_detail?.map((item: any) => (

              <tr key={item.id} className="border-b">

                <td className="p-2">
                  {item.laptop?.brand}
                </td>

                <td className="p-2">
                  {item.laptop?.model}
                </td>

                <td className="p-2">
                  {item.laptop?.serial_number}
                </td>

                <td className="p-2 font-semibold">
                  ₹{item.sale_price}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>


      {/* Price Summary */}

      <div className="bg-white p-6 rounded-xl shadow border space-y-2">

        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{sale.subtotal}</span>
        </div>

        <div className="flex justify-between">
          <span>GST ({sale.gst}%)</span>
          <span>
            ₹{((sale.subtotal * sale.gst) / 100).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-lg font-bold">
          <span>Total Amount</span>
          <span>₹{sale.total_amount}</span>
        </div>

      </div>

    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInvoice } from "../../services/invoice";

export function InvoiceDetail() {

  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {

    const res = await getInvoice(id);
    setInvoice(res.data);

  };

  if (!invoice) return <p>Loading...</p>;

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        Invoice #{invoice.invoice_number || invoice.id}
      </h1>

      <div className="bg-white p-6 rounded-xl shadow border">

        <p>
          <b>Customer:</b> {invoice.customer_detail?.name}
        </p>

        <p>
          <b>Date:</b> {invoice.created_at}
        </p>

      </div>

      <div className="bg-white p-6 rounded-xl shadow border">

        <table className="w-full">

          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Qty</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Total</th>
            </tr>
          </thead>

          <tbody>

            {invoice.items_detail?.map((item: any) => (

              <tr key={item.id} className="border-b">

                <td className="p-2">{item.description}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2">₹{item.price}</td>
                <td className="p-2">₹{item.total}</td>

              </tr>

            ))}

          </tbody>

        </table>

        <div className="text-right mt-4">

          <p>Subtotal: ₹{invoice.subtotal}</p>
          <p>GST: ₹{invoice.gst_amount}</p>
          <p className="font-bold">
            Total: ₹{invoice.total_amount}
          </p>

        </div>

      </div>

    </div>
  );
}
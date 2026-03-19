export function InvoicePrint({ invoice }: any) {

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold">
        Invoice #{invoice.id}
      </h1>

      <p>
        Customer: {invoice.customer_detail?.name}
      </p>

      <table className="w-full mt-6 border">

        <thead>
          <tr>
            <th>Laptop</th>
            <th>Serial</th>
            <th>Price</th>
          </tr>
        </thead>

        <tbody>

          {invoice.items_detail?.map((item: any) => (

            <tr key={item.id}>

              <td>
                {item.laptop?.brand} {item.laptop?.model}
              </td>

              <td>
                {item.laptop?.serial_number}
              </td>

              <td>
                ₹{item.sale_price}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <h2 className="text-xl font-bold mt-6">
        Total ₹{invoice.total_amount}
      </h2>

    </div>
  );
}
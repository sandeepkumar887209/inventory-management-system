import api from "./axios";

export const getInvoices = (params = {}) => api.get("/invoices/invoice/", { params });

export const getInvoice = (id) => api.get(`/invoices/invoice/${id}/`);

export const createInvoice = (data) => api.post("/invoices/invoice/", data);

export const updateInvoice = (id, data) => api.put(`/invoices/invoice/${id}/`, data);

export const deleteInvoice = (id) => api.delete(`/invoices/invoice/${id}/`);

export const updateInvoiceStatus = (id, status) =>
  api.patch(`/invoices/invoice/${id}/update-status/`, { status });

export const getInvoiceSummary = (params = {}) =>
  api.get("/invoices/invoice/summary/", { params });

export const downloadInvoicePDF = async (id, invoiceNumber) => {
  const response = await api.get(`/invoices/invoice/${id}/pdf/`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `invoice_${invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const sendInvoiceEmail = (id, email = null) =>
  api.post(`/invoices/invoice/${id}/send-email/`, email ? { email } : {});
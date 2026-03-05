import api from "./axios";

export const getSales = () => api.get("/sales/sale/");
export const getSale = (id) => api.get(`/sales/sale/${id}/`);
export const createSale = (data) => api.post("/sales/sale/", data);
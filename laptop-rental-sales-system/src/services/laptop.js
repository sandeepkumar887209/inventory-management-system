import api from "./axios";

export const getAvailableLaptops = () =>
  api.get("/inventory/laptops/?status=AVAILABLE");

export const updateLaptopStatus = (id, data) =>
  api.patch(`/inventory/laptops/${id}/`, data);
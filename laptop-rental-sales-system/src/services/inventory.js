import api from "./axios";

/* 📦 GET ALL LAPTOPS */
export const getLaptops = () => {
  return api.get("/inventory/laptops/");
};

/* ➕ CREATE LAPTOP */
export const createLaptop = (data) => {
  return api.post("/inventory/laptops/", data);
};

/* ✏️ UPDATE LAPTOP */
export const updateLaptop = (id, data) => {
  return api.put(`/inventory/laptops/${id}/`, data);
};

/* ❌ DELETE LAPTOP */
export const deleteLaptop = (id) => {
  return api.delete(`/inventory/laptops/${id}/`);
};

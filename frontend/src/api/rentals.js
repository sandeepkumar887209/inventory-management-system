import api from "./axios";

export const getRentals = () => api.get("/rentals/rental/");

export const createRental = (data) =>
  api.post("/rentals/rental/", data);

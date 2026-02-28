import api from "./axios";

export const getRentals = () => {
  return api.get("/rentals/");
};

export const createRental = (data) => {
  return api.post("/rentals/", data);
};

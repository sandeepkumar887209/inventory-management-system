import api from "./axios";

export const createStockMovement = (data) =>
  api.post("/inventory/stockmovement/", data);
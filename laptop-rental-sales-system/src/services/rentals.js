import api from "./axios";

/* ── RENTALS ── */
export const getRentals = (params = {}) =>
  api.get("/rentals/rental/", { params });

export const getRental = (id) =>
  api.get(`/rentals/rental/${id}/`);

export const createRental = (data) =>
  api.post("/rentals/rental/", data);

export const updateRental = (id, data) =>
  api.patch(`/rentals/rental/${id}/`, data);

/* ── RENTAL ITEMS (ledger) ── */
export const getRentalItems = (params = {}) =>
  api.get("/rentals/rental-items/", { params });

/* ── RETURNS & REPLACEMENTS ── */
export const returnLaptops = (rentalId, laptopIds) =>
  api.post(`/rentals/rental/${rentalId}/return_laptops/`, {
    laptops: laptopIds,
  });

export const replaceLaptop = (rentalId, oldLaptopId, newLaptopId) =>
  api.post(`/rentals/rental/${rentalId}/replace_laptop/`, {
    old_laptop: oldLaptopId,
    new_laptop: newLaptopId,
  });

/* ── ALERTS (computed client-side from rental list) ── */
export const getRentalAlerts = async () => {
  const res = await api.get("/rentals/rental/");
  const rentals = Array.isArray(res.data) ? res.data : res.data.results || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = [];
  const expiringSoon = [];

  rentals
    .filter((r) => r.status === "ONGOING")
    .forEach((r) => {
      if (!r.expected_return_date) return;
      const due = new Date(r.expected_return_date);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        overdue.push({ ...r, days_overdue: Math.abs(diffDays) });
      } else if (diffDays <= 7) {
        expiringSoon.push({ ...r, days_until_due: diffDays });
      }
    });

  return { overdue, expiringSoon };
};

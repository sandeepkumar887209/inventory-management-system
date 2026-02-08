import api from "./axios";

export const loginUser = async (data) => {
  const response = await api.post("/login/", data);

  localStorage.setItem("access", response.data.access);
  localStorage.setItem("refresh", response.data.refresh);

  return response.data;
};

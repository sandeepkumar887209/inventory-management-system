import api from "./axios";

/* 🔐 LOGIN */
export const loginApi = async ({ username, password }) => {
  const response = await api.post("login/", {
    username,
    password,
  });

  return response.data;
};

/* 🚪 LOGOUT (frontend-side) */
export const logoutApi = async () => {
  localStorage.clear();
  return true;
};

/* 👤 GET LOGGED-IN USER (use when backend provides it) */
export const getProfileApi = async () => {
  const response = await api.get("profile/");
  return response.data;
};

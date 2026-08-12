import api from "./axios";

/* 🔐 LOGIN */
export const loginApi = async ({ username, password }) => {
  const response = await api.post("login/", {
    username,
    password,
  });

  return response.data;
};

/* 📝 REGISTER (public — creates pending user) */
export const registerApi = async ({ username, email, password, fullName, company, role }) => {
  const response = await api.post("accounts/register/", {
    username,
    email,
    password,
    full_name: fullName,
    company: company || "",
    role: role || "Staff",
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
  const response = await api.get("accounts/profile/");
  return response.data;
};

/* ✏️ UPDATE SELF PROFILE */
export const updateProfileApi = async (data) => {
  const response = await api.patch("accounts/profile/", data);
  return response.data;
};

/* 🏢 COMPANY SETTINGS */
export const getCompanySettingsApi = async () => {
  const response = await api.get("common/company-settings/current/");
  return response.data;
};

export const updateCompanySettingsApi = async (data) => {
  const isMultipart = data instanceof FormData;
  const response = await api.patch("common/company-settings/current/", data, {
    headers: {
      "Content-Type": isMultipart ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

/* 📋 ADMIN: Get all users */
export const getUsersApi = async (params = {}) => {
  const response = await api.get("accounts/users/", { params });
  return response.data;
};

/* ✅ ADMIN: Approve user */
export const approveUserApi = async (userId, data = {}) => {
  const response = await api.post(`accounts/users/${userId}/approve/`, data);
  return response.data;
};

/* ❌ ADMIN: Reject user */
export const rejectUserApi = async (userId) => {
  const response = await api.post(`accounts/users/${userId}/reject/`);
  return response.data;
};

/* 🗑️ ADMIN: Delete user */
export const deleteUserApi = async (userId) => {
  const response = await api.delete(`accounts/users/${userId}/delete/`);
  return response.data;
};

/* ➕ ADMIN: Create user directly (approved) */
export const createUserApi = async (data) => {
  const response = await api.post('accounts/users/create/', data);
  return response.data;
};

/* ✏️ ADMIN: Update user profile */
export const updateUserApi = async (userId, data) => {
  const response = await api.patch(`accounts/users/${userId}/update/`, data);
  return response.data;
};

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

const getAccessToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("velora_token");

const getRefreshToken = () =>
  localStorage.getItem("refresh_token") || localStorage.getItem("velora_refresh_token");

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error("Missing refresh token");
        }

        const { data } = await axios.post("/api/refresh", {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        const nextToken = data.access_token;
        localStorage.setItem("access_token", nextToken);
        localStorage.removeItem("velora_token");
        original.headers.Authorization = `Bearer ${nextToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("velora_token");
        localStorage.removeItem("velora_refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    const message =
      error.response?.data?.error ||
      error.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;

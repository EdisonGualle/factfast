import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Instancia principal de Axios con interceptores
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de request — adjunta el JWT automáticamente
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("factfast_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta — manejo global de errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Refresh token automático si el JWT expiró
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("factfast_refresh");
        if (!refreshToken) throw new Error("Sin refresh token");

        const { data } = await axios.post(`${API_URL}/autenticacion/refrescar`, {
          token_refresh: refreshToken,
        });

        localStorage.setItem("factfast_token", data.token_acceso);
        localStorage.setItem("factfast_refresh", data.token_refresh);
        document.cookie = `token=${data.token_acceso}; path=/; max-age=604800; SameSite=Lax; Secure`;

        originalRequest.headers.Authorization = `Bearer ${data.token_acceso}`;
        return api(originalRequest);
      } catch {
        // Si el refresh falla, redirige al login
        localStorage.removeItem("factfast_token");
        localStorage.removeItem("factfast_refresh");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Decodifica el payload de un JWT sin validar la firma.
 */
export function decodificarJwt(token: string) {
  try {
    const partes = token.split(".");
    if (partes.length !== 3) return null;
    const payloadJson = atob(partes[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payloadJson);
  } catch (e) {
    return null;
  }
}

// lib/api-client.ts (or your current file path)
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { auth } from "./firebase";
import { handleApiError } from "./error-handler";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "flowshare-user-token";
const TOKEN_EXPIRES_AT_KEY = "flowshare-user-token-expires-at";

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getValidToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401/403 due to expired/missing token
        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearStoredToken();
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login";
            }
            return Promise.reject(refreshError);
          }
        }

        // Add user-friendly error to the error object
        const appError = handleApiError(error);
        (error as any).appError = appError;

        return Promise.reject(error);
      }
    );
  }

  private async getValidToken(): Promise<string | null> {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    const expiresAtStr = sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY);

    if (storedToken && expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();

      // If token expires in more than 5 minutes, use it
      if (expiresAt - now > 5 * 60 * 1000) {
        return storedToken;
      }
    }

    // Otherwise, refresh from Firebase
    return await this.refreshToken();
  }

  private async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refreshes
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const user = auth.currentUser;
      if (!user) {
        this.clearStoredToken();
        throw new Error("No authenticated user");
      }

      // Force refresh to get a new token (important for security)
      const token = await user.getIdToken(true); // `true` forces refresh
      const decoded = await user.getIdTokenResult();
      const expiresAt = decoded.expirationTime
        ? new Date(decoded.expirationTime).getTime()
        : Date.now() + 60 * 60 * 1000; // fallback: 1 hour

      // Save to sessionStorage
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt.toString());

      this.isRefreshing = false;
      this.refreshSubscribers.forEach((callback) => callback(token));
      this.refreshSubscribers = [];

      return token;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshSubscribers = [];
      this.clearStoredToken();
      throw error;
    }
  }

  private clearStoredToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  }

  // --- HTTP Methods ---
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // Public method to get auth headers for external fetch requests
  async getAuthHeaders(): Promise<{ Authorization: string } | {}> {
    const token = await this.getValidToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }
}

export const apiClient = new ApiClient();

import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  // httpOnly refresh cookie'sinin cross-origin gönderilmesi için zorunlu
  withCredentials: true,
});

// ─── Request: bearer token attach ───
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response: 401 → refresh → retry ───
//
// Akış:
// 1. Bir istek 401 döndürürse:
//    - /auth/refresh dene (cookie otomatik gider, withCredentials: true sağolsun)
//    - Yeni access token gelirse → orijinal isteği yeni token ile retry et
//    - Refresh de başarısızsa → localStorage temizle + /login'e yönlendir
// 2. Refresh sırasında concurrent 401 fırtınası olursa: tek bir refresh promise'i paylaşılır.

let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await axios.post(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const token = res.data?.access_token as string | undefined;
      if (!token) return null;
      localStorage.setItem('token', token);
      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      return token;
    } catch {
      return null;
    } finally {
      // Sonraki 401'de yeniden refresh yapılabilsin
      setTimeout(() => { refreshPromise = null; }, 0);
    }
  })();
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = original?.url?.includes('/auth/refresh') || original?.url?.includes('/auth/logout');

    // 401 ve henüz retry edilmemişse: refresh dene
    if (status === 401 && original && !original._retry && !isAuthEndpoint && typeof window !== 'undefined') {
      original._retry = true;
      const newToken = await tryRefresh();
      if (newToken) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
        return api.request(original);
      }
      // Refresh başarısız → oturum bitti
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
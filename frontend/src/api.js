import axios from 'axios';

// FastAPI sunucumuzun adresi
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Her istek gitmeden önce araya girip Token'ı başlığa (Header) ekliyoruz
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
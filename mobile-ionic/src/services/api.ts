import axios from 'axios';
import { config } from '@/config/config';

const API_URL = config.apiUrl;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  // Auth
  login(email: string, password: string) {
    return api.post('/login', { email, password });
  },
  
  register(name: string, email: string, password: string, password_confirmation: string) {
    return api.post('/register', { name, email, password, password_confirmation });
  },
  
  logout() {
    return api.post('/logout');
  },
  
  getUser() {
    return api.get('/user');
  },
  
  // Signalements
  getSignalements() {
    return api.get('/signalements');
  },
  
  getMySignalements() {
    return api.get('/signalements/user/mine');
  },
  
  createSignalement(data: any) {
    return api.post('/signalements', data);
  },
  
  getSignalement(id: number) {
    return api.get(`/signalements/${id}`);
  },
};

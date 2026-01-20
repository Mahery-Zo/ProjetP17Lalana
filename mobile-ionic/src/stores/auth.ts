import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { config } from '@/config/config';

const firebaseConfig = config.firebase;

const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || '');
  const isOnline = ref(navigator.onLine);

  const login = async (email: string, password: string) => {
    try {
      if (isOnline.value) {
        // Try Firebase first
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      
      // Login to Laravel API
      const response = await api.login(email, password);
      token.value = response.data.access_token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      if (isOnline.value) {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      }
      
      const response = await api.register(name, email, password, password);
      token.value = response.data.access_token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await api.logout();
    user.value = null;
    token.value = '';
    localStorage.removeItem('token');
  };

  return { user, token, isOnline, login, register, logout };
});

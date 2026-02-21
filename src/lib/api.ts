import axios from 'axios';
import { auth } from '../firebase/config';

// Cria a instância do Axios apontando para a tua API Spring Boot
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Antes de qualquer requisição sair, injetamos o Token de Segurança
api.interceptors.request.use(
  async (config) => {
    // Se o utilizador estiver logado no Firebase, pegamos o token atualizado
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true); // true força a renovação se estiver quase a expirar
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
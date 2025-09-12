// src/store/authStore.ts
import { create } from 'zustand';
import { type User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useProfileStore } from './profileStore';
import { createUserProfile, getUserProfile } from '../firebase/userService'; // Verifique o nome do seu arquivo de serviço
import type { ProviderAdditionalData } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  initializeAuth: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    userType: 'client' | 'serviceProvider',
    additionalData?: ProviderAdditionalData
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSubmitting: false,
  error: null,

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        set({ user, isAuthenticated: true, isLoading: false });
        // Dispara a busca do perfil na store correta
        useProfileStore.getState().fetchUserProfile(user.uid);
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
        useProfileStore.getState().clearProfile();
      }
    });
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      set({ error: "E-mail ou senha inválidos." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  signup: async (email, password, fullName, userType, additionalData) => {
    set({ isSubmitting: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await createUserProfile(user.uid, email, fullName, userType, additionalData);

      const userProfile = await getUserProfile(user.uid);
      
      if (userProfile) {
        // Atualiza o estado de autenticação NESTA store
        set({
          isAuthenticated: true,
          user,
          isSubmitting: false,
        });
        // Seta o perfil do usuário na store DELE
        useProfileStore.getState().setUserProfile(userProfile);
      } else {
        throw new Error('Falha ao buscar perfil do usuário após o cadastro.');
      }
    } catch (err) {
      const error = err as AuthError; // Tipagem segura para o erro do Firebase
      let errorMessage = 'Ocorreu um erro ao criar a conta.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso. Tente outro.';
      }
      set({ error: errorMessage, isSubmitting: false });
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      // O onAuthStateChanged vai limpar o resto
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  },
}));
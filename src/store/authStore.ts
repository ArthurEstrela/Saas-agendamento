import { create } from 'zustand';
import { type User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useProfileStore } from './profileStore';
import { createUserProfile } from '../firebase/userService';
import type { UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Estado de carregamento GERAL (inicial)
  isSubmitting: boolean; // Estado para ações de formulário (login/signup)
  error: string | null;
  initializeAuth: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSubmitting: false,
  error: null,

  initializeAuth: () => {
    // ... (a função initializeAuth continua a mesma)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        set({ user, isAuthenticated: true, isLoading: false });
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
      // O 'onAuthStateChanged' vai cuidar de atualizar o resto do estado.
    } catch (error: any) {
      set({ error: "Email ou senha inválidos." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  signup: async (email, password, name, role) => {
    set({ isSubmitting: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user.uid, email, name, role);
      // O 'onAuthStateChanged' vai cuidar do login automático.
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        set({ error: "Este email já está em uso." });
      } else {
        set({ error: "Ocorreu um erro ao criar a conta." });
      }
    } finally {
      set({ isSubmitting: false });
    }
  },

  logout: async () => {
    // ... (a função logout continua a mesma)
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  },
}));
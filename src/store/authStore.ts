import { create } from "zustand";
import { type User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useProfileStore } from "./profileStore"; // Vamos importar o novo store

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initializeAuth: () => () => void; // A função retorna o 'unsubscribe' do Firebase
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Começa como true para verificar o estado inicial

  // Inicializa o listener do Firebase
  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        set({ user, isAuthenticated: true, isLoading: false });
        // Quando o usuário é autenticado, buscamos o perfil dele
        useProfileStore.getState().fetchUserProfile(user.uid);
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
        // Se não há usuário, limpamos os dados do perfil
        useProfileStore.getState().clearProfile();
      }
    });
    return unsubscribe; // Retorna a função para limpar o listener
  },

  // Função de logout
  logout: async () => {
    try {
      await signOut(auth);
      // O listener 'onAuthStateChanged' vai cuidar de limpar o estado
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  },
}));

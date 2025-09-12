// src/store/authStore.ts
import { create } from "zustand";
import {
  type User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type AuthError,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { useProfileStore } from "./profileStore";
import { createUserProfile, getUserProfile } from "../firebase/userService"; // Verifique o nome do seu arquivo de serviço
import type { ServiceProviderProfile, ClientProfile } from "../types";

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
    userType: "client" | "serviceProvider",
    additionalData?: Partial<ServiceProviderProfile | ClientProfile>
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
      // O onAuthStateChanged vai cuidar de atualizar o estado do usuário.
      // A gente só limpa o isSubmitting aqui.
      set({ isSubmitting: false });
    } catch (err) {
      const error = err as AuthError;
      let errorMessage = "Ocorreu um erro ao tentar fazer login.";

      // Mapeia os códigos de erro do Firebase para mensagens amigáveis
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "E-mail ou senha inválidos.";
          break;
        case "auth/invalid-email":
          errorMessage = "O formato do e-mail fornecido é inválido.";
          break;
        case "auth/too-many-requests":
          errorMessage =
            "Muitas tentativas de login. Por favor, tente novamente mais tarde.";
          break;
        default:
          errorMessage = "Falha no login. Verifique suas credenciais.";
      }

      set({ error: errorMessage, isSubmitting: false });
      // Lança o erro para que o formulário saiba que a operação falhou
      throw error;
    }
  },

  signup: async (email, password, fullName, userType, additionalData) => {
    set({ isSubmitting: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await createUserProfile(
        user.uid,
        email,
        fullName,
        userType,
        additionalData
      );

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
        throw new Error("Falha ao buscar perfil do usuário após o cadastro.");
      }
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro desconhecido.";
      if (error.code) {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage =
              "Este endereço de e-mail já está em uso por outra conta.";
            break;
          case "auth/invalid-email":
            errorMessage = "O formato do e-mail fornecido é inválido.";
            break;
          case "auth/weak-password":
            errorMessage = "A senha é muito fraca. Tente uma senha mais forte.";
            break;
          default:
            errorMessage = `Erro no cadastro: ${error.message}`;
        }
      }
      console.error("Firebase signup error:", error); // Mantém o erro detalhado no console para debug
      set({ error: errorMessage, isSubmitting: false });

      throw error;
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

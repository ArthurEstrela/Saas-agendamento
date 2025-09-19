// src/store/authStore.ts
import { create } from "zustand";
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type AuthError,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { useProfileStore } from "./profileStore";
import { createUserProfile, getUserProfile } from "../firebase/userService"; // Verifique o nome do seu arquivo de serviço
import type {
  UserProfile,
  ServiceProviderProfile,
  ClientProfile,
} from "../types";

interface AuthState {
  user: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  initializeAuth: () => () => void;
  login: (email: string, password: string) => Promise<UserProfile | null>;
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // ALTERAÇÃO 3: Após o login, buscamos o perfil do usuário imediatamente.
      const userProfile = await getUserProfile(userCredential.user.uid);

      if (!userProfile) {
        // Se por algum motivo o perfil não existir no Firestore, tratamos como um erro.
        throw new Error("Perfil de usuário não encontrado no banco de dados.");
      }

      set({ isSubmitting: false });

      // ALTERAÇÃO 4: Retornamos o perfil completo para o LoginForm.
      return userProfile;
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
      return null;
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
    } catch (err: unknown) {
      let errorMessage = "Ocorreu um erro desconhecido.";
      if (typeof err === "object" && err !== null && "code" in err) {
        const error = err as AuthError;
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
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      console.error("Firebase signup error:", err);
      set({ error: errorMessage, isSubmitting: false });

      throw err;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  },
}));

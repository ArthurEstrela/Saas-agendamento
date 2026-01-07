import { create } from "zustand";
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type AuthError,
} from "firebase/auth";
import { toast } from "react-hot-toast";
import { auth } from "../firebase/config";
import { useProfileStore } from "./profileStore";
import { createUserProfile } from "../firebase/userService";
import type {
  ServiceProviderProfile,
  ClientProfile,
  UserProfile,
} from "../types";
import { useUserAppointmentsStore } from "./userAppointmentsStore";
import { useProviderAppointmentsStore } from "./providerAppointmentsStore";

/**
 * Mapeia erros do Firebase Auth para mensagens amigáveis ao usuário.
 * @param error O erro capturado, de tipo `unknown`.
 * @returns Uma string com a mensagem de erro formatada.
 */
const getAuthErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const authError = error as AuthError;
    switch (authError.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "E-mail ou senha inválidos.";
      case "auth/invalid-email":
        return "O formato do e-mail é inválido.";
      case "auth/email-already-in-use":
        return "Este e-mail já está em uso por outra conta.";
      case "auth/weak-password":
        return "A senha é muito fraca. Use pelo menos 6 caracteres.";
      case "auth/too-many-requests":
        return "Acesso bloqueado temporariamente devido a muitas tentativas.";
      default:
        return "Ocorreu um erro inesperado. Tente novamente.";
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocorreu um erro desconhecido.";
};

interface AuthState {
  user: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Para a verificação inicial de autenticação no carregamento do app
  isSubmitting: boolean; // Para controlar o estado de envio de formulários
  error: string | null;
  initializeAuth: () => () => void; // Retorna a função de unsubscribe
  login: (email: string, password: string) => Promise<UserProfile | null>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    userType: "client" | "serviceProvider",
    additionalData?: Partial<ServiceProviderProfile | ClientProfile>
  ) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSubmitting: false,
  error: null,

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await useProfileStore.getState().fetchUserProfile(user.uid);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        useProfileStore.getState().clearProfile();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ isSubmitting: true, error: null });
    const loadingToast = toast.loading("Autenticando...");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Busca o perfil do usuário IMEDIATAMENTE após o login
      await useProfileStore.getState().fetchUserProfile(user.uid);
      const userProfile = useProfileStore.getState().userProfile;

      toast.success("Login realizado com sucesso! Bem-vindo(a) de volta.", {
        id: loadingToast,
      });

      // O onAuthStateChanged fará isso também, mas setamos aqui para garantir a consistência
      set({ user, isAuthenticated: true, isSubmitting: false });

      // Retorna o perfil para o componente de login
      return userProfile;
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err);
      toast.error(errorMessage, { id: loadingToast });
      set({ error: errorMessage, isSubmitting: false });
      return null; // Retorna nulo em caso de erro
    }
  },

  signup: async (email, password, fullName, userType, additionalData) => {
    set({ isSubmitting: true, error: null });

    // Envolve a criação do usuário e do perfil em uma única promise
    const promise = (async () => {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await createUserProfile(
        userCredential.user.uid,
        email,
        fullName,
        userType,
        additionalData
      );
    })();

    toast.promise(promise, {
      loading: "Criando sua conta...",
      success: "Conta criada com sucesso! Bem-vindo(a).",
      error: (err) => getAuthErrorMessage(err),
    });

    try {
      await promise;
      // O listener `onAuthStateChanged` cuidará do resto.
    } catch (err) {
      set({ error: getAuthErrorMessage(err) });
    } finally {
      set({ isSubmitting: false });
    }
  },

  logout: async () => {
    const promise = signOut(auth);

    toast.promise(promise, {
      loading: "Saindo...",
      success: "Você foi desconectado. Até breve!",
      error: "Ocorreu um erro ao tentar sair.",
    });

    try {
      await promise;
      // O listener `onAuthStateChanged` limpará o estado global.
      useProviderAppointmentsStore.getState().clearAppointments();
      useUserAppointmentsStore.getState().clearAppointments();
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Ocorreu um erro ao tentar sair.");
    }
  },

  sendPasswordReset: async (email: string) => {
    set({ isSubmitting: true, error: null });
    const promise = sendPasswordResetEmail(auth, email);

    toast.promise(promise, {
      loading: 'Enviando e-mail de recuperação...',
      success: 'E-mail enviado! Verifique sua caixa de entrada e spam.',
      error: (err) => getAuthErrorMessage(err),
    });
    
    try {
      await promise;
    } catch (err) {
        set({ error: getAuthErrorMessage(err) });
    } finally {
      set({ isSubmitting: false });
    }
  },
}));

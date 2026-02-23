import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { isAxiosError } from 'axios';
import { auth } from '../firebase/config';
import type { UserProfile, RegisterData, ClientRegisterData, ProviderRegisterData } from '../types';
import { api } from '../lib/api';

// FUNÇÃO HELPER SÊNIOR: Trata qualquer tipo de erro com tipagem segura
const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    // Se for um erro da sua API Java (ex: "E-mail já cadastrado")
    return error.response?.data?.message || 'Erro de comunicação com o servidor.';
  }
  if (error instanceof Error) {
    // Se for um erro do Firebase ou de código nativo
    return error.message;
  }
  return defaultMessage;
};

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  signInWithGoogle: (role: 'CLIENT' | 'SERVICE_PROVIDER') => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  // ==========================================================================
  // 1. LOGIN
  // ==========================================================================
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const response = await api.get<UserProfile>('/auth/me');
      set({ user: response.data, loading: false });
    } catch (error) { 
      set({ 
        error: extractErrorMessage(error, 'Erro ao fazer login. Verifique as credenciais.'), 
        loading: false 
      });
      throw error;
    }
  },

  // ==========================================================================
  // 2. REGISTRO (E-mail e Senha)
  // ==========================================================================
  register: async (data: RegisterData) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password!);
      // Força a atualização do token imediatamente
      await userCredential.user.getIdToken(true);

      let response;
      if (data.role === 'client' || data.role === 'CLIENT') {
        const clientData = data as ClientRegisterData;
        response = await api.post<UserProfile>('/auth/register/client', {
          name: clientData.name,
          email: clientData.email,
          phoneNumber: clientData.phone || '',
          password: clientData.password
        });
      } else {
        const providerData = data as ProviderRegisterData;
        response = await api.post<UserProfile>('/service-providers/register', {
          name: providerData.name,
          email: providerData.email,
          businessName: providerData.businessName,
          document: providerData.document,
          phone: providerData.phone || '',
          password: providerData.password
        });
      }

      set({ user: response.data, loading: false });
    } catch (error) { 
      // Em caso de falha no Java, remove o usuário criado no Firebase para evitar inconsistência
      if (auth.currentUser) await auth.currentUser.delete().catch(console.error);
      
      set({ 
        error: extractErrorMessage(error, 'Erro ao criar conta. Verifique os dados e tente novamente.'), 
        loading: false 
      });
      throw error;
    }
  },

  // ==========================================================================
  // 3. LOGIN / REGISTRO VIA GOOGLE
  // ==========================================================================
  signInWithGoogle: async (role: 'CLIENT' | 'SERVICE_PROVIDER') => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      try {
        const response = await api.get<UserProfile>('/auth/me');
        set({ user: response.data, loading: false });
      } catch (err) { 
        // ✨ CORREÇÃO: Adicionado o status 403 para a verificação caso o Spring bloqueie a rota indevidamente
        if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 404 || err.response?.status === 403)) {
            const basePayload = {
                name: result.user.displayName || 'Usuário Google',
                email: result.user.email!,
                phoneNumber: result.user.phoneNumber || '',
                password: result.user.uid
            };

            let regResponse;
            if (role === 'CLIENT') {
                regResponse = await api.post<UserProfile>('/auth/register/client', basePayload);
            } else {
                regResponse = await api.post<UserProfile>('/service-providers/register', { 
                    ...basePayload, 
                    businessName: basePayload.name, 
                    document: '00000000000', 
                    phone: basePayload.phoneNumber 
                });
            }

            set({ user: regResponse.data, loading: false });
        } else {
            throw err;
        }
      }
    } catch (error) { 
      set({ error: extractErrorMessage(error, 'Erro na autenticação com o Google.'), loading: false });
      throw error;
    }
  },

  // ==========================================================================
  // 4. LOGOUT
  // ==========================================================================
  logout: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (error) { 
      set({ error: extractErrorMessage(error, 'Erro ao sair da conta.'), loading: false });
    }
  },

  // ==========================================================================
  // 5. INICIALIZAÇÃO E LISTENER DA SESSÃO
  // ==========================================================================
  initAuth: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const response = await api.get<UserProfile>('/auth/me');
          set({ user: response.data, loading: false });
        } catch (error) {
          // ✨ CORREÇÃO: Impede o logout automático caso receba 404 no momento em que a API Java 
          // ainda está gravando o usuário no PostgreSQL
          if (isAxiosError(error) && error.response?.status === 404) {
             console.log("Aguardando sincronização do novo usuário no banco de dados...");
             // Apenas mantemos o status loading, não deslogamos.
          } else {
             console.error("Usuário desincronizado ou token inválido. Forçando logout local.", error);
             set({ user: null, loading: false }); 
          }
        }
      } else {
        set({ user: null, loading: false });
      }
    });
  },

  clearError: () => set({ error: null }),
}));
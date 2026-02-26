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
    // Se for um erro da API Java (ex: "E-mail já cadastrado" enviado pelo BusinessException)
    return error.response?.data?.message || 'Erro de comunicação com o servidor.';
  }
  if (error instanceof Error) {
    // Se for um erro do Firebase (ex: auth/wrong-password)
    switch (error.message) {
      case 'Firebase: Error (auth/invalid-credential).':
        return 'E-mail ou senha incorretos.';
      case 'Firebase: Error (auth/email-already-in-use).':
        return 'Este e-mail já está sendo usado.';
      default:
        return error.message;
    }
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
      // 1. Autentica no Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Busca o perfil completo e os IDs vinculados (UUIDs do banco) no Java
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
      // 1. Cria a credencial no Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password!);
      
      // Força a atualização do token imediatamente para as requisições subsequentes
      await userCredential.user.getIdToken(true);

      let userProfile: UserProfile;

      // 2. Registra no Back-end Java (enviando o firebaseUid para sincronia)
      if (data.role === 'client' || data.role === 'CLIENT') {
        const clientData = data as ClientRegisterData;
        const response = await api.post<UserProfile>('/auth/register/client', {
          name: clientData.name,
          email: clientData.email,
          phoneNumber: clientData.phone || '',
          password: clientData.password,
          cpf: clientData.cpf,
          firebaseUid: userCredential.user.uid // ✨ O pulo do gato: Sincronizando os IDs
        });
        userProfile = response.data;
      } else {
        const providerData = data as ProviderRegisterData;
        const response = await api.post<UserProfile>('/service-providers/register', {
          ownerName: providerData.name,             // ✨ Alinhado com o DTO Java
          ownerEmail: providerData.email,           // ✨ Alinhado com o DTO Java
          ownerPassword: providerData.password,     // ✨ Alinhado com o DTO Java
          businessName: providerData.businessName,
          document: providerData.document,
          phone: providerData.phone || '',
          address: providerData.address,
          firebaseUid: userCredential.user.uid // ✨ Sincronizando IDs
        });
        userProfile = response.data;
      }

      set({ user: userProfile, loading: false });

    } catch (error) { 
      // ✨ PROTEÇÃO DE INTEGRIDADE: Se falhou no Java, apaga no Firebase
      if (auth.currentUser) {
        await auth.currentUser.delete().catch(console.error);
      }
      
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
        // Tenta buscar o usuário no Back-end (Caso já tenha conta)
        const response = await api.get<UserProfile>('/auth/me');
        set({ user: response.data, loading: false });

      } catch (err) { 
        // Se retornar 404 (Not Found) ou 401/403, significa que é o primeiro login via Google.
        // Precisamos criar a conta no Back-end Java.
        if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 404 || err.response?.status === 403)) {
            
            const basePayload = {
                name: result.user.displayName || 'Usuário Google',
                email: result.user.email!,
                phoneNumber: result.user.phoneNumber || '',
                password: result.user.uid, // Usa o UID como senha temporária no DB (não será usada para login manual)
                firebaseUid: result.user.uid // ✨ Garante a conexão
            };

            let userProfile: UserProfile;

            if (role === 'CLIENT') {
                // O cliente também precisa do CPF agora! Envie um mock ou redirecione para completar o perfil
                const regResponse = await api.post<UserProfile>('/auth/register/client', {
                    ...basePayload,
                    cpf: '00000000000' // Mock temporário para passar na API
                });
                userProfile = regResponse.data;
            } else {
                // O Provedor precisa dos nomes corretos e do Endereço!
                const regResponse = await api.post<UserProfile>('/service-providers/register', { 
                    ownerName: basePayload.name,
                    ownerEmail: basePayload.email,
                    ownerPassword: basePayload.password,
                    businessName: basePayload.name, 
                    document: '00000000000', // Mock temporário
                    phone: basePayload.phoneNumber || '00000000000',
                    firebaseUid: basePayload.firebaseUid,
                    // ✨ Endereço mockado para não estourar erro 400
                    address: {
                        zipCode: "00000000", street: "Pendente", number: "S/N", 
                        neighborhood: "Pendente", city: "Pendente", state: "XX", lat: 0, lng: 0
                    }
                });
                userProfile = regResponse.data;
            }

            set({ user: userProfile, loading: false });
        } else {
            throw err; // Se foi um Erro 500 no servidor, repassa o erro
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
          // Busca os dados e os UUIDs reais do banco a cada reload da página
          const response = await api.get<UserProfile>('/auth/me');
          set({ user: response.data, loading: false });
        } catch (error) {
          // Trata a latência de sincronização no Registro
          if (isAxiosError(error) && error.response?.status === 404) {
             console.log("Aguardando o Back-end sincronizar o novo usuário...");
             // Mantemos loading, o register() vai atualizar o estado do user em seguida
          } else {
             console.error("Sessão inválida ou expirada no servidor. Forçando logout.", error);
             await signOut(auth); // Limpa o firebase local também
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
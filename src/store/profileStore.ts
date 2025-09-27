import { create } from "zustand";
import type {
  UserProfile,
  ClientProfile,
  Service,
  Professional,
} from "../types";
import {
  getUserProfile,
  toggleFavoriteProfessional,
  updateUserProfile,
  uploadProfilePicture as uploadService,
} from "../firebase/userService";
import { getProfessionalsByProviderId } from "../firebase/professionalsManagementService";

interface ProfileState {
  userProfile: UserProfile | null;
  professionals: Professional[] | null;
  isLoadingProfile: boolean;
  error: string | null;
  fetchUserProfile: (uid: string) => Promise<void>;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  uploadProfilePicture: (
    uid: string,
    file: File
  ) => Promise<string | undefined>;
  setUserProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  toggleFavorite: (professionalId: string) => Promise<void>;
  updateServicesInProfile: (services: Service[]) => void;
  updateProfessionalsInProfile: (professionals: Professional[]) => void; 
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  userProfile: null,
  professionals: null, 
  isLoadingProfile: false,
  error: null,

  fetchUserProfile: async (uid: string) => {
    set({ isLoadingProfile: true, error: null });
    try {
      // 1. Busca o perfil principal (sem a lista de profissionais)
      const profileData = await getUserProfile(uid); 

      if (profileData) {
        // Inicializa o estado com o perfil base
        set({ userProfile: profileData, isLoadingProfile: false });

        // 2. Se for um Prestador de Serviço, busca a sub-coleção
        if (profileData.role === 'serviceProvider') {
          try {
            const professionalsList = await getProfessionalsByProviderId(uid);
            // 3. Atualiza o NOVO estado 'professionals'
            set({ professionals: professionalsList });
          } catch (profError) {
            console.error("Atenção: Falha ao buscar a sub-coleção de profissionais, mas o perfil principal foi carregado.", profError);
            set({ professionals: [] }); // Define como array vazio para evitar erro de UI
          }
        } else {
             // Garante que o estado de profissionais não exista para clientes
            set({ professionals: null });
        }

      } else {
        throw new Error("Perfil de usuário não encontrado no Firestore.");
      }
    } catch (err: unknown) {
      let errorMessage = "Erro ao buscar o perfil do usuário.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Erro ao buscar perfil:", err);
      set({ error: errorMessage, isLoadingProfile: false, professionals: null });
    }
  },

  updateUserProfile: async (uid: string, data: Partial<UserProfile>) => {
    const currentProfile = get().userProfile;
    if (!currentProfile) return;

    // Atualização otimista
    set({
      userProfile: { ...currentProfile, ...data } as UserProfile,
    });

    try {
      await updateUserProfile(uid, data);
    } catch (err: unknown) {
      let errorMessage = "Falha ao salvar as alterações.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Erro ao atualizar o perfil:", err);
      // Reverte em caso de erro
      set({ userProfile: currentProfile, error: errorMessage });
    }
  },

  // --- FUNÇÃO ADICIONADA ---
  // Esta é a função que a authStore chamará após o signup para evitar
  // uma nova chamada desnecessária ao banco de dados.
  setUserProfile: (profile: UserProfile) => {
    set({ userProfile: profile, isLoadingProfile: false });
  },

  // --- FUNÇÃO ADICIONADA (Esqueleto) ---
  // Para completar a interface que você definiu.
  uploadProfilePicture: async (uid, file) => {
    const currentProfile = get().userProfile;
    if (!currentProfile) return;

    set({ isLoadingProfile: true });
    try {
      const downloadURL = await uploadService(uid, file);
      set((state) => ({
        userProfile: state.userProfile
          ? { ...state.userProfile, profilePictureUrl: downloadURL }
          : null,
        isLoadingProfile: false,
      }));
      return downloadURL;
    } catch (err) {
      console.error("Erro no upload da foto:", err);
      set({ error: "Falha ao enviar a foto.", isLoadingProfile: false });
      return undefined;
    }
  },

  clearProfile: () => {
    set({ userProfile: null, isLoadingProfile: false, error: null });
  },

  toggleFavorite: async (professionalId: string) => {
    const { userProfile } = get();
    if (userProfile && userProfile.role === "client") {
      const clientProfile = userProfile as ClientProfile;
      const oldFavorites = clientProfile.favoriteProfessionals || [];

      // Atualização Otimista: atualiza a UI primeiro para uma resposta instantânea
      const isFavorite = oldFavorites.includes(professionalId);
      const newFavorites = isFavorite
        ? oldFavorites.filter((id) => id !== professionalId)
        : [...oldFavorites, professionalId];

      set({
        userProfile: { ...clientProfile, favoriteProfessionals: newFavorites },
      });

      try {
        // Em seguida, atualiza o banco de dados em segundo plano
        await toggleFavoriteProfessional(clientProfile.id, professionalId);
      } catch (error) {
        console.error("Failed to update favorite status:", error);
        // Em caso de erro, reverte a UI para o estado anterior
        set({
          userProfile: {
            ...clientProfile,
            favoriteProfessionals: oldFavorites,
          },
        });
      }
    }
  },
  updateServicesInProfile: (services) => {
    const { userProfile } = get();
    if (userProfile && userProfile.role === "serviceProvider") {
      // Cria um novo objeto de perfil com a lista de serviços atualizada
      const updatedProfile = {
        ...userProfile,
        services,
      };
      // Atualiza o estado sem disparar o loading geral
      set({ userProfile: updatedProfile });
    }
  },

  updateProfessionalsInProfile: (professionals) => {
    // Esta função agora só atualiza o novo estado 'professionals'
    const { userProfile } = get();
    if (userProfile && userProfile.role === 'serviceProvider') {
        // A atualização não é mais feita no userProfile, mas sim no estado dedicado.
        set({ professionals });
    }
    // Para tipos que não são ServiceProvider, a ação é ignorada.
  },
}));

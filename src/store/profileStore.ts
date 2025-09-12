import { create } from "zustand";
import type { UserProfile } from "../types";
import { getUserProfile, updateUserProfile, uploadProfilePicture as uploadService } from "../firebase/userService"; 

interface ProfileState {
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  error: string | null;
  fetchUserProfile: (uid: string) => Promise<void>;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  uploadProfilePicture: (uid: string, file: File) => Promise<string | undefined>;
  setUserProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  userProfile: null,
  isLoadingProfile: false,
  error: null,

  fetchUserProfile: async (uid: string) => {
    set({ isLoadingProfile: true, error: null });
    try {
      const profileData = await getUserProfile(uid);
      if (profileData) {
        set({ userProfile: profileData, isLoadingProfile: false });
      } else {
        throw new Error("Perfil de usuário não encontrado no Firestore.");
      }
    } catch (err: unknown) {
      let errorMessage = "Erro ao buscar o perfil do usuário.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Erro ao buscar perfil:", err);
      set({ error: errorMessage, isLoadingProfile: false });
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
      set(state => ({
        userProfile: state.userProfile ? { ...state.userProfile, profilePictureUrl: downloadURL } : null,
        isLoadingProfile: false
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
}));

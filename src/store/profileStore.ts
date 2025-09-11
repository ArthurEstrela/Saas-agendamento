import { create } from "zustand";
import type { UserProfile } from "../types";
import { getUserProfile, updateUserProfile } from "../firebase/userService"; // Importamos as funções reais

interface ProfileState {
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  error: string | null;
  fetchUserProfile: (uid: string) => Promise<void>;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
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

    set({
      userProfile: { ...currentProfile, ...data } as UserProfile,
    });

    try {
      await updateUserProfile(uid, data);
    } catch (err: unknown) {
      // Correção aqui
      let errorMessage = "Falha ao salvar as alterações.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Erro ao atualizar o perfil:", err);
      set({ userProfile: currentProfile, error: errorMessage });
    }
  },

  clearProfile: () => {
    set({ userProfile: null, isLoadingProfile: false, error: null });
  },
}));

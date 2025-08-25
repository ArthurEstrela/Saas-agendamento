import { create } from 'zustand';
import { type User } from 'firebase/auth'; // Importe o tipo User do firebase
import type { UserProfile } from '../types';

// Defina a interface para o estado e as ações
interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

// Crie o store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userProfile: null, // 👈 4. INICIALIZE COMO NULO
  loading: true,
  setUser: (user) => set({ user }),
  setUserProfile: (profile) => set({ userProfile: profile }), // 👈 5. IMPLEMENTE A AÇÃO
  setLoading: (loading) => set({ loading }),
}));
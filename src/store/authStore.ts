// src/store/authStore.ts
import { create } from "zustand";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, storage } from "../firebase/config";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  collection,
  Timestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type {
  UserProfile,
  Appointment,
  Review,
  Professional,
  Service,
} from "../types";

// Interfaces para os dados que as funções recebem
interface ReviewData {
  serviceProviderId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  clientId: string;
  serviceIds: string[];
}

export interface Professional {
  id: string;
  name: string;
  services: string[];
}

// Define a estrutura completa do nosso store
interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => () => void;
  signUp: (
    email: string,
    password: string,
    userType: "client" | "serviceProvider",
    profileData: Partial<UserProfile>
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  uploadImage: (file: File, path: string) => Promise<string>;
  toggleFavorite: (professionalId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  submitReview: (reviewData: ReviewData) => Promise<void>;
  updateAppointmentStatus: (
    appointmentId: string,
    status: "confirmed" | "cancelled" | "no-show"
  ) => Promise<void>;
  updateProfessionals: (professionals: Professional[]) => Promise<void>;
  manageProfessionals: (professionals: Professional[]) => Promise<void>;
  manageServices: (services: Service[]) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  error: null,

  checkAuth: () => {
    set({ isLoading: true });
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            set({ user, userProfile: profile, isLoading: false, error: null });
          } else {
            set({ user, userProfile: null, isLoading: false, error: null });
          }
        } else {
          set({ user: null, userProfile: null, isLoading: false, error: null });
        }
      } catch (err: any) {
        set({
          user: null,
          userProfile: null,
          isLoading: false,
          error: err.message,
        });
      }
    });
    return unsubscribe;
  },

  signUp: async (email, password, userType, profileData) => {
    set({ isLoading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        createdAt: Timestamp.now(),
        userType,
        ...profileData,
      };
      await setDoc(doc(db, "users", user.uid), newProfile);
      set({ user, userProfile: newProfile, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        set({
          user,
          userProfile: userDoc.data() as UserProfile,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error("Perfil de utilizador não encontrado.");
      }
    } catch (error: any) {
      set({ error: "Falha na autenticação.", isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName!,
          photoURL: user.photoURL!,
          userType: "client",
          createdAt: Timestamp.now(),
        };
        await setDoc(userDocRef, newProfile);
        set({ user, userProfile: newProfile, isLoading: false });
      } else {
        set({
          user,
          userProfile: userDoc.data() as UserProfile,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut(auth);
      set({ user: null, userProfile: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateUserProfile: async (data: Partial<UserProfile>) => {
    const { user, userProfile } = get();
    if (!user || !userProfile) throw new Error("Usuário não autenticado");

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, data);

    // Sincroniza o estado local do Zustand
    set((state) => ({
      userProfile: {
        ...state.userProfile,
        ...data,
      } as UserProfile,
    }));
  },

  toggleFavorite: async (professionalId: string) => {
    const { user, userProfile } = get();
    if (!user || !userProfile) throw new Error("Utilizador não autenticado");

    const userDocRef = doc(db, "users", user.uid);

    const currentFavorites = userProfile.favorites || [];
    const isFavorite = currentFavorites.includes(professionalId);

    if (isFavorite) {
      // Usa arrayRemove para remover do Firestore
      await updateDoc(userDocRef, { favorites: arrayRemove(professionalId) });
      // Atualiza o estado do Zustand
      set((state) => ({
        userProfile: {
          ...state.userProfile!,
          favorites: currentFavorites.filter((id) => id !== professionalId),
        },
      }));
    } else {
      // Usa arrayUnion para adicionar ao Firestore
      await updateDoc(userDocRef, { favorites: arrayUnion(professionalId) });
      // Atualiza o estado do Zustand
      set((state) => ({
        userProfile: {
          ...state.userProfile!,
          favorites: [...currentFavorites, professionalId],
        },
      }));
    }
  },

  cancelAppointment: async (appointmentId: string) => {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await updateDoc(appointmentRef, { status: "cancelled" });
  },

  submitReview: async (reviewData: ReviewData) => {
    await addDoc(collection(db, "reviews"), {
      ...reviewData,
      createdAt: Timestamp.now(),
    });
    const appointmentRef = doc(db, "appointments", reviewData.appointmentId);
    await updateDoc(appointmentRef, {
      status: "completed",
      hasBeenReviewed: true,
    });
  },

  // --- FUNÇÃO PARA O DASHBOARD DO PRESTADOR ---
  updateAppointmentStatus: async (appointmentId, status) => {
    const appointmentRef = doc(db, "appointments", appointmentId);
    try {
      await updateDoc(appointmentRef, { status: status });
    } catch (error) {
      console.error("Erro ao atualizar o estado do agendamento:", error);
      // Lança o erro para que o componente possa mostrar um toast de erro
      throw error;
    }
  },
  updateProfessionals: async (professionals) => {
    const { userProfile } = get();
    if (!userProfile?.id) {
      console.error(
        "ID do usuário não encontrado para atualizar profissionais."
      );
      return;
    }

    try {
      const userRef = doc(db, "users", userProfile.id);
      await updateDoc(userRef, {
        professionals: professionals,
      });

      // Atualiza o estado localmente para refletir a mudança instantaneamente
      set({
        userProfile: {
          ...userProfile,
          professionals: professionals,
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar profissionais:", error);
      // Aqui você pode lançar o erro ou lidar com ele
      throw new Error("Falha ao salvar o profissional.");
    }
  },

  uploadImage: async (file, path) => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  },

  manageProfessionals: async (professionals) => {
    const { userProfile } = get();
    if (!userProfile?.uid) throw new Error("Usuário não autenticado.");

    const userDocRef = doc(db, "users", userProfile.uid);

    try {
      // 1. Atualiza o documento no Firestore
      await updateDoc(userDocRef, { professionals });

      // 2. Atualiza o estado local no Zustand
      set((state) => ({
        userProfile: state.userProfile
          ? { ...state.userProfile, professionals }
          : null,
      }));
    } catch (error) {
      console.error("Erro ao gerenciar profissionais:", error);
      throw new Error("Não foi possível atualizar a lista de profissionais.");
    }
  },

  manageServices: async (services) => {
    const { userProfile } = get();
    if (!userProfile?.uid) throw new Error("Usuário não autenticado.");

    const userDocRef = doc(db, "users", userProfile.uid);

    try {
      // 1. Atualiza o documento no Firestore
      await updateDoc(userDocRef, { services });

      // 2. Atualiza o estado local no Zustand para manter tudo sincronizado
      set((state) => ({
        userProfile: state.userProfile
          ? { ...state.userProfile, services }
          : null,
      }));
    } catch (error) {
      console.error("Erro ao gerenciar serviços:", error);
      throw new Error("Não foi possível atualizar a lista de serviços.");
    }
  },
}));

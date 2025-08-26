import { create } from "zustand";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, Timestamp } from "firebase/firestore";

// Interfaces para os dados que as funções recebem
interface ReviewData {
  serviceProviderId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  clientId: string;
  serviceIds: string[];
}

// Define a estrutura completa do nosso store
interface AuthState {
  user: User | null;
  userProfile: any; 
  isLoading: boolean;
  error: string | null;
  checkAuth: () => () => void;
  signUp: (formData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (professionalId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  submitReview: (reviewData: ReviewData) => Promise<void>;
  // --- NOVA FUNÇÃO ADICIONADA PARA O DASHBOARD DO PRESTADOR ---
  updateAppointmentStatus: (appointmentId: string, status: "confirmed" | "cancelled" | "no-show") => Promise<void>;
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
            set({ user, userProfile: userDoc.data(), isLoading: false, error: null });
          } else {
            set({ user, userProfile: null, isLoading: false, error: null });
          }
        } else {
          set({ user: null, userProfile: null, isLoading: false, error: null });
        }
      } catch (err: any) {
        set({ user: null, userProfile: null, isLoading: false, error: err.message });
      }
    });
    return unsubscribe;
  },

  signUp: async (formData: any) => {
    set({ isLoading: true, error: null });
    const { email, password, userType, ...profileData } = formData;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const newProfile = { uid: user.uid, email: user.email, userType: userType, ...profileData, createdAt: new Date() };
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        set({ user, userProfile: userDoc.data(), isLoading: false, error: null });
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
            const newProfile = { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, userType: 'client', createdAt: new Date() };
            await setDoc(userDocRef, newProfile);
            set({ user, userProfile: newProfile, isLoading: false });
        } else {
            set({ user, userProfile: userDoc.data(), isLoading: false });
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
  
  toggleFavorite: async (professionalId: string) => {
    const { user, userProfile } = get();
    if (!user) throw new Error("Utilizador não autenticado");

    const userDocRef = doc(db, "users", user.uid);
    const isFavorite = userProfile.favorites?.includes(professionalId);
    
    await updateDoc(userDocRef, {
      favorites: isFavorite ? arrayRemove(professionalId) : arrayUnion(professionalId)
    });

    const updatedFavorites = isFavorite
      ? userProfile.favorites.filter((id: string) => id !== professionalId)
      : [...(userProfile.favorites || []), professionalId];
    set({ userProfile: { ...userProfile, favorites: updatedFavorites } });
  },

  cancelAppointment: async (appointmentId: string) => {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await updateDoc(appointmentRef, { status: 'cancelled' });
  },

  submitReview: async (reviewData: ReviewData) => {
    await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      createdAt: Timestamp.now(),
    });
    const appointmentRef = doc(db, "appointments", reviewData.appointmentId);
    await updateDoc(appointmentRef, { status: 'completed' });
  },

  // --- FUNÇÃO PARA O DASHBOARD DO PRESTADOR ---
  updateAppointmentStatus: async (appointmentId, status) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    try {
        await updateDoc(appointmentRef, { status: status });
    } catch (error) {
        console.error("Erro ao atualizar o estado do agendamento:", error);
        // Lança o erro para que o componente possa mostrar um toast de erro
        throw error;
    }
  },
}));

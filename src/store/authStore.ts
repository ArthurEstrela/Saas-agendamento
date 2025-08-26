import { create } from "zustand";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
}

export const useAuthStore = create<AuthState>((set) => ({
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
        console.error("Erro durante a verificação de autenticação:", err);
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

      const newProfile = {
        uid: user.uid,
        email: user.email,
        userType: userType,
        ...profileData,
        createdAt: new Date(),
      };

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, newProfile);

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

      // <-- MUDANÇA CRÍTICA: Busca o perfil do usuário IMEDIATAMENTE após o login.
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        set({ user, userProfile: userDoc.data(), isLoading: false, error: null });
      } else {
        // Isso pode acontecer se o registro falhou em criar o perfil no DB.
        set({ user, userProfile: null, isLoading: false, error: "Perfil de usuário não encontrado." });
        throw new Error("Perfil de usuário não encontrado.");
      }
    } catch (error: any) {
      set({ error: "Falha na autenticação. Verifique suas credenciais.", isLoading: false });
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
            const newProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                userType: 'client',
                createdAt: new Date(),
            };
            await setDoc(userDocRef, newProfile);
            set({ user, userProfile: newProfile, isLoading: false });
        } else {
            // Se o perfil já existe, atualiza o estado com os dados do DB.
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
}));

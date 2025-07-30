import { useState, useEffect, createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { UserProfile } from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    userType: "client" | "serviceProvider",
    profileData?: Partial<UserProfile>
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  toggleFavorite: (professionalId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: 'confirmed' | 'cancelled') => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, `users/${uid}`);
    try {
      const userDocSnap = await getDoc(userDocRef);
      return userDocSnap.exists() ? (userDocSnap.data() as UserProfile) : null;
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        setCurrentUser(user);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Erro no login:", error);
    } finally {
        setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    userType: "client" | "serviceProvider",
    profileData: Partial<UserProfile> = {}
  ) => {
    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          createdAt: new Date(),
          userType,
          displayName: profileData.displayName || (userType === 'client' ? profileData.displayName : ''),
          establishmentName: profileData.establishmentName || (userType === 'serviceProvider' ? profileData.establishmentName : ''),
          ...profileData,
        };

        await setDoc(doc(db, `users/${user.uid}`), newProfile);
        setUserProfile(newProfile);
    } catch (error) {
        console.error("Erro no registro:", error);
    } finally {
        setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const profile = await fetchUserProfile(user.uid);

        if (!profile) {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            createdAt: new Date(),
            userType: "client",
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
          };
          await setDoc(doc(db, `users/${user.uid}`), newProfile);
          setUserProfile(newProfile);
        }
    } catch (error) {
        console.error("Erro no login com Google:", error);
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    setLoading(true);
    const userDocRef = doc(db, `users/${currentUser.uid}`);
    await setDoc(userDocRef, data, { merge: true });
    setUserProfile((prev) => ({ ...prev!, ...data }));
    setLoading(false);
  };

  const toggleFavorite = async (professionalId: string) => {
    if (!currentUser || !userProfile) return;
    const userDocRef = doc(db, `users/${currentUser.uid}`);
    const isFavorite = userProfile.favoriteProfessionals?.includes(professionalId);
    try {
      await updateDoc(userDocRef, {
        favoriteProfessionals: isFavorite ? arrayRemove(professionalId) : arrayUnion(professionalId)
      });
      const updatedProfile = await fetchUserProfile(currentUser.uid);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Erro ao favoritar profissional:", error);
      alert("Não foi possível atualizar seus favoritos.");
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    try {
      await deleteDoc(appointmentRef);
      alert("Agendamento cancelado/recusado com sucesso!");
    } catch (error) {
      console.error("Erro ao cancelar/recusar agendamento:", error);
      alert("Não foi possível processar a solicitação.");
    }
  };

  // Função para o profissional confirmar um agendamento
  const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'cancelled') => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    try {
      await updateDoc(appointmentRef, { status });
      alert(`Agendamento ${status === 'confirmed' ? 'confirmado' : 'marcado como cancelado'} com sucesso!`);
    } catch (error) {
      console.error("Erro ao atualizar status do agendamento:", error);
      alert("Não foi possível atualizar o agendamento.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUserProfile,
        toggleFavorite,
        cancelAppointment,
        updateAppointmentStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

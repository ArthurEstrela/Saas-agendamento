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
} from "firebase/firestore";

// Interfaces
export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface DayAvailability {
  active: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

export interface Availability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface UserProfile {
  uid: string;
  email: string;
  createdAt: Date;
  userType: "client" | "serviceProvider";
  displayName?: string; // Nome do cliente
  establishmentName?: string; // Nome do estabelecimento
  photoURL?: string;
  address?: string;
  instagram?: string;
  whatsapp?: string;
  phoneNumber?: string;
  segment?: string;
  cnpj?: string;
  services?: Service[];
  availability?: Availability;
}

// Configuração do Firebase (usando variáveis de ambiente)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicialização do Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Contexto de Autenticação
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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provedor de Autenticação
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Erro no login:", error);
        // Adicionar feedback para o usuário aqui
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
        // Adicionar feedback para o usuário aqui
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
          // Pergunta ao usuário se ele é cliente ou profissional
          // Por simplicidade, vamos padronizar como cliente por enquanto
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
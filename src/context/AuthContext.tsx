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
// Adicionando importações do Storage
import { getStorage } from "firebase/storage";
import type { UserProfile } from "../types"; // Importando tipos de um arquivo central

// Configuração do Firebase
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
export const storage = getStorage(app); // Inicializando o Storage

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

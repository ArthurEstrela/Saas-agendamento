import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
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
  collection,
  runTransaction,
  Timestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Importações do Storage
import { getMessaging, getToken } from "firebase/messaging";
import type { UserProfile, Review, Appointment } from "../types";
import { useToast } from "./ToastContext";

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

// Inicialização dos serviços
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
    if (currentToken) {
      console.log('FCM Token obtido:', currentToken);
      return currentToken;
    } else {
      console.log('Nenhum token de registo disponível. Solicite permissão para gerar um.');
      return null;
    }
  } catch (err) {
    console.error('Ocorreu um erro ao recuperar o token.', err);
    return null;
  }
};

// Tipagem do Contexto
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userType: "client" | "serviceProvider", profileData?: Partial<UserProfile>) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  toggleFavorite: (professionalId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: 'confirmed' | 'cancelled' | 'completed' | 'no-show', price?: number) => Promise<void>;
  requestFCMToken: () => Promise<void>;
  submitReview: (reviewData: Omit<Review, 'id' | 'createdAt' | 'clientName' | 'clientPhotoURL'>) => Promise<void>;
  uploadImage: (file: File, path: string) => Promise<string>; // <-- Adicionado aqui
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, `users/${uid}`);
    try {
      const userDocSnap = await getDoc(userDocRef);
      return userDocSnap.exists() ? (userDocSnap.data() as UserProfile) : null;
    } catch (error) {
      console.error("Erro ao procurar perfil do utilizador:", error);
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, userType: "client" | "serviceProvider", profileData: Partial<UserProfile> = {}) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const newProfile: UserProfile = {
        uid: user.uid, email: user.email!, createdAt: new Date(), userType,
        displayName: profileData.displayName || (userType === 'client' ? profileData.displayName : ''),
        establishmentName: profileData.establishmentName || (userType === 'serviceProvider' ? profileData.establishmentName : ''),
        ...profileData,
      };
      await setDoc(doc(db, `users/${user.uid}`), newProfile);
      setUserProfile(newProfile);
  };

  const loginWithGoogle = async () => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profile = await fetchUserProfile(user.uid);
      if (!profile) {
        const newProfile: UserProfile = {
          uid: user.uid, email: user.email!, createdAt: new Date(), userType: "client",
          displayName: user.displayName || "", photoURL: user.photoURL || "",
        };
        await setDoc(doc(db, `users/${user.uid}`), newProfile);
        setUserProfile(newProfile);
      }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, `users/${currentUser.uid}`);
    try {
      await updateDoc(userDocRef, data);
      const updatedProfile = await fetchUserProfile(currentUser.uid);
      setUserProfile(updatedProfile);
      showToast("Perfil atualizado com sucesso!", 'success');
    } catch (error) {
      console.error("Erro ao atualizar o perfil:", error);
      showToast("Não foi possível atualizar o perfil.", 'error');
    }
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
      showToast("Não foi possível atualizar os seus favoritos.", 'error');
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    try {
      await deleteDoc(appointmentRef);
      showToast("Agendamento removido com sucesso!", 'success');
    } catch (error) {
      console.error("Erro ao remover agendamento:", error);
      showToast("Não foi possível processar a solicitação.", 'error');
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'cancelled' | 'completed' | 'no-show', price?: number) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    try {
      const dataToUpdate: { status: string; totalPrice?: number } = { status };
      if (status === 'completed' && price !== undefined) {
        dataToUpdate.totalPrice = price;
      }
      await updateDoc(appointmentRef, dataToUpdate);
      showToast('Estado do agendamento atualizado!', 'success');
    } catch (error) {
      console.error("Erro ao atualizar o estado do agendamento:", error);
      showToast("Não foi possível atualizar o agendamento.", 'error');
    }
  };

  const requestFCMToken = async () => {
    if (!currentUser) return;
    try {
      const fcmToken = await requestForToken();
      if (fcmToken) {
        const userDocRef = doc(db, `users/${currentUser.uid}`);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const currentTokens = userDoc.data().fcmTokens || [];
          if (!currentTokens.includes(fcmToken)) {
            await updateDoc(userDocRef, { fcmTokens: arrayUnion(fcmToken) });
            console.log("Token FCM guardado no perfil do utilizador.");
          }
        }
      }
    } catch (error) {
      console.error("Erro ao guardar o token FCM:", error);
    }
  };

  const submitReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'clientName' | 'clientPhotoURL'>) => {
    if (!userProfile) {
      showToast("Precisa de estar autenticado para deixar uma avaliação.", 'error');
      return;
    }

    const establishmentRef = doc(db, "users", reviewData.serviceProviderId);
    const reviewRef = doc(collection(db, `users/${reviewData.serviceProviderId}/reviews`));
    const appointmentRef = doc(db, "appointments", reviewData.appointmentId);

    try {
      await runTransaction(db, async (transaction) => {
        const establishmentDoc = await transaction.get(establishmentRef);
        if (!establishmentDoc.exists()) {
          throw "Estabelecimento não encontrado!";
        }

        transaction.set(reviewRef, { 
          ...reviewData,
          id: reviewRef.id,
          clientName: userProfile.displayName || 'Anónimo',
          clientPhotoURL: userProfile.photoURL || '',
          createdAt: Timestamp.now() 
        });

        const establishmentData = establishmentDoc.data() as UserProfile;
        const currentRating = establishmentData.averageRating || 0;
        const reviewCount = establishmentData.reviewCount || 0;
        const newReviewCount = reviewCount + 1;
        const newAverageRating = (currentRating * reviewCount + reviewData.rating) / newReviewCount;

        transaction.update(establishmentRef, {
          averageRating: newAverageRating,
          reviewCount: newReviewCount,
        });

        transaction.update(appointmentRef, { hasBeenReviewed: true });
      });

      showToast("A sua avaliação foi enviada com sucesso!", 'success');
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      showToast("Ocorreu um erro ao enviar a sua avaliação.", 'error');
    }
  };

  // <-- FUNÇÃO DE UPLOAD DE IMAGEM -->
  const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUserProfile,
    setUserProfile,
    toggleFavorite,
    cancelAppointment,
    updateAppointmentStatus,
    requestFCMToken,
    submitReview,
    uploadImage, // <-- Adicionado ao contexto
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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

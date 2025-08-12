import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  collection,
  runTransaction,
  serverTimestamp,
  onSnapshot, // Essencial para a reatividade
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getToken } from "firebase/messaging";

import { auth, db, storage, messaging } from "../firebase/config";
import type { UserProfile, Review, Address } from "../types";
import { useToast } from "./ToastContext";

// --- Tipagem do Contexto (Adicionando changePassword) ---
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
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  toggleFavorite: (professionalId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  updateAppointmentStatus: (
    appointmentId: string,
    serviceProviderId: string,
    status: "confirmed" | "cancelled" | "completed" | "no-show",
    price?: number
  ) => Promise<void>;
  requestFCMToken: () => Promise<void>;
  submitReview: (
    reviewData: Omit<Review, "id" | "createdAt" | "clientName" | "clientPhotoURL">
  ) => Promise<void>;
  uploadImage: (file: File, path: string) => Promise<string>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Funções Auxiliares (sem alterações) ---
const geocodeAddress = async (address: Partial<Address>): Promise<{ latitude: number; longitude: number } | null> => {
    if (!address.street || !address.city || !address.state) return null;
    const addressString = `${address.street}, ${address.number || ''}, ${address.city}, ${address.state}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressString)}&format=json&limit=1`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Nominatim falhou');
        const data = await response.json();
        if (data && data.length > 0) return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        return null;
    } catch (error) {
        console.error("Erro de Geocoding:", error);
        return null;
    }
};

export const requestForToken = async (): Promise<string | null> => {
    try {
        const currentToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
        return currentToken || null;
    } catch (err) {
        console.error('Ocorreu um erro ao recuperar o token.', err);
        return null;
    }
};

// --- Componente Provedor ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Efeito principal que gerencia TODO o ciclo de vida da autenticação.
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    // O listener onAuthStateChanged é a fonte única da verdade.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Sempre que o usuário muda, primeiro limpamos o listener de perfil anterior.
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      if (user) {
        // --- USUÁRIO LOGADO ---
        setCurrentUser(user);
        const profileDocRef = doc(db, "users", user.uid);

        // Criamos um novo listener em tempo real para o perfil do usuário atual.
        unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false); // Finaliza o loading após obter o perfil.
        }, (error) => {
          console.error("Erro no listener do perfil:", error);
          setUserProfile(null);
          setLoading(false);
        });
      } else {
        // --- USUÁRIO DESLOGADO ---
        // Limpa TODOS os estados relacionados ao usuário de uma só vez.
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Função de limpeza principal: desliga o listener de autenticação.
    return () => unsubscribeAuth();
  }, []); // O array vazio [] garante que este setup rode apenas uma vez.

  // --- Funções de Autenticação (simplificadas) ---

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O listener onAuthStateChanged cuidará do resto.
    } catch (error: any) {
      showToast(error.code, "error");
      setLoading(false); // Garante que o loading para em caso de erro.
      throw error;
    }
  };

  const register = async (email: string, password: string, userType: "client" | "serviceProvider", profileData: Partial<UserProfile> = {}) => {
    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const newProfile: UserProfile = {
            uid: user.uid, email: user.email!, createdAt: serverTimestamp(), userType, ...profileData,
        };
        if (newProfile.userType === "serviceProvider" && newProfile.address) {
            const coords = await geocodeAddress(newProfile.address);
            if (coords) {
                newProfile.address.latitude = coords.latitude;
                newProfile.address.longitude = coords.longitude;
            }
        }
        await setDoc(doc(db, "users", user.uid), newProfile);
        // O listener onAuthStateChanged cuidará do resto.
    } catch (error: any) {
        showToast(error.code, "error");
        setLoading(false);
        throw error;
    }
  };
  
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const profileDoc = await getDoc(doc(db, `users/${user.uid}`));
        if (!profileDoc.exists()) {
            const newProfile: UserProfile = {
                uid: user.uid, email: user.email!, createdAt: serverTimestamp(), userType: "client",
                displayName: user.displayName || "", photoURL: user.photoURL || "",
            };
            await setDoc(doc(db, `users/${user.uid}`), newProfile);
        }
        // O listener onAuthStateChanged cuidará do resto.
    } catch (error: any) {
        showToast(error.code, "error");
        setLoading(false);
        throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      showToast("Você foi desconectado com sucesso!", "info");
      // O listener onAuthStateChanged cuidará de limpar os estados.
    } catch (error: any) {
      showToast("Erro ao fazer logout.", "error");
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) {
        showToast("Usuário não encontrado.", "error");
        return;
    }
    try {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        showToast("Senha alterada com sucesso!", "success");
    } catch (error: any) {
        console.error("Erro ao alterar senha:", error);
        showToast("Falha ao alterar a senha. Verifique sua senha atual.", "error");
        throw error;
    }
  };

  // --- Outras Funções (sem alterações na lógica interna) ---
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
        await updateDoc(doc(db, `users/${currentUser.uid}`), data);
        showToast("Perfil atualizado com sucesso!", "success");
    } catch (error) {
        showToast("Não foi possível atualizar o perfil.", "error");
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };
  
  // ... (Restante das suas funções: toggleFavorite, cancelAppointment, etc. permanecem iguais)
  const toggleFavorite = async (professionalId: string) => {
    if (!currentUser || !userProfile) return;
    const userDocRef = doc(db, `users/${currentUser.uid}`);
    const isFavorite = userProfile.favoriteProfessionals?.includes(professionalId);
    try {
      await updateDoc(userDocRef, {
        favoriteProfessionals: isFavorite
          ? arrayRemove(professionalId)
          : arrayUnion(professionalId),
      });
      showToast(
        isFavorite ? "Removido dos favoritos." : "Adicionado aos favoritos!",
        "info"
      );
    } catch (error: any) {
      showToast("Não foi possível atualizar os seus favoritos.", "error");
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    const appointmentRef = doc(db, "appointments", appointmentId);
    try {
      await deleteDoc(appointmentRef);
      showToast("Agendamento removido com sucesso!", "success");
    } catch (error: any) {
      showToast("Não foi possível processar a solicitação.", "error");
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    serviceProviderId: string,
    status: "confirmed" | "cancelled" | "completed" | "no-show",
    price?: number
  ) => {
    const appointmentRef = doc(db, "appointments", appointmentId);
    const serviceProviderRef = doc(db, "users", serviceProviderId);
    try {
      await runTransaction(db, async (transaction) => {
        const appointmentDoc = await transaction.get(appointmentRef);
        if (!appointmentDoc.exists()) throw new Error("Agendamento não encontrado!");
        const dataToUpdate: { status: string; totalPrice?: number } = { status };
        if (status === "completed" && price !== undefined) {
          dataToUpdate.totalPrice = price;
          const serviceProviderDoc = await transaction.get(serviceProviderRef);
          if (serviceProviderDoc.exists()) {
            const currentRevenue = (serviceProviderDoc.data() as UserProfile).totalRevenue || 0;
            transaction.update(serviceProviderRef, { totalRevenue: currentRevenue + price });
          }
        }
        transaction.update(appointmentRef, dataToUpdate);
      });
      showToast("Estado do agendamento atualizado!", "success");
    } catch (error: any) {
      showToast("Não foi possível atualizar o agendamento.", "error");
    }
  };

  const requestFCMToken = async () => {
    if (!currentUser) return;
    try {
      const fcmToken = await requestForToken();
      if (fcmToken) {
        await updateDoc(doc(db, `users/${currentUser.uid}`), { fcmTokens: arrayUnion(fcmToken) });
      }
    } catch (error) {
      console.error("Erro ao guardar o token FCM:", error);
    }
  };

  const submitReview = async (
    reviewData: Omit<Review, "id" | "createdAt" | "clientName" | "clientPhotoURL">
  ) => {
    if (!userProfile) {
      showToast("Precisa de estar autenticado para deixar uma avaliação.", "error");
      return;
    }
    const establishmentRef = doc(db, "users", reviewData.serviceProviderId);
    const reviewRef = doc(collection(db, `users/${reviewData.serviceProviderId}/reviews`));
    const appointmentRef = doc(db, "appointments", reviewData.appointmentId);
    try {
      await runTransaction(db, async (transaction) => {
        const establishmentDoc = await transaction.get(establishmentRef);
        if (!establishmentDoc.exists()) throw "Estabelecimento não encontrado!";
        transaction.set(reviewRef, {
          ...reviewData,
          id: reviewRef.id,
          clientName: userProfile.displayName || "Anónimo",
          clientPhotoURL: userProfile.photoURL || "",
          createdAt: serverTimestamp(),
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
      showToast("A sua avaliação foi enviada com sucesso!", "success");
    } catch (error: any) {
      showToast(`Ocorreu um erro: ${error.message || error}`, "error");
    }
  };


  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    changePassword,
    updateUserProfile,
    toggleFavorite,
    cancelAppointment,
    updateAppointmentStatus,
    requestFCMToken,
    submitReview,
    uploadImage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

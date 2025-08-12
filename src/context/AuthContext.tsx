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
  onSnapshot, // Importação crucial para a correção
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getToken } from "firebase/messaging";

// Importa os serviços do seu arquivo de configuração
import { auth, db, storage, messaging } from "../firebase/config";
import type { UserProfile, Review, Address } from "../types";
import { useToast } from "./ToastContext";

// --- Tipagem do Contexto (sem alterações) ---
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
  updateAppointmentStatus: (
    appointmentId: string,
    serviceProviderId: string,
    status: "confirmed" | "cancelled" | "completed" | "no-show",
    price?: number
  ) => Promise<void>;
  requestFCMToken: () => Promise<void>;
  submitReview: (
    reviewData: Omit<
      Review,
      "id" | "createdAt" | "clientName" | "clientPhotoURL"
    >
  ) => Promise<void>;
  uploadImage: (file: File, path: string) => Promise<string>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Funções Auxiliares (sem alterações) ---
const geocodeAddress = async (
  address: Address
): Promise<{ latitude: number; longitude: number } | null> => {
  if (!address || !address.street || !address.city || !address.state) {
    console.warn("Endereço insuficiente para geocodificação.");
    return null;
  }
  const addressString = `${address.street}, ${address.number || ""}, ${
    address.neighborhood || ""
  }, ${address.city}, ${address.state}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    addressString
  )}&format=json&limit=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`A API Nominatim respondeu com o status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    }
    console.warn("Nenhum resultado encontrado para o endereço:", addressString);
    return null;
  } catch (error) {
    console.error("Erro ao fazer geocoding do endereço:", error);
    return null;
  }
};

export const requestForToken = async (): Promise<string | null> => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    if (currentToken) return currentToken;
    return null;
  } catch (err) {
    console.error("Ocorreu um erro ao recuperar o token.", err);
    return null;
  }
};

// --- Componente Provedor ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // **HOOK CORRIGIDO USANDO onSnapshot PARA EVITAR CONDIÇÃO DE CORRIDA**
  useEffect(() => {
    // Listener 1: Observa apenas o estado de autenticação (usuário logado/deslogado).
    // Ele define `currentUser`.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // Se não houver usuário, o carregamento inicial termina aqui.
      if (!user) {
        setLoading(false);
      }
    });

    // Listener 2: Observa o documento do perfil no Firestore.
    // Ele só é ativado se `currentUser` tiver um valor.
    let unsubscribeProfile: () => void;

    if (currentUser) {
      const profileDocRef = doc(db, "users", currentUser.uid);
      
      // onSnapshot cria um ouvinte em tempo real.
      unsubscribeProfile = onSnapshot(
        profileDocRef,
        (docSnap) => {
          // Este código é executado sempre que o documento do perfil muda.
          if (docSnap.exists()) {
            // Se o documento existe (ou foi acabado de criar), atualiza o perfil.
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Se o documento ainda não existe (durante o registro), define o perfil como nulo.
            // O onSnapshot continuará escutando e irá atualizar quando o perfil for criado.
            setUserProfile(null);
            console.log("Aguardando criação do perfil no Firestore...");
          }
          // Finaliza o carregamento, pois já temos uma resposta (mesmo que seja "perfil ainda não existe").
          setLoading(false);
        },
        (error) => {
          console.error("Erro ao escutar o perfil do usuário:", error);
          setUserProfile(null);
          setLoading(false);
        }
      );
    }

    // Função de limpeza: desliga os listeners quando o componente é desmontado.
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [currentUser]); // A dependência [currentUser] garante que o listener do perfil seja recriado quando o usuário loga ou desloga.


  // --- Funções de Autenticação e Gerenciamento (sem alterações na lógica interna) ---

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Login bem-sucedido!", "success");
    } catch (error: any) {
      console.error("Erro no login:", error);
      showToast(error.message, "error");
      throw error;
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
        createdAt: serverTimestamp(),
        userType,
        ...profileData,
      };
      if (newProfile.userType === "serviceProvider" && newProfile.address) {
        const coords = await geocodeAddress(newProfile.address);
        if (coords) {
          newProfile.address.latitude = coords.latitude;
          newProfile.address.longitude = coords.longitude;
        }
      }
      // Esta função apenas cria o documento. O onSnapshot cuidará de atualizar o estado.
      await setDoc(doc(db, "users", user.uid), newProfile);
      showToast("Cadastro realizado com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro no registro:", error);
      showToast(error.message, "error");
      throw error;
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
      const profileDoc = await getDoc(doc(db, `users/${user.uid}`));
      if (!profileDoc.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          createdAt: serverTimestamp(),
          userType: "client",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
        };
        await setDoc(doc(db, `users/${user.uid}`), newProfile);
      }
      showToast("Login com Google bem-sucedido!", "success");
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      showToast(error.message, "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      showToast("Você foi desconectado com sucesso!", "info");
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      showToast("Não foi possível fazer logout.", "error");
      throw error;
    }
    // O loading será setado para false pelo listener principal quando o usuário for nulo.
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    setLoading(true);
    const userDocRef = doc(db, `users/${currentUser.uid}`);
    try {
      await updateDoc(userDocRef, data);
      // A atualização otimista abaixo é opcional, pois o onSnapshot já faria o trabalho.
      // Mas pode dar uma sensação de maior responsividade.
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
      showToast("Perfil atualizado com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao atualizar o perfil:", error);
      showToast("Não foi possível atualizar o perfil.", "error");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    setLoading(true);
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      showToast("Imagem enviada com sucesso!", "success");
      return downloadURL;
    } catch (error: any) {
      console.error("Erro no upload da imagem:", error);
      showToast("Falha no upload da imagem.", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

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
      console.error("Erro ao favoritar profissional:", error);
      showToast("Não foi possível atualizar os seus favoritos.", "error");
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    const appointmentRef = doc(db, "appointments", appointmentId);
    try {
      await deleteDoc(appointmentRef);
      showToast("Agendamento removido com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao remover agendamento:", error);
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
      console.error("Erro ao atualizar o estado do agendamento:", error);
      showToast("Não foi possível atualizar o agendamento.", "error");
    }
  };

  const requestFCMToken = async () => {
    if (!currentUser) return;
    try {
      const fcmToken = await requestForToken();
      if (fcmToken) {
        const userDocRef = doc(db, `users/${currentUser.uid}`);
        await updateDoc(userDocRef, { fcmTokens: arrayUnion(fcmToken) });
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
      console.error("Erro ao enviar avaliação:", error);
      showToast(`Ocorreu um erro: ${error.message || error}`, "error");
    }
  };

  const value = { currentUser, userProfile, loading, login, register, loginWithGoogle, logout, updateUserProfile, toggleFavorite, cancelAppointment, updateAppointmentStatus, requestFCMToken, submitReview, uploadImage };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

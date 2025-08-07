import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
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
  runTransaction, // Importação adicionada
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getToken } from "firebase/messaging";

// Importa os serviços do novo arquivo de configuração
import { auth, db, storage, messaging } from "../firebase/config";
import type { UserProfile, Review, Appointment } from "../types";
import { useToast } from "./ToastContext";

// Função para solicitar o token FCM
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
  // Atualizado para incluir o serviceProviderId para a transação
  updateAppointmentStatus: (appointmentId: string, serviceProviderId: string, status: 'confirmed' | 'cancelled' | 'completed' | 'no-show', price?: number) => Promise<void>;
  requestFCMToken: () => Promise<void>;
  submitReview: (reviewData: Omit<Review, 'id' | 'createdAt' | 'clientName' | 'clientPhotoURL'>) => Promise<void>;
  uploadImage: (file: File, path: string) => Promise<string>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Função para buscar o perfil do usuário no Firestore
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

  // Efeito para observar mudanças no estado de autenticação do Firebase
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
    // Retorna a função de unsubscribe para limpar o listener quando o componente for desmontado
    return unsubscribe;
  }, []);

  // Função para login com email e senha
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Função para registro de novo usuário
  const register = async (email: string, password: string, userType: "client" | "serviceProvider", profileData: Partial<UserProfile> = {}) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const newProfile: UserProfile = {
        uid: user.uid, email: user.email!, createdAt: new Date(), userType,
        displayName: profileData.displayName || (userType === 'client' ? profileData.displayName : ''),
        establishmentName: profileData.establishmentName || (userType === 'serviceProvider' ? profileData.establishmentName : ''),
        ...profileData,
      };
      // Salva o novo perfil no Firestore
      await setDoc(doc(db, `users/${user.uid}`), newProfile);
      setUserProfile(newProfile);
  };

  // Função para login com Google
  const loginWithGoogle = async () => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profile = await fetchUserProfile(user.uid);
      // Se o perfil não existir, cria um novo
      if (!profile) {
        const newProfile: UserProfile = {
          uid: user.uid, email: user.email!, createdAt: new Date(), userType: "client",
          displayName: user.displayName || "", photoURL: user.photoURL || "",
        };
        await setDoc(doc(db, `users/${user.uid}`), newProfile);
        setUserProfile(newProfile);
      }
  };

  // Função para logout
  const logout = async () => {
    try {
      await signOut(auth);
      showToast("Você foi desconectado com sucesso!", "info"); // Notificação de logout
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      showToast("Não foi possível fazer logout.", "error");
    }
  };

  // Função para atualizar o perfil do usuário no Firestore
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

  // Função para adicionar/remover profissional dos favoritos
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
      showToast(isFavorite ? "Removido dos favoritos." : "Adicionado aos favoritos!", 'info');
    } catch (error) {
      console.error("Erro ao favoritar profissional:", error);
      showToast("Não foi possível atualizar os seus favoritos.", 'error');
    }
  };

  // Função para cancelar um agendamento (exclui o documento)
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

  // Função para atualizar o status de um agendamento e a receita do prestador
  const updateAppointmentStatus = async (appointmentId: string, serviceProviderId: string, status: 'confirmed' | 'cancelled' | 'completed' | 'no-show', price?: number) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const serviceProviderRef = doc(db, 'users', serviceProviderId); // Referência ao perfil do prestador

    try {
      await runTransaction(db, async (transaction) => {
        const appointmentDoc = await transaction.get(appointmentRef);
        if (!appointmentDoc.exists()) {
          throw new Error("Agendamento não encontrado!");
        }

        const dataToUpdate: { status: string; totalPrice?: number } = { status };

        if (status === 'completed' && price !== undefined) {
          dataToUpdate.totalPrice = price;

          // Atualiza a receita total no perfil do prestador de serviço
          const serviceProviderDoc = await transaction.get(serviceProviderRef);
          if (serviceProviderDoc.exists()) {
            const currentRevenue = (serviceProviderDoc.data() as UserProfile).totalRevenue || 0;
            const newRevenue = currentRevenue + price;
            transaction.update(serviceProviderRef, { totalRevenue: newRevenue });
          } else {
            console.warn("Perfil do prestador de serviço não encontrado para atualizar a receita.");
          }
        }

        transaction.update(appointmentRef, dataToUpdate);
      });

      showToast('Estado do agendamento atualizado!', 'success');
      // Após a atualização, recarrega o perfil do usuário para refletir a nova receita
      if (currentUser) {
        const updatedProfile = await fetchUserProfile(currentUser.uid);
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Erro ao atualizar o estado do agendamento ou receita:", error);
      showToast("Não foi possível atualizar o agendamento.", 'error');
    }
  };

  // Função para solicitar e salvar o token FCM
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

  // Função para submeter uma avaliação e atualizar a média do estabelecimento
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

  // Função para upload de imagem para o Firebase Storage
  const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  // Objeto de valor do contexto que será fornecido aos componentes filhos
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
    uploadImage,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Renderiza os filhos apenas quando o carregamento inicial do usuário estiver completo */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

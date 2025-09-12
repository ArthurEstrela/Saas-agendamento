import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./config";
// Correção aqui: usando 'import type'
import type {
  UserProfile,
  ClientProfile,
  ServiceProviderProfile,
  UserRole,
} from "../types";

const convertTimestamps = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = (data[key] as Timestamp).toDate();
    }
  }
  return data;
};

export const createUserProfile = async (
  uid: string,
  email: string,
  name: string,
  role: UserRole
): Promise<void> => {
  const userRef = doc(db, "users", uid);

  const baseProfile = {
    id: uid,
    email,
    name,
    role,
    createdAt: serverTimestamp(), // Isso é do tipo FieldValue
  };

  let specificProfile;

  if (role === "client") {
    specificProfile = {
      ...baseProfile,
      role: "client",
      favoriteProfessionals: [],
      // Correção aqui: usando o cast 'as unknown' para compatibilizar FieldValue e Date
    } as unknown as ClientProfile;
  } else {
    specificProfile = {
      ...baseProfile,
      role: "serviceProvider",
      businessName: "Meu Negócio",
      businessAddress: "",
      services: [],
      professionals: [],
      reviews: [],
      // Correção aqui: usando o cast 'as unknown'
    } as unknown as ServiceProviderProfile;
  }

  await setDoc(userRef, specificProfile);
};

export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const convertedData = convertTimestamps(data);
    return convertedData as unknown as UserProfile;
  } else {
    console.warn(`Nenhum perfil encontrado para o UID: ${uid}`);
    return null;
  }
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
};

export const toggleFavoriteProfessional = async (
  clientId: string,
  professionalId: string
): Promise<void> => {
  const clientRef = doc(db, "users", clientId);
  const clientSnap = await getDoc(clientRef);

  if (!clientSnap.exists()) {
    throw new Error("Cliente não encontrado.");
  }

  const clientData = clientSnap.data();
  const isFavorite = clientData.favoriteProfessionals?.includes(professionalId);

  await updateDoc(clientRef, {
    favoriteProfessionals: isFavorite
      ? arrayRemove(professionalId)
      : arrayUnion(professionalId),
  });
};

export const getProfessionalsByIds = async (professionalIds: string[]): Promise<ServiceProviderProfile[]> => {
  if (professionalIds.length === 0) {
    return [];
  }

  try {
    const usersCollection = collection(db, 'users');
    
    // --- CORREÇÃO AQUI ---
    // Adicionamos 'where('role', '==', 'serviceProvider')' para alinhar com as regras de segurança.
    // Isso garante que a query só peça por documentos que o usuário tem permissão para ler.
    const q = query(
      usersCollection, 
      where('id', 'in', professionalIds),
      where('role', '==', 'serviceProvider') // Garante que só buscamos prestadores
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Lembre-se de converter Timestamps se necessário
      return data as ServiceProviderProfile;
    });
  } catch (error) {
    console.error("Erro ao buscar perfis de favoritos. Verifique as regras e os índices do Firestore.", error);
    return [];
  }
};

export const searchServiceProviders = async (
  searchTerm: string = ""
): Promise<ServiceProviderProfile[]> => {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("role", "==", "serviceProvider")); // Vamos manter a query, mas a regra de segurança é a chave

  try {
    const querySnapshot = await getDocs(q);

    const providers = querySnapshot.docs.map(
      (doc) => doc.data() as ServiceProviderProfile
    );

    // Filtro por termo de busca (se houver)
    if (searchTerm.trim() !== "") {
      return providers.filter(
        (p) =>
          p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return providers; // Retorna todos se não houver termo de busca
  } catch (error) {
    console.error(
      "Erro ao buscar prestadores de serviço. Verifique suas regras de segurança do Firestore.",
      error
    );
    // Retorna um array vazio em caso de erro para não quebrar a UI
    return [];
  }
};

export const uploadProfilePicture = async (
  uid: string,
  file: File
): Promise<string> => {
  const storage = getStorage();
  const filePath = `profile_pictures/${uid}/${file.name}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  // Atualiza a URL da foto no perfil do usuário no Firestore
  await updateUserProfile(uid, { profilePictureUrl: downloadURL });

  return downloadURL;
};

export const getProviderProfileBySlug = async (
  slug: string
): Promise<ServiceProviderProfile | null> => {
  const usersCollection = collection(db, "users");
  const q = query(
    usersCollection,
    where("publicProfileSlug", "==", slug),
    where("role", "==", "serviceProvider"),
    limit(1)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const providerData = querySnapshot.docs[0].data();
  // Lembre-se de converter Timestamps se necessário
  return providerData as ServiceProviderProfile;
};

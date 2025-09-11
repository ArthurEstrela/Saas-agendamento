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

export const getProfessionalsByIds = async (
  professionalIds: string[]
): Promise<ServiceProviderProfile[]> => {
  if (professionalIds.length === 0) {
    return [];
  }

  const usersCollection = collection(db, "users");
  // O Firestore permite buscar até 30 itens com o operador 'in'
  const q = query(usersCollection, where("id", "in", professionalIds));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    // Supondo que você tenha uma função para converter timestamps, se necessário
    // const convertedData = convertTimestamps(data);
    return data as ServiceProviderProfile;
  });
};

export const searchServiceProviders = async (
  searchTerm: string = ""
): Promise<ServiceProviderProfile[]> => {
  const usersCollection = collection(db, "users");
  const q = query(
    usersCollection,
    where("role", "==", "serviceProvider")
    // Adicionar mais filtros aqui no futuro, ex:
    // where('businessName', '>=', searchTerm),
    // where('businessName', '<=', searchTerm + '\uf8ff')
  );

  const querySnapshot = await getDocs(q);
  const providers = querySnapshot.docs.map(
    (doc) => doc.data() as ServiceProviderProfile
  );

  // Filtro simples no lado do cliente por enquanto
  if (searchTerm) {
    return providers.filter(
      (p) =>
        p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return providers;
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

export const getProviderProfileBySlug = async (slug: string): Promise<ServiceProviderProfile | null> => {
  const usersCollection = collection(db, 'users');
  const q = query(
    usersCollection,
    where('publicProfileSlug', '==', slug),
    where('role', '==', 'serviceProvider'),
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

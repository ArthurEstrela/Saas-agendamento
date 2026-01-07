import {
  doc,
  getDoc,
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
  writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";
import type {
  UserProfile,
  ClientProfile,
  ServiceProviderProfile,
  UserRole,
} from "../types";

// --- HELPER FUNCTIONS ---

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

const createSlug = (text: string) => {
  const a =
    "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
  const b =
    "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(p, (c) => b.charAt(a.indexOf(c)))
    .replace(/&/g, "-e-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// --- CORE FUNCTIONS ---

export const createUserProfile = async (
  uid: string,
  email: string,
  name: string,
  role: UserRole,
  additionalData?: Partial<ServiceProviderProfile | ClientProfile>
): Promise<void> => {
  // Inicializa o Batch para escrita atômica
  const batch = writeBatch(db);
  const userRef = doc(db, "users", uid);

  const baseProfile = {
    id: uid,
    email,
    name,
    role,
    createdAt: serverTimestamp(),
    phoneNumber: additionalData?.phoneNumber || "",
  };

  let specificProfile: UserProfile;

  if (role === "client") {
    // --- LÓGICA DE CLIENTE ---
    const clientData = additionalData as Partial<ClientProfile>;
    specificProfile = {
      ...baseProfile,
      role: "client",
      favoriteProfessionals: [],
      cpf: clientData?.cpf || "",
      dateOfBirth: clientData?.dateOfBirth || "",
      gender: clientData?.gender || "Prefiro não dizer",
      profilePictureUrl: "",
    } as ClientProfile;

    batch.set(userRef, specificProfile);
  } else {
    // --- LÓGICA DE PRESTADOR DE SERVIÇO (DONO) ---
    const providerData = additionalData as Partial<ServiceProviderProfile>;
    const businessName = providerData?.businessName || `${name}'s Business`;

    specificProfile = {
      ...baseProfile,
      role: "serviceProvider",
      businessName: businessName,
      documentType: providerData?.documentType || "cnpj",
      cnpj: providerData?.cnpj || undefined,
      cpf: providerData?.cpf || undefined,

      businessAddress: providerData?.businessAddress || {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
      businessPhone: providerData?.businessPhone || "",
      areaOfWork: providerData?.areaOfWork || "",
      socialLinks: providerData?.socialLinks || {},
      paymentMethods: providerData?.paymentMethods || [],
      publicProfileSlug: createSlug(businessName),
      logoUrl: "",
      services: [],
      professionals: [], // Começa vazio
      reviews: [],
    } as ServiceProviderProfile;

    // 1. Adiciona o perfil principal ao batch
    batch.set(userRef, specificProfile);

    // REMOVIDO: Lógica que criava o "Profissional Espelho" automaticamente.
    // Agora o usuário deve criar profissionais (ou a si mesmo) via Dashboard/Onboarding.
  }

  // Executa todas as operações de uma vez
  await batch.commit();
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

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storage = getStorage();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// ================== UPLOAD DE LOGO DO PRESTADOR ==================
export const uploadProviderLogo = async (
  providerId: string,
  file: File
): Promise<string> => {
  const filePath = `logos/${providerId}/${file.name}`;
  const downloadURL = await uploadFile(file, filePath);

  await updateUserProfile(providerId, { logoUrl: downloadURL });

  return downloadURL;
};

// =================================================================

export const uploadProfilePicture = async (
  uid: string,
  file: File
): Promise<string> => {
  const filePath = `profile_pictures/${uid}/${file.name}`;
  const downloadURL = await uploadFile(file, filePath);
  await updateUserProfile(uid, { profilePictureUrl: downloadURL });
  return downloadURL;
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

  try {
    const usersCollection = collection(db, "users");
    const q = query(
      usersCollection,
      where("id", "in", professionalIds),
      where("role", "==", "serviceProvider")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return data as ServiceProviderProfile;
    });
  } catch (error) {
    console.error(
      "Erro ao buscar perfis de favoritos. Verifique as regras e os índices do Firestore.",
      error
    );
    return [];
  }
};

export const searchServiceProviders = async (
  searchTerm: string = ""
): Promise<ServiceProviderProfile[]> => {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("role", "==", "serviceProvider"));

  try {
    const querySnapshot = await getDocs(q);
    const providers = querySnapshot.docs.map(
      (doc) => doc.data() as ServiceProviderProfile
    );

    if (searchTerm.trim() !== "") {
      return providers.filter(
        (p) =>
          p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return providers;
  } catch (error) {
    console.error(
      "Erro ao buscar prestadores de serviço. Verifique suas regras de segurança do Firestore.",
      error
    );
    return [];
  }
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
  return providerData as ServiceProviderProfile;
};

export const uploadProviderBanner = async (
  userId: string,
  file: File
): Promise<string> => {
  if (!userId) throw new Error("ID do usuário é necessário para o upload.");
  const filePath = `providerBanners/${userId}/${file.name}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};

// src/firebase/professionalsManagementService.ts

import {
  doc,
  collection,
  deleteDoc,
  getDocs,
  query,
  updateDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./config";
import type { Professional } from "../types";

// Tipo para os dados enviados para a Cloud Function
type CreateProfessionalPayload = {
  name: string;
  email: string;
  password: string;
  serviceIds: string[];
};

// Tipo para a resposta da Cloud Function
type CreateProfessionalResponse = {
  success: boolean;
  professionalId: string;
  uid: string;
};

// Helper para obter a referência da sub-coleção de profissionais
const getProfessionalsCollectionRef = (providerId: string) =>
  collection(db, "serviceProviders", providerId, "professionals");

/**
 * !! NOVO !!
 * Chama a Cloud Function 'createProfessionalUser' para criar o Auth e os docs.
 */
export const createProfessionalAccount = async (
  payload: CreateProfessionalPayload
): Promise<CreateProfessionalResponse> => {
  const createProfessionalUser = httpsCallable<
    CreateProfessionalPayload,
    CreateProfessionalResponse
  >(functions, "createProfessionalUser");

  try {
    const result = await createProfessionalUser(payload);
    return result.data;
  } catch (error) {
    console.error(
      "Erro ao chamar a Cloud Function createProfessionalUser:",
      error
    );
    throw error;
  }
};

/**
 * !! NOVO !!
 * Atualiza as URLs das fotos nos dois documentos (user e professional)
 */
export const updateProfessionalPhotoUrls = async (
  providerId: string,
  uid: string,
  professionalId: string,
  url: string
): Promise<void> => {
  const userDocRef = doc(db, "users", uid);
  const professionalDocRef = doc(
    getProfessionalsCollectionRef(providerId),
    professionalId
  );

  await Promise.all([
    updateDoc(userDocRef, { profilePictureUrl: url }),
    updateDoc(professionalDocRef, { photoURL: url }),
  ]);
};

/**
 * Remove um profissional
 */
export const removeProfessionalFromProvider = async (
  providerId: string,
  professionalId: string
): Promise<void> => {
  const professionalRef = doc(
    getProfessionalsCollectionRef(providerId),
    professionalId
  );
  await deleteDoc(professionalRef);
};

/**
 * Atualiza os dados de um profissional
 */
export const updateProfessionalInProvider = async (
  providerId: string,
  updatedProfessional: Professional
): Promise<void> => {
  const professionalRef = doc(
    getProfessionalsCollectionRef(providerId),
    updatedProfessional.id
  );

  // ✅ CORREÇÃO: Adicionamos o comentário abaixo para ignorar o erro de variável não usada,
  // pois estamos extraindo o 'id' propositalmente apenas para removê-lo de 'dataToUpdate'.
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...dataToUpdate } = updatedProfessional;

  await updateDoc(professionalRef, dataToUpdate);
};

/**
 * Busca todos os profissionais
 */
export const getProfessionalsByProviderId = async (
  providerId: string
): Promise<Professional[]> => {
  const professionalsCollectionRef = getProfessionalsCollectionRef(providerId);
  const q = query(professionalsCollectionRef);
  const querySnapshot = await getDocs(q);
  const professionals: Professional[] = querySnapshot.docs.map(
    (doc) => doc.data() as Professional
  );
  return professionals;
};

/**
 * uploadProfessionalPhoto
 */
export const uploadProfessionalPhoto = async (
  providerId: string,
  professionalId: string,
  file: File
): Promise<string> => {
  const storage = getStorage();
  const filePath = `serviceProviders/${providerId}/professionals/${professionalId}/${file.name}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};
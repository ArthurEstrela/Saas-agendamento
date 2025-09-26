import {
  doc,
  collection, // Novo: para referenciar a sub-coleção
  setDoc, // Novo: para adicionar/atualizar
  deleteDoc, // Novo: para remover
  getDocs, // Novo: para buscar todos os documentos
  query,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./config";
import type { Professional } from "../types"; // ServiceProviderProfile não é mais necessário

// Helper para obter a referência da sub-coleção de profissionais
const getProfessionalsCollectionRef = (providerId: string) =>
  collection(db, "users", providerId, "professionals");

/**
 * Adiciona um novo profissional à sub-coleção.
 * Usa setDoc(docRef, data) em vez de updateDoc(arrayUnion).
 */
export const addProfessionalToProvider = async (
  providerId: string,
  professional: Professional
): Promise<void> => {
  const professionalRef = doc(
    getProfessionalsCollectionRef(providerId),
    professional.id
  );
  // Garante que o ID do documento seja o mesmo ID do objeto Professional
  await setDoc(professionalRef, professional);
};

/**
 * Remove um profissional da sub-coleção usando o ID.
 * Usa deleteDoc(docRef) em vez de updateDoc(arrayRemove).
 */
export const removeProfessionalFromProvider = async (
  providerId: string,
  professionalId: string // Mudamos para receber apenas o ID para ser mais eficiente
): Promise<void> => {
  const professionalRef = doc(
    getProfessionalsCollectionRef(providerId),
    professionalId
  );
  await deleteDoc(professionalRef);
};

/**
 * Atualiza os dados de um profissional existente diretamente na sub-coleção.
 * Usa setDoc (substituindo o documento ou merge: true, dependendo da necessidade).
 */
export const updateProfessionalInProvider = async (
  providerId: string,
  updatedProfessional: Professional
): Promise<void> => {
  const professionalRef = doc(
    getProfessionalsCollectionRef(providerId),
    updatedProfessional.id
  );
  // O setDoc sobrescreve o documento; se você estiver sempre passando o objeto completo, está ok.
  // Se precisar de atualização parcial, use updateDoc(professionalRef, updatedProfessional as Record<string, any>);
  await setDoc(professionalRef, updatedProfessional);
};

/**
 * NOVO: Busca todos os profissionais de um prestador na sub-coleção.
 * ESSENCIAL para a exibição da lista e lógica de agendamento.
 */
export const getProfessionalsByProviderId = async (
  providerId: string
): Promise<Professional[]> => {
  const professionalsCollectionRef = getProfessionalsCollectionRef(providerId);
  const q = query(professionalsCollectionRef);
  const querySnapshot = await getDocs(q);

  // Mapeia os dados do snapshot para o tipo Professional
  const professionals: Professional[] = querySnapshot.docs.map(
    (doc) => doc.data() as Professional
  );

  return professionals;
};

// uploadProfessionalPhoto (Função de Storage) permanece inalterada
export const uploadProfessionalPhoto = async (
  providerId: string,
  professionalId: string,
  file: File
): Promise<string> => {
  const storage = getStorage();
  const filePath = `providers/${providerId}/professionals/${professionalId}/${file.name}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};

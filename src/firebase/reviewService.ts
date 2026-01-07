import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Review } from "../types";

/**
 * Adiciona uma nova avaliação na coleção 'reviews' e atualiza o agendamento correspondente.
 * @param appointmentId O ID do agendamento que está sendo avaliado.
 * @param reviewData Os dados da avaliação (sem id e createdAt).
 */
export const addReview = async (
  appointmentId: string,
  reviewData: Omit<Review, "id" | "createdAt">
): Promise<void> => {
  // 1. Cria a avaliação na coleção principal 'reviews'
  const reviewsCollection = collection(db, "reviews");
  const reviewDocRef = await addDoc(reviewsCollection, {
    ...reviewData,
    appointmentId,
    createdAt: serverTimestamp(),
  });

  // 2. Atualiza o documento do agendamento para incluir uma referência à avaliação
  const appointmentRef = doc(db, "appointments", appointmentId);
  await updateDoc(appointmentRef, {
    reviewId: reviewDocRef.id, // Adiciona o ID da review para referência futura
  });
};

/**
 * Busca todas as avaliações de um prestador de serviço específico.
 * @param providerId O ID do prestador de serviço.
 * @returns Uma promessa que resolve para um array de avaliações.
 */
export const getReviewsForProvider = async (
  providerId: string
): Promise<Review[]> => {
  const reviewsCollection = collection(db, "reviews");
  
  const q = query(
    reviewsCollection,
    where("serviceProviderId", "==", providerId), 
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
    } as Review;
  });
};
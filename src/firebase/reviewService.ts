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
 * Adiciona uma nova avaliação a um agendamento.
 * @param appointmentId O ID do agendamento que está sendo avaliado.
 * @param reviewData Os dados da avaliação.
 */
export const addReviewToAppointment = async (
  appointmentId: string,
  reviewData: Omit<Review, "id" | "createdAt">
): Promise<void> => {
  // Cria a avaliação na coleção 'reviews'
  const reviewsCollection = collection(db, "reviews");
  const reviewDocRef = await addDoc(reviewsCollection, {
    ...reviewData,
    appointmentId,
    createdAt: serverTimestamp(),
  });

  // Atualiza o documento do agendamento para incluir a referência da avaliação
  const appointmentRef = doc(db, "appointments", appointmentId);
  await updateDoc(appointmentRef, {
    review: {
      id: reviewDocRef.id,
      ...reviewData,
      createdAt: new Date(), // Usamos a data atual para a UI
    },
  });
};

export const getReviewsByProviderId = async (
  providerId: string
): Promise<Review[]> => {
  // Como as reviews estão em uma coleção própria, buscamos por um campo que identifique o prestador.
  // Vamos assumir que cada review tem um 'serviceProviderId'.
  const reviewsCollection = collection(db, "reviews");
  const q = query(
    reviewsCollection,
    where("serviceProviderId", "==", providerId),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    // Converte o timestamp, se houver
    if (data["createdAt"] instanceof Timestamp) {
      data["createdAt"] = data["createdAt"].toDate();
    }
    return { id: doc.id, ...data } as Review;
  });
};

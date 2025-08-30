import { db } from './config';
import {
  collection,
  getDocs,
  query,
  orderBy,
  writeBatch,
  doc,
} from 'firebase/firestore';
import type { Review } from '../types';
import { format } from 'date-fns';

/**
 * Busca todas as avaliações de um prestador de serviço.
 * @param serviceProviderId O UID do prestador de serviço.
 * @returns Uma promessa que resolve para um array de avaliações.
 */
export const getReviews = async (serviceProviderId: string): Promise<Review[]> => {
    try {
        const reviewsColPath = `users/${serviceProviderId}/reviews`;
        const reviewsCol = collection(db, reviewsColPath);
        const q = query(reviewsCol, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data()) as Review[];
    } catch (error) {
        console.error('Erro ao buscar avaliações: ', error);
        throw new Error('Não foi possível carregar as avaliações.');
    }
};

/**
 * Cria uma nova avaliação para um prestador e atualiza o agendamento correspondente.
 * @param serviceProviderId O UID do prestador de serviço.
 * @param reviewData Os dados da nova avaliação.
 * @param appointmentId O ID do agendamento que está sendo avaliado.
 */
export const addReview = async (serviceProviderId: string, reviewData: Omit<Review, 'id' | 'date'>, appointmentId: string): Promise<void> => {
    const batch = writeBatch(db);
    
    // 1. Cria a referência para o novo documento na subcoleção de reviews
    const reviewRef = doc(collection(db, `users/${serviceProviderId}/reviews`));
    batch.set(reviewRef, {
        ...reviewData,
        id: reviewRef.id,
        date: format(new Date(), 'yyyy-MM-dd'),
    });

    // 2. Cria a referência para o agendamento e o atualiza
    const appointmentRef = doc(db, 'appointments', appointmentId);
    batch.update(appointmentRef, { hasBeenReviewed: true });

    try {
        await batch.commit();
    } catch (error) {
        console.error('Erro ao criar avaliação: ', error);
        throw new Error('Não foi possível enviar sua avaliação.');
    }
};

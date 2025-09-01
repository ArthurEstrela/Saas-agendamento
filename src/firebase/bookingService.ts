import { db } from './config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
  writeBatch,
  orderBy,
  limit,
} from 'firebase/firestore';
import type { Appointment, Review } from '../types';
import { format } from 'date-fns';

/**
 * Cria um novo agendamento no Firestore.
 * @param appointmentData Os dados do agendamento, sem o 'id'.
 * @returns O ID do documento recém-criado.
 */
export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    console.log('Agendamento criado com ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar agendamento: ', error);
    throw new Error('Não foi possível realizar o agendamento.');
  }
};

/**
 * Busca agendamentos futuros de um cliente específico, ordenados por data.
 * @param clientId O UID do cliente.
 * @returns Uma promessa que resolve para um array de agendamentos.
 */
export const getClientAppointments = async (clientId: string): Promise<Appointment[]> => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const appointmentsCol = collection(db, 'appointments');
    const q = query(
      appointmentsCol,
      where('clientId', '==', clientId),
      where('date', '>=', today),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
  } catch (error) {
    console.error('Erro ao buscar agendamentos do cliente: ', error);
    throw new Error('Não foi possível buscar os agendamentos.');
  }
};

/**
 * Busca todos os agendamentos de um prestador de serviço.
 * @param serviceProviderId O UID do prestador de serviço.
 * @returns Uma promessa que resolve para um array de agendamentos.
 */
export const getServiceProviderAppointments = async (serviceProviderId: string): Promise<Appointment[]> => {
    try {
        const appointmentsCol = collection(db, 'appointments');
        const q = query(
            appointmentsCol,
            where('serviceProviderId', '==', serviceProviderId),
            orderBy('date', 'desc'), // Ordena dos mais recentes para os mais antigos
            orderBy('startTime', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
    } catch (error) {
        console.error('Erro ao buscar agendamentos do prestador: ', error);
        throw new Error('Não foi possível carregar a agenda.');
    }
};

/**
 * Busca todos os agendamentos para um prestador em uma data específica.
 * Essencial para verificar a disponibilidade de horários.
 * @param serviceProviderId O UID do prestador de serviço.
 * @param date A data para a qual os agendamentos serão buscados.
 * @returns Uma promessa que resolve para um array de agendamentos.
 */
export const getAppointmentsForDate = async (serviceProviderId: string, date: Date): Promise<Appointment[]> => {
  try {
    const dateString = format(date, 'yyyy-MM-dd');
    const appointmentsCol = collection(db, 'appointments');
    const q = query(
      appointmentsCol,
      where('serviceProviderId', '==', serviceProviderId),
      where('date', '==', dateString),
      where('status', 'in', ['confirmed', 'pending'])
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
  } catch (error) {
    console.error(`Erro ao buscar agendamentos para a data ${format(date, 'yyyy-MM-dd')}:`, error);
    return []; // Retorna um array vazio em caso de erro para não quebrar a UI
  }
};

/**
 * Atualiza o status de um agendamento (ex: para 'cancelled' ou 'completed').
 * @param appointmentId O ID do agendamento a ser atualizado.
 * @param status O novo status para o agendamento.
 * @param cancellationReason (Opcional) A razão do cancelamento.
 */
export const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'cancelled' | 'completed', cancellationReason?: string): Promise<void> => {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        const updateData: any = { status };
        if (status === 'cancelled' && cancellationReason) {
            updateData.cancellationReason = cancellationReason;
        }
        await updateDoc(appointmentRef, updateData);
    } catch (error) {
        console.error('Erro ao atualizar status do agendamento: ', error);
        throw new Error('Não foi possível atualizar o agendamento.');
    }
};

/**
 * Cria uma nova avaliação e, atomicamente, atualiza o agendamento correspondente.
 * @param reviewData Os dados da avaliação.
 * @param appointmentId O ID do agendamento que está sendo avaliado.
 */
export const createReviewForAppointment = async (reviewData: Omit<Review, 'id' | 'date'>, appointmentId: string): Promise<void> => {
    const batch = writeBatch(db);
    
    // 1. Cria a referência para o novo documento de avaliação
    const reviewRef = doc(collection(db, 'reviews'));
    batch.set(reviewRef, {
        ...reviewData,
        id: reviewRef.id, // Salva o próprio ID no documento
        date: format(new Date(), 'yyyy-MM-dd'),
    });

    // 2. Cria a referência para o agendamento e o atualiza
    const appointmentRef = doc(db, 'appointments', appointmentId);
    batch.update(appointmentRef, { hasBeenReviewed: true });

    try {
        await batch.commit();
        console.log('Avaliação criada e agendamento atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao criar avaliação: ', error);
        throw new Error('Não foi possível enviar sua avaliação.');
    }
};

/**
 * Busca as avaliações de um prestador de serviço, das mais recentes para as mais antigas.
 * @param serviceProviderId O UID do prestador de serviço.
 * @param count O número de avaliações a serem buscadas (opcional).
 * @returns Uma promessa que resolve para um array de avaliações.
 */
export const getReviewsForServiceProvider = async (serviceProviderId: string, count?: number): Promise<Review[]> => {
    try {
        const reviewsCol = collection(db, 'reviews');
        const constraints = [
            where('serviceProviderId', '==', serviceProviderId),
            orderBy('date', 'desc')
        ];

        if (count) {
            constraints.push(limit(count));
        }

        const q = query(reviewsCol, ...constraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data()) as Review[];
    } catch (error) {
        console.error('Erro ao buscar avaliações: ', error);
        throw new Error('Não foi possível carregar as avaliações.');
    }
};
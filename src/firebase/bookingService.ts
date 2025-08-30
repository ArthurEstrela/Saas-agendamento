// src/firebase/bookingService.ts

import { db } from './config';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  Timestamp // Importe o Timestamp para lidar com datas
} from 'firebase/firestore';
import type { Booking } from '../types'; // Garanta que o caminho para seus tipos está correto

/**
 * Representa os dados necessários para criar um novo agendamento,
 * excluindo o 'id' e 'status' que são gerados automaticamente.
 */
type NewBookingData = Omit<Booking, 'id' | 'status'>;

/**
 * Cria um novo agendamento no Firestore.
 * Define o status inicial como 'confirmed' e adiciona um timestamp de criação.
 * * @param bookingData - Os dados do novo agendamento (cliente, serviço, horário, etc.).
 * @returns O ID do documento recém-criado no Firestore.
 * @throws Lança um erro se a criação do documento falhar.
 */
export const addBooking = async (bookingData: NewBookingData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      status: 'confirmed', // Status inicial padrão
      createdAt: Timestamp.now(), // Adiciona um carimbo de data/hora de criação
    });
    console.log('Agendamento criado com sucesso. ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar agendamento no Firestore: ', error);
    // Lança um erro mais específico para quem chamou a função poder tratar
    throw new Error('Não foi possível concluir o agendamento. Por favor, tente novamente.');
  }
};

/**
 * Atualiza o status de um agendamento existente para 'cancelled'.
 * * @param bookingId - O ID do agendamento a ser cancelado.
 * @returns Uma Promise que é resolvida quando a atualização é concluída.
 * @throws Lança um erro se a atualização do documento falhar.
 */
export const cancelBooking = async (bookingId: string): Promise<void> => {
  if (!bookingId) {
    throw new Error('O ID do agendamento é inválido.');
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  try {
    await updateDoc(bookingRef, {
      status: 'cancelled',
    });
    console.log('Agendamento cancelado com sucesso. ID:', bookingId);
  } catch (error) {
    console.error('Erro ao cancelar agendamento no Firestore: ', error);
    throw new Error('Não foi possível cancelar o agendamento. Por favor, tente novamente.');
  }
};

// =================================================================================
// Exemplo de outras funções que poderiam estar aqui (mas não são necessárias agora):
// =================================================================================

/*
// Função para buscar agendamentos (se você precisasse de uma busca única, sem tempo real)
export const getBookingsForUser = async (userId: string): Promise<Booking[]> => {
  // ... lógica com getDocs
}

// Função para reagendar um agendamento
export const rescheduleBooking = async (bookingId: string, newTime: Date): Promise<void> => {
  // ... lógica com updateDoc para alterar startTime e endTime
}
*/
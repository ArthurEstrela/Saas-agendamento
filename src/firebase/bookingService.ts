// src/firebase/bookingService.ts

import { db } from './config';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';
import type { Booking } from '../types';

// O tipo BookingData será tudo do tipo Booking, exceto o id (que será gerado)
// e o createdAt (que será gerado pelo servidor).
type BookingData = Omit<Booking, 'id' | 'createdAt'>;

export const addBooking = async (bookingData: BookingData): Promise<void> => {
  if (!bookingData.providerId) {
    throw new Error('ID do prestador de serviço é obrigatório.');
  }

  // O "batch" garante que ambas as operações (criar o agendamento e atualizar o perfil)
  // aconteçam juntas. Se uma falhar, a outra também é desfeita.
  const batch = writeBatch(db);

  // 1. Cria uma referência para um novo documento na coleção 'bookings'
  const newBookingRef = doc(collection(db, 'bookings'));
  const newBookingId = newBookingRef.id;

  const finalBookingData: Booking = {
    ...bookingData,
    id: newBookingId,
    createdAt: Timestamp.now(), // Usamos o Timestamp do Firebase
    // Converte a string de data para um objeto Date do JS antes de salvar, se não for já.
    date: new Date(bookingData.date), 
  };
  
  batch.set(newBookingRef, finalBookingData);

  // 2. Cria uma referência para o documento do prestador de serviço
  const providerRef = doc(db, 'users', bookingData.providerId);
  
  // Adiciona o agendamento completo à lista de agendamentos do prestador
  // usando arrayUnion para evitar duplicatas e garantir a atomicidade.
  batch.update(providerRef, {
    bookings: arrayUnion(finalBookingData)
  });
  
  // 3. (Opcional) Você também pode querer atualizar o perfil do cliente
  // const clientRef = doc(db, 'users', bookingData.clientId);
  // batch.update(clientRef, {
  //   myAppointments: arrayUnion(finalBookingData)
  // });

  // Executa todas as operações no batch
  await batch.commit();
};
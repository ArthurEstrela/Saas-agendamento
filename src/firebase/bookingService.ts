// src/firebase/bookingService.ts

import { db } from './config';
import {
  collection,
  doc,
  setDoc, // Usaremos setDoc em vez de writeBatch
  Timestamp
} from 'firebase/firestore';
import type { Booking } from '../types';

type BookingData = Omit<Booking, 'id' | 'createdAt'>;

export const addBooking = async (bookingData: BookingData): Promise<void> => {
  // A lógica agora é muito mais simples: apenas criar o agendamento.
  
  // 1. Cria uma referência para um novo documento na coleção 'bookings'
  const newBookingRef = doc(collection(db, 'bookings'));
  const newBookingId = newBookingRef.id;

  const finalBookingData: Booking = {
    ...bookingData,
    id: newBookingId,
    createdAt: Timestamp.now(),
    date: new Date(bookingData.date),
  };
  
  // 2. Salva o novo documento de agendamento
  await setDoc(newBookingRef, finalBookingData);
  
  // A atualização do perfil do prestador foi REMOVIDA daqui.
  // A Cloud Function cuidará disso automaticamente.
};
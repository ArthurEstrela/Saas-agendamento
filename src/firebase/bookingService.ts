import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Appointment } from "../types";

// Helper para converter Timestamps que vem do Firestore
const convertAppointmentTimestamps = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  // Define um tipo local para a review aninhada
  type ReviewWithTimestamp = { createdAt?: unknown };

  // Converte startTime e endTime, se existirem
  if (data["startTime"] instanceof Timestamp) {
    data["startTime"] = (data["startTime"] as Timestamp).toDate();
  }
  if (data["endTime"] instanceof Timestamp) {
    data["endTime"] = (data["endTime"] as Timestamp).toDate();
  }
  // Converte createdAt em reviews, se houver
  const review = data["review"] as ReviewWithTimestamp;
  if (review && review.createdAt instanceof Timestamp) {
    review.createdAt = review.createdAt.toDate();
  }
  return data;
};

/**
 * Cria um novo agendamento no Firestore.
 * O status inicial será 'pending'.
 */
export const createAppointment = async (
  appointmentData: Omit<Appointment, "id">
): Promise<string> => {
  const appointmentsCollection = collection(db, "appointments");
  const docRef = await addDoc(appointmentsCollection, {
    ...appointmentData,
    createdAt: serverTimestamp(), // Adiciona um timestamp de quando foi criado
  });
  return docRef.id;
};

/**
 * Busca todos os agendamentos de um cliente específico.
 */
export const getAppointmentsByClientId = async (
  clientId: string
): Promise<Appointment[]> => {
  const appointmentsCollection = collection(db, "appointments");
  const q = query(
    appointmentsCollection,
    where("clientId", "==", clientId),
    orderBy("startTime", "desc") // Ordena pelos mais recentes primeiro
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    const convertedData = convertAppointmentTimestamps(data);
    return { id: doc.id, ...convertedData } as unknown as Appointment;
  });
};

/**
 * Busca todos os agendamentos de um prestador de serviço (ou profissional específico).
 */
export const getAppointmentsByProviderId = async (
  providerId: string
): Promise<Appointment[]> => {
  const appointmentsCollection = collection(db, "appointments");
  const q = query(
    appointmentsCollection,
    where("professionalId", "==", providerId),
    orderBy("startTime", "asc")
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    const convertedData = convertAppointmentTimestamps(data);
    return { id: doc.id, ...convertedData } as unknown as Appointment;
  });
};

/**
 * Atualiza o status de um agendamento.
 * Ex: 'pending' -> 'scheduled' ou 'scheduled' -> 'completed'
 */
export const updateAppointmentStatus = async (
  appointmentId: string,
  status: Appointment["status"], // Usa o tipo que definimos!
  rejectionReason?: string
): Promise<void> => {
  const appointmentRef = doc(db, "appointments", appointmentId);
  const updateData: {
    status: Appointment["status"];
    rejectionReason?: string;
  } = { status };
  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }
  await updateDoc(appointmentRef, updateData);
};

export const getAppointmentsForProfessionalOnDate = async (
  professionalId: string,
  date: Date
): Promise<Appointment[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const appointmentsRef = collection(db, "appointments");
  // A consulta filtra pelo ID do profissional e pelo intervalo de tempo do dia selecionado
  const q = query(
    appointmentsRef,
    where("professionalId", "==", professionalId),
    where("startTime", ">=", Timestamp.fromDate(startOfDay)),
    where("startTime", "<=", Timestamp.fromDate(endOfDay))
  );

  const querySnapshot = await getDocs(q);
  const appointments: Appointment[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    appointments.push({
      id: doc.id,
      ...data,
      // Converte Timestamps do Firestore para objetos Date do JS
      startTime: (data.startTime as Timestamp).toDate(),
      endTime: (data.endTime as Timestamp).toDate(),
    } as Appointment);
  });

  return appointments;
};

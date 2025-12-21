import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
  orderBy,
  // addDoc e serverTimestamp foram removidos pois agora usamos a Cloud Function para criar
} from "firebase/firestore";
import { db } from "./config";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { Appointment } from "../types";

const functions = getFunctions(db.app);

const convertAppointmentTimestamps = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  type ReviewWithTimestamp = { createdAt?: unknown };

  if (data["startTime"] instanceof Timestamp) {
    data["startTime"] = (data["startTime"] as Timestamp).toDate();
  }
  if (data["endTime"] instanceof Timestamp) {
    data["endTime"] = (data["endTime"] as Timestamp).toDate();
  }
  const review = data["review"] as ReviewWithTimestamp;
  if (review && review.createdAt instanceof Timestamp) {
    review.createdAt = review.createdAt.toDate();
  }
  return data;
};

/**
 * Cria um novo agendamento de forma SEGURA via Cloud Functions.
 * Isso evita duplicidade de horários (Race Condition).
 */
export const createAppointment = async (
  appointmentData: Omit<Appointment, "id">
): Promise<string> => {
  try {
    const createAppointmentCallable = httpsCallable(
      functions,
      "createAppointment"
    );

    // Prepara os dados para envio (serialização segura de datas)
    const payload = {
      ...appointmentData,
      // Convertemos Date para milissegundos para garantir integridade no envio
      startTime: appointmentData.startTime.getTime(),
      endTime: appointmentData.endTime.getTime(),
      // Removemos campos que podem causar erro de serialização se estiverem undefined
      // O backend irá gerar o 'createdAt' oficial
    };

    const result = await createAppointmentCallable(payload);
    const data = result.data as { success: boolean; appointmentId: string };

    return data.appointmentId;
  } catch (error) {
    console.error("Erro ao criar agendamento via Function:", error);
    // Repassa o erro para o store/componente tratar (ex: mostrar mensagem de horário ocupado)
    throw error;
  }
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
  status: Appointment["status"],
  rejectionReason?: string
): Promise<void> => {
  // Verificação de segurança no frontend
  if (status === "completed") {
    console.error(
      "Ação 'completed' é insegura via updateDoc. Use a função 'completeAppointment'."
    );
    throw new Error(
      "Operação inválida. Use a função dedicada para completar agendamentos."
    );
  }

  const appointmentRef = doc(db, "appointments", appointmentId);
  const updateData: {
    status: Appointment["status"];
    rejectionReason?: string;
  } = { status }; // Objeto de atualização simplificado

  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }

  await updateDoc(appointmentRef, updateData);
};

export const completeAppointment = async (
  appointmentId: string,
  finalPrice: number
): Promise<void> => {
  try {
    const completeAppointmentCallable = httpsCallable(
      functions,
      "completeAppointment"
    );
    await completeAppointmentCallable({
      appointmentId,
      finalPrice,
    });
  } catch (error) {
    console.error("Erro ao chamar a função 'completeAppointment':", error);
    throw error;
  }
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
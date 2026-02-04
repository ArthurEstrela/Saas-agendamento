import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
  orderBy,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "./config";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { Appointment } from "../types";

const functions = getFunctions(db.app, "southamerica-east1");

// ✅ HELPER: Converte qualquer formato de data de forma segura e padronizada
const convertToDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string")
    return new Date(value);
  return undefined;
};

// ✅ HELPER: Conversão robusta de Timestamps para Dates (Previne Crash na UI)
export const convertAppointmentTimestamps = (
  docId: string,
  data: Record<string, unknown>
): Appointment => {
  // Tratamento recursivo para sub-objetos (ex: review)
  // FIX: Removido 'any', tipado como objeto genérico ou undefined
  let review = data["review"] as Record<string, unknown> | undefined;

  if (review && review.createdAt) {
    review = { ...review, createdAt: convertToDate(review.createdAt) };
  }

  return {
    ...data,
    id: docId,
    // Garante que campos vitais sejam Date, com fallback para o momento atual se falhar
    startTime: convertToDate(data.startTime) || new Date(),
    endTime: convertToDate(data.endTime) || new Date(),
    createdAt: convertToDate(data.createdAt) || new Date(),

    // Campos opcionais
    completedAt: convertToDate(data.completedAt),
    updatedAt: convertToDate(data.updatedAt),
    cancelledAt: convertToDate(data.cancelledAt),

    review: review,
  } as unknown as Appointment; // Double cast para garantir a tipagem estrita
};

/**
 * Cria um novo agendamento via Cloud Functions para segurança (atomicidade).
 */
export const createAppointment = async (
  appointmentData: Omit<Appointment, "id"> & { reminderMinutes: number }
): Promise<string> => {
  try {
    const createAppointmentCallable = httpsCallable(
      functions,
      "createAppointment"
    );

    const payload = { 
      ...appointmentData,
      // Serializa datas para milissegundos (UTC-safe) antes do envio
      startTime: appointmentData.startTime.getTime(),
      endTime: appointmentData.endTime.getTime(),
      reminderMinutes: appointmentData.reminderMinutes || 60,
    };

    const result = await createAppointmentCallable(payload);
    const data = result.data as { success: boolean; appointmentId: string };

    return data.appointmentId;
  } catch (error) {
    console.error("Erro ao criar agendamento via Function:", error);
    throw error;
  }
};

/**
 * Busca agendamentos de um cliente.
 */
export const getAppointmentsByClientId = async (
  clientId: string
): Promise<Appointment[]> => {
  const appointmentsCollection = collection(db, "appointments");
  const q = query(
    appointmentsCollection,
    where("clientId", "==", clientId),
    orderBy("startTime", "desc")
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) =>
    convertAppointmentTimestamps(doc.id, doc.data())
  );
};

/**
 * Busca agendamentos de um profissional.
 */
export const getAppointmentsByProviderId = async (
  providerId: string
): Promise<Appointment[]> => {
  const appointmentsCollection = collection(db, "appointments");
  const q = query(
    appointmentsCollection,    
    where("providerId", "==", providerId), 
    orderBy("startTime", "asc")
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) =>
    convertAppointmentTimestamps(doc.id, doc.data())
  );
};

/**
 * Atualiza status do agendamento.
 */
/**
 * Atualiza status do agendamento.
 */
export const updateAppointmentStatus = async (
  appointmentId: string,
  status: Appointment["status"],
  rejectionReason?: string
): Promise<void> => {
  if (status === "completed") {
    throw new Error("Use 'completeAppointment' para finalizar agendamentos.");
  }

  const appointmentRef = doc(db, "appointments", appointmentId);

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (rejectionReason) updateData.rejectionReason = rejectionReason;

  // ✅ Fazemos o cast para 'any' apenas no argumento e desativamos o lint para esta linha
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(appointmentRef, updateData as any);
};

/**
 * Finaliza agendamento (financeiro).
 */
export const completeAppointment = async (
  appointmentId: string,
  finalPrice: number
): Promise<void> => {
  const completeAppointmentCallable = httpsCallable(
    functions,
    "completeAppointment"
  );
  await completeAppointmentCallable({ appointmentId, finalPrice });
};

/**
 * Busca agendamentos para verificação de disponibilidade.
 * ✅ CORREÇÃO DE TIMEZONE APLICADA
 */
export const getAppointmentsForProfessionalOnDate = async (
  professionalId: string,
  date: Date
): Promise<Appointment[]> => {
  // 1. Clonamos a data base para não mutar o objeto original
  const baseDate = new Date(date);

  // 2. Definimos o início e fim do dia no horário local
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 3. 🛡️ TIMEZONE SAFETY BUFFER (A Correção Real)
  // Ampliamos a janela de busca em +/- 12 horas.
  // Motivo: Se o cliente está no Brasil (UTC-3) e o profissional na Europa (UTC+1),
  // ou se houver confusão entre UTC/Local no banco, um agendamento às 23:00 pode
  // cair no "dia seguinte" em UTC.
  // Buscar com margem garante que PEGADAREMOS o agendamento conflitante.
  // A filtragem exata de horário acontece na memória (DateTimeSelection.tsx).

  const queryStart = new Date(startOfDay.getTime() - 12 * 60 * 60 * 1000);
  const queryEnd = new Date(endOfDay.getTime() + 12 * 60 * 60 * 1000);

  const appointmentsRef = collection(db, "appointments");

  // A query agora usa a janela expandida
  const q = query(
    appointmentsRef,
    where("professionalId", "==", professionalId),
    where("startTime", ">=", Timestamp.fromDate(queryStart)),
    where("startTime", "<=", Timestamp.fromDate(queryEnd))
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) =>
    convertAppointmentTimestamps(doc.id, doc.data())
  );
};

export const cancelAppointmentSecurely = async (
  appointmentId: string,
  reason: string
): Promise<void> => {
  const cancelCallable = httpsCallable(functions, "cancelAppointmentByClient");
  
  // Isso vai lançar erro se a Cloud Function rejeitar (ex: fora do prazo)
  await cancelCallable({ appointmentId, reason });
};

// Adicione esta função ao arquivo
export const setAppointmentReminder = async (
  appointmentId: string,
  minutesBefore: number
): Promise<void> => {
  const appointmentRef = doc(db, "appointments", appointmentId);
  const appointmentSnap = await getDoc(appointmentRef); // Importar getDoc

  if (!appointmentSnap.exists()) throw new Error("Agendamento não encontrado");

  const data = appointmentSnap.data();
  // Converte o Timestamp do Firestore para Date JS
  const startTime = data.startTime.toDate(); 
  
  // Calcula a hora exata do lembrete (Data do agendamento - Minutos escolhidos)
  const reminderTime = new Date(startTime.getTime() - minutesBefore * 60000);

  await updateDoc(appointmentRef, {
    reminderTime: Timestamp.fromDate(reminderTime),
    reminderOffsetMinutes: minutesBefore,
    reminderSent: false
  });
};

export const createManualAppointment = async (
  appointmentData: Omit<Appointment, "id">
): Promise<string> => {
  try {
    const appointmentsCollection = collection(db, "appointments");
    
    // Adicionamos um marcador 'isManual' para estatísticas futuras
    const docRef = await addDoc(appointmentsCollection, {
      ...appointmentData,
      status: "scheduled", // Já entra como confirmado
      isManual: true,
      createdAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar agendamento manual:", error);
    throw error;
  }
};
// functions/src/index.ts
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { formatInTimeZone } from "date-fns-tz"; // Importa o formatInTimeZone
import { startOfTomorrow, endOfTomorrow } from "date-fns"; // Importa da biblioteca principal

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURAÇÕES GLOBAIS ---
const REGION = "southamerica-east1"; // Região onde suas functions irão rodar
const TIME_ZONE = "America/Sao_Paulo"; // Fuso horário para as funções agendadas

// --- FUNÇÕES AUXILIARES ---

/**
 * Formata um Timestamp do Firestore para data e hora legíveis.
 * @param timestamp O timestamp do Firestore.
 * @returns Um objeto com a data e hora formatadas.
 */
const formatDate = (timestamp: admin.firestore.Timestamp) => {
  if (!timestamp)
    return { formattedDate: "data indefinida", formattedTime: "" };
  const date = timestamp.toDate();
  // Usando formatInTimeZone para mais precisão
  const formattedDate = formatInTimeZone(date, TIME_ZONE, "dd/MM/yyyy");
  const formattedTime = formatInTimeZone(date, TIME_ZONE, "HH:mm");
  return { formattedDate, formattedTime };
};

/**
 * Envia uma notificação push para um usuário específico via FCM.
 * @param recipientId O ID do usuário que receberá a notificação.
 * @param title O título da notificação.
 * @param body O corpo (mensagem) da notificação.
 */
const sendPushNotification = async (
  recipientId: string,
  title: string,
  body: string
) => {
  if (!recipientId) {
    logger.warn("Tentativa de enviar notificação para um ID de usuário vazio.");
    return;
  }
  const userRef = db.collection("users").doc(recipientId);
  try {
    const userDoc = await userRef.get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (fcmToken) {
      const message = { notification: { title, body }, token: fcmToken };
      await admin.messaging().send(message);
      logger.info(`Notificação push enviada para ${recipientId}: "${title}"`);
    } else {
      logger.warn(`Token FCM não encontrado para o usuário: ${recipientId}`);
    }
  } catch (error) {
    logger.error(
      `Erro ao buscar usuário ou enviar notificação para ${recipientId}:`,
      error
    );
  }
};

// --- GATILHOS DO FIRESTORE (TRIGGERS) ---

/**
 * Disparado quando um novo AGENDAMENTO é criado.
 * Envia uma notificação para o prestador de serviço.
 */
export const onAppointmentCreate = onDocumentCreated(
  { document: "appointments/{appointmentId}", region: REGION },
  async (event) => {
    const appointmentData = event.data?.data();
    if (!appointmentData) {
      logger.error("onAppointmentCreate foi disparado sem dados.");
      return;
    }

    const { professionalId, clientName, serviceName, startTime } =
      appointmentData;
    if (!professionalId) return;

    const { formattedDate, formattedTime } = formatDate(startTime);
    const title = "Novo Agendamento!";
    const body = `${clientName || "Um cliente"} agendou "${
      serviceName || "um serviço"
    }" para ${formattedDate} às ${formattedTime}.`;

    await sendPushNotification(professionalId, title, body);
  }
);

/**
 * Disparado quando um AGENDAMENTO é atualizado.
 * Lida com notificações de status (confirmado/cancelado) e cria transações financeiras.
 */
export const onAppointmentUpdate = onDocumentUpdated(
  { document: "appointments/{appointmentId}", region: REGION },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const appointmentId = event.params.appointmentId;

    if (!beforeData || !afterData || beforeData.status === afterData.status) {
      return; // Sai se o status não mudou
    }

    // 1. Notificação para o CLIENTE sobre status (Confirmado / Cancelado)
    if (afterData.status === "confirmed" || afterData.status === "cancelled") {
      const { clientId, serviceName, startTime } = afterData;
      if (!clientId) return;

      const { formattedDate, formattedTime } = formatDate(startTime);
      const title =
        afterData.status === "confirmed"
          ? "Agendamento Confirmado!"
          : "Agendamento Recusado";
      const body = `Seu agendamento para "${serviceName}" em ${formattedDate} às ${formattedTime} foi ${
        afterData.status === "confirmed" ? "confirmado" : "recusado"
      }.`;

      await sendPushNotification(clientId, title, body);
    }

    // 2. Criação de Transação Financeira quando o status for CONCLUÍDO
    if (afterData.status === "completed") {
      const { professionalId, finalPrice } = afterData;
      if (!professionalId || typeof finalPrice === "undefined") {
        logger.error(
          `Dados ausentes (professionalId ou finalPrice) no agendamento ${appointmentId}.`,
          afterData
        );
        return;
      }

      // Usando uma transação para garantir que a operação seja atômica
      await db.runTransaction(async (transaction) => {
        const transRef = db
          .collection("transactions")
          .where("appointmentId", "==", appointmentId);
        const snapshot = await transaction.get(transRef);

        if (!snapshot.empty) {
          logger.log(`Transação para agendamento ${appointmentId} já existe.`);
          return;
        }

        const { clientId, clientName, serviceName, professionalName } =
          afterData;
        const newTransRef = db.collection("transactions").doc(); // Gera um ID único
        transaction.set(newTransRef, {
          providerId: professionalId,
          appointmentId,
          clientId: clientId || "N/A",
          clientName: clientName || "N/A",
          serviceName: serviceName || "Serviço não informado",
          amount: finalPrice,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          professionalName: professionalName || "N/A",
        });
      });
      logger.log(
        `Transação de R$${finalPrice} criada para o agendamento ${appointmentId}`
      );
    }
  }
);

/**
 * !! NOVO !!
 * Disparado quando uma nova AVALIAÇÃO é criada.
 * Recalcula a média de notas e o total de avaliações do prestador de serviço.
 */
export const onReviewCreate = onDocumentCreated(
  { document: "reviews/{reviewId}", region: REGION },
  async (event) => {
    const reviewData = event.data?.data();
    if (!reviewData) {
      logger.error("onReviewCreate foi disparado sem dados.");
      return;
    }

    const { serviceProviderId, rating } = reviewData;
    if (!serviceProviderId || typeof rating !== "number") {
      logger.error("Dados da avaliação incompletos.", reviewData);
      return;
    }

    const providerRef = db.collection("users").doc(serviceProviderId);

    // Usando uma transação para garantir a consistência dos dados
    await db.runTransaction(async (transaction) => {
      const providerDoc = await transaction.get(providerRef);
      if (!providerDoc.exists) {
        logger.error(
          `Prestador de serviço com ID ${serviceProviderId} não encontrado.`
        );
        return;
      }

      const providerData = providerDoc.data()!;
      const oldReviewCount = providerData.reviewCount || 0;
      const oldAverageRating = providerData.averageRating || 0;

      // Cálculo da nova média
      const newReviewCount = oldReviewCount + 1;
      const newAverageRating =
        (oldAverageRating * oldReviewCount + rating) / newReviewCount;

      transaction.update(providerRef, {
        reviewCount: newReviewCount,
        // Arredondando para 1 casa decimal
        averageRating: parseFloat(newAverageRating.toFixed(1)),
      });
    });

    logger.info(
      `Média de avaliação atualizada para o prestador ${serviceProviderId}.`
    );
  }
);

// --- FUNÇÕES AGENDADAS (SCHEDULED FUNCTIONS) ---

/**
 * !! NOVO !!
 * Roda todo dia às 09:00 (fuso horário de São Paulo).
 * Envia lembretes para clientes sobre agendamentos do dia seguinte.
 */
export const sendAppointmentReminders = onSchedule(
  { schedule: "every day 09:00", timeZone: TIME_ZONE, region: REGION },
  async () => {
    logger.info(
      "Executando tarefa agendada: Envio de lembretes de agendamento."
    );

    // CORREÇÃO: As funções startOfTomorrow e endOfTomorrow não precisam de argumentos.
    // Elas usam a hora atual do servidor para calcular o dia seguinte.
    const tomorrowStart = startOfTomorrow();
    const tomorrowEnd = endOfTomorrow();

    const appointmentsRef = db.collection("appointments");
    const q = appointmentsRef
      .where("status", "==", "confirmed")
      .where(
        "startTime",
        ">=",
        admin.firestore.Timestamp.fromDate(tomorrowStart)
      )
      .where(
        "startTime",
        "<=",
        admin.firestore.Timestamp.fromDate(tomorrowEnd)
      );

    const snapshot = await q.get();

    if (snapshot.empty) {
      logger.info("Nenhum agendamento para amanhã. Nenhum lembrete enviado.");
      return;
    }

    const remindersSent: Promise<void>[] = [];
    snapshot.forEach((doc) => {
      const appointment = doc.data();
      const { clientId, serviceName, startTime } = appointment;
      const { formattedTime } = formatDate(startTime);

      const title = "Lembrete de Agendamento!";
      const body = `Lembrete: seu agendamento de "${serviceName}" é amanhã às ${formattedTime}.`;

      remindersSent.push(sendPushNotification(clientId, title, body));
    });

    await Promise.all(remindersSent);
    logger.info(
      `${remindersSent.length} lembretes de agendamento enviados com sucesso.`
    );
  }
);

// --- FUNÇÕES CHAMÁVEIS (CALLABLE FUNCTIONS) ---

/**
 * Cria uma sessão de checkout do Stripe para pagamentos de assinatura.
 */
export const createStripeCheckout = onCall(
  { region: REGION },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Você precisa estar autenticado."
      );
    }
    // Se você não usa Stripe, pode remover esta função
    // O código do Stripe permanece o mesmo que você já tinha.
    throw new HttpsError(
      "unimplemented",
      "A função de pagamento não está habilitada."
    );
  }
);

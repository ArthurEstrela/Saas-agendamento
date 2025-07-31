import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Inicializa o Firebase Admin SDK para ter acesso aos serviços de backend
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Função 1: Disparada quando um agendamento é atualizado.
 * Envia uma notificação quando o status muda para 'confirmed'.
 */
export const sendAppointmentConfirmation = onDocumentUpdated(
  {
    document: "appointments/{appointmentId}",
    region: "southamerica-east1",
  },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // A função só executa se o status mudou de 'pending' para 'confirmed'
    if (beforeData?.status !== "confirmed" && afterData?.status === "confirmed") {
      logger.log(`Agendamento ${event.params.appointmentId} confirmado.`);

      const { clientId, serviceProviderId, date, time } = afterData;

      // Busca os dados do cliente e do profissional
      const clientSnap = await db.collection("users").doc(clientId).get();
      const providerSnap = await db.collection("users").doc(serviceProviderId).get();

      const clientData = clientSnap.data();
      const providerData = providerSnap.data();

      if (!clientData || !providerData || !clientData.fcmTokens?.length) {
        logger.error("Dados do cliente/profissional ou tokens FCM não encontrados.");
        return;
      }

      const establishmentName = providerData.establishmentName || "O salão";
      const formattedDate = new Date(date).toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"});

      // Monta a notificação
      const payload = {
        notification: {
          title: "Seu agendamento foi confirmado! ✅",
          body: `${establishmentName} confirmou seu horário para ${formattedDate} às ${time}.`,
          icon: providerData.photoURL || "/vite.svg",
        },
      };

      // Envia a notificação e limpa tokens inválidos
      await sendNotificationAndCleanup(clientData.fcmTokens, payload, clientSnap.ref);
    }
  });

/**
 * Função 2: Disparada a cada hora.
 * Envia lembretes para agendamentos que ocorrerão na próxima hora.
 */
export const sendAppointmentReminders = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 60 * 60 * 1000); // Daqui a 1 hora
    const windowEnd = new Date(now.getTime() + 120 * 60 * 1000); // Daqui a 2 horas

    const dateStr = windowStart.toISOString().split("T")[0];
    const startTimeStr = windowStart.toTimeString().substring(0, 5);
    const endTimeStr = windowEnd.toTimeString().substring(0, 5);

    logger.log(`Buscando agendamentos para ${dateStr} entre ${startTimeStr} e ${endTimeStr}`);

    const appointments = await db.collection("appointments")
      .where("date", "==", dateStr)
      .where("status", "==", "confirmed")
      .where("time", ">=", startTimeStr)
      .where("time", "<", endTimeStr)
      .get();

    if (appointments.empty) {
      logger.log("Nenhum agendamento na próxima hora.");
      return;
    }

    for (const appointment of appointments.docs) {
      const { clientId, serviceProviderId, time } = appointment.data();

      const clientSnap = await db.collection("users").doc(clientId).get();
      const providerSnap = await db.collection("users").doc(serviceProviderId).get();
      
      const clientData = clientSnap.data();
      const providerData = providerSnap.data();

      if (!clientData || !providerData || !clientData.fcmTokens?.length) {
        logger.warn(`Pulando lembrete para ${appointment.id}: faltam dados ou token.`);
        continue;
      }

      const establishmentName = providerData.establishmentName || "O salão";

      const payload = {
        notification: {
          title: "Lembrete de Agendamento ⏰",
          body: `Seu horário com ${establishmentName} é hoje às ${time}!`,
          icon: providerData.photoURL || "/vite.svg",
        },
      };
      
      await sendNotificationAndCleanup(clientData.fcmTokens, payload, clientSnap.ref);
    }
  });


/**
 * Função auxiliar para enviar notificações e remover tokens inválidos.
 */
async function sendNotificationAndCleanup(tokens: string[], payload: admin.messaging.MessagingPayload, userRef: admin.firestore.DocumentReference) {
  try {
    const response = await messaging.sendToDevice(tokens, payload);
    logger.log(`Notificação enviada para ${response.successCount} de ${tokens.length} tokens.`);

    const tokensToRemove: string[] = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        logger.error(`Falha ao enviar para token: ${tokens[index]}`, error);
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
          tokensToRemove.push(tokens[index]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      logger.log("Removendo tokens inválidos:", tokensToRemove);
      await userRef.update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
      });
    }
  } catch (error) {
    logger.error("Erro geral ao enviar notificação:", error);
  }
}
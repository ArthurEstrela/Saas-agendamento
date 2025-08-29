// functions/src/index.ts

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  onDocumentCreated,
  onDocumentUpdated,
  // Importa os tipos corretos que precisamos
  FirestoreEvent,
  QueryDocumentSnapshot,
  Change,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

const REGION = "southamerica-east1";

// --- FUNÇÃO 1: ATUALIZA PERFIS QUANDO UM AGENDAMENTO É CRIADO ---
export const onBookingCreate = onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    region: REGION,
  },
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const bookingData = event.data?.data();

    if (!bookingData) {
      logger.warn(
        `Nenhum dado encontrado no agendamento ${event.params.bookingId}.`
      );
      return;
    }

    const { providerId, clientId } = bookingData;

    // Atualiza o perfil do prestador
    if (providerId) {
      const providerRef = db.collection("users").doc(providerId);
      try {
        await providerRef.update({
          bookings: admin.firestore.FieldValue.arrayUnion(bookingData),
        });
        logger.info(
          `Perfil do prestador ${providerId} atualizado com o agendamento ${event.params.bookingId}.`
        );
      } catch (error) {
        logger.error(`Falha ao atualizar o prestador ${providerId}:`, error);
      }
    }

    // Atualiza o perfil do cliente
    if (clientId) {
      const clientRef = db.collection("users").doc(clientId);
      try {
        await clientRef.update({
          myAppointments: admin.firestore.FieldValue.arrayUnion(bookingData),
        });
        logger.info(
          `Perfil do cliente ${clientId} atualizado com o agendamento ${event.params.bookingId}.`
        );
      } catch (error) {
        logger.error(`Falha ao atualizar o cliente ${clientId}:`, error);
      }
    }
  }
);

// --- FUNÇÃO 2: ENVIA NOTIFICAÇÃO DE CONFIRMAÇÃO ---
export const sendBookingConfirmationNotification = onDocumentUpdated(
  {
    document: "bookings/{bookingId}",
    region: REGION,
  },
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
    // Agora 'event.data' tem as propriedades 'before' e 'after'
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      logger.warn("Dados do agendamento antes ou depois estão ausentes.");
      return;
    }

    if (beforeData.status !== "confirmed" && afterData.status === "confirmed") {
      logger.info(
        `Agendamento ${event.params.bookingId} confirmado. Enviando notificação.`
      );
      const { clientId, providerId, date } = afterData;

      const clientSnap = await db.collection("users").doc(clientId).get();
      const providerSnap = await db.collection("users").doc(providerId).get();
      const clientData = clientSnap.data();
      const providerData = providerSnap.data();

      if (!clientData || !providerData || !clientData.fcmTokens?.length) {
        logger.error(
          `Dados do cliente/prestador ou tokens FCM não encontrados para ${event.params.bookingId}.`
        );
        return;
      }

      const establishmentName =
        providerData.displayName || "Seu estabelecimento";
      const formattedDate = new Date(date.toDate()).toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "long" }
      );
      const formattedTime = new Date(date.toDate()).toLocaleTimeString(
        "pt-BR",
        { hour: "2-digit", minute: "2-digit" }
      );

      // CORREÇÃO: Removemos a anotação ': Message' para deixar o TypeScript inferir o tipo
      const payload = {
        notification: {
          title: "Seu agendamento foi confirmado! ✅",
          body: `${establishmentName} confirmou seu horário para ${formattedDate} às ${formattedTime}.`,
        },
        webpush: {
          notification: {
            icon:
              providerData.photoURL ||
              "https://stylo-agendamento.web.app/stylo.svg",
          },
        },
      };
      await sendNotificationAndCleanup(
        clientData.fcmTokens,
        payload,
        clientSnap.ref
      );
    }
  }
);

// --- FUNÇÃO 3: ENVIA LEMBRETES DE AGENDAMENTO ---
export const sendBookingReminders = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "America/Sao_Paulo",
    region: REGION,
  },
  async () => {
    // ... (esta função não precisava de alterações)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 75 * 60 * 1000);

    logger.log(
      `Buscando agendamentos entre ${windowStart.toISOString()} e ${windowEnd.toISOString()}`
    );
    const bookings = await db
      .collection("bookings")
      .where("status", "==", "confirmed")
      .where("date", ">=", admin.firestore.Timestamp.fromDate(windowStart))
      .where("date", "<", admin.firestore.Timestamp.fromDate(windowEnd))
      .get();

    if (bookings.empty) {
      logger.log("Nenhum agendamento para lembrar neste intervalo.");
      return;
    }

    for (const doc of bookings.docs) {
      const bookingData = doc.data();
      const { clientId, providerId, date } = bookingData;
      const clientSnap = await db.collection("users").doc(clientId).get();
      const providerSnap = await db.collection("users").doc(providerId).get();
      const clientData = clientSnap.data();
      const providerData = providerSnap.data();

      if (!clientData || !providerData || !clientData.fcmTokens?.length) {
        logger.warn(`Pulando lembrete para ${doc.id}: faltam dados ou token.`);
        continue;
      }

      const establishmentName =
        providerData.displayName || "Seu estabelecimento";
      const formattedTime = new Date(date.toDate()).toLocaleTimeString(
        "pt-BR",
        { hour: "2-digit", minute: "2-digit" }
      );

      // CORREÇÃO: Removemos a anotação ': Message'
      const payload = {
        notification: {
          title: "Lembrete de Agendamento ⏰",
          body: `Seu horário com ${establishmentName} é hoje às ${formattedTime}! Não se atrase.`,
        },
        webpush: {
          notification: {
            icon:
              providerData.photoURL ||
              "https://stylo-agendamento.web.app/stylo.svg",
          },
        },
      };
      await sendNotificationAndCleanup(
        clientData.fcmTokens,
        payload,
        clientSnap.ref
      );
    }
  }
);

// --- FUNÇÃO AUXILIAR: ENVIA NOTIFICAÇÕES E LIMPA TOKENS INVÁLIDOS ---
async function sendNotificationAndCleanup(
  tokens: string[],
  payload: admin.messaging.MessagingPayload, // Usamos um tipo mais genérico aqui
  userRef: admin.firestore.DocumentReference
) {
  try {
    const response = await messaging.sendToDevice(tokens, payload);
    logger.info(
      `Notificação enviada para ${response.successCount} de ${tokens.length} tokens.`
    );

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
      logger.info("Removendo tokens inválidos:", tokensToRemove);
      await userRef.update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
      });
    }
  } catch (error) {
    logger.error("Erro geral ao enviar notificação:", error);
  }
}

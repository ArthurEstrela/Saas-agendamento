// functions/src/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

import {
  onDocumentCreated,
  onDocumentUpdated,
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from "firebase-functions/v2/firestore";
import { format } from "date-fns";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const REGION = "southamerica-east1";

const formatDate = (timestamp: { toDate: () => any; }) => {
  if (!timestamp) return "data não informada";
  const date = timestamp.toDate();
  const formattedDate = format(date, "dd/MM/yyyy");
  const formattedTime = format(date, "HH:mm");
  return { formattedDate, formattedTime };
};

const createNotificationDocument = async (
  userId: string,
  title: string,
  message: string
) => {
  if (!userId) {
    logger.warn("Tentativa de criar notificação para um ID de usuário vazio.");
    return;
  }
  try {
    const notificationsCol = db.collection("users").doc(userId).collection("notifications");
    await notificationsCol.add({
      userId,
      title,
      message,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(`Documento de notificação criado para o usuário: ${userId}`);
  } catch (error) {
    logger.error(`Erro ao criar documento de notificação para ${userId}:`, error);
  }
};

const sendNotification = async (
  recipientId: string,
  title: string,
  body: string
) => {
  const userRef = admin.firestore().collection("users").doc(recipientId);
  const userDoc = await userRef.get();
  const fcmToken = userDoc.data()?.fcmToken;

  if (fcmToken) {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: fcmToken,
    };
    try {
      await admin.messaging().send(message);
      logger.info("Notificação enviada com sucesso", { recipientId });
    } catch (error) {
      logger.error("Erro ao enviar notificação", { error });
    }
  } else {
    logger.warn("Token FCM não encontrado para o usuário", { recipientId });
  }
};
export const onAppointmentCreate = onDocumentCreated(
  {
    document: "appointments/{appointmentId}",
    region: REGION,
  },
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const appointmentData = event.data?.data();

    if (!appointmentData) return;

    const { serviceProviderId, clientName, serviceName, startTime } = appointmentData;
    const { formattedDate, formattedTime } = formatDate(startTime);

    const safeClientName = clientName || "Cliente";
    const safeServiceName = serviceName || "Serviço";

    if (serviceProviderId) {
      const notificationTitle = "Novo Agendamento!";
      const notificationBody = `${safeClientName} agendou "${safeServiceName}" para ${formattedDate} às ${formattedTime}.`;

      logger.info(
        `Enviando notificação para o prestador: ${serviceProviderId}`
      );
      await sendNotification(
        serviceProviderId,
        notificationTitle,
        notificationBody
      );
    }
  }
);

export const onAppointmentUpdate = onDocumentUpdated(
  {
    document: "appointments/{appointmentId}",
    region: REGION,
  },
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData || beforeData.status === afterData.status) {
      return;
    }

    const {
      clientId,
      serviceName,
      startTime,
    } = afterData;

    const getFormattedDateTime = (timestamp: any) => {
      try {
        if (timestamp && typeof timestamp.toDate === 'function') {
          const dateObj = timestamp.toDate();
          const formattedDate = format(dateObj, "dd/MM/yyyy");
          const formattedTime = format(dateObj, "HH:mm");
          return { formattedDate, formattedTime };
        }
      } catch (e) {
        logger.error("Erro ao converter Timestamp para Date", e);
      }
      return { formattedDate: "data", formattedTime: "hora" };
    };

    const { formattedDate, formattedTime } = getFormattedDateTime(startTime);

    let notificationTitle = "";
    let notificationBody = "";

    if (afterData.status === "confirmed") {
      notificationTitle = "Agendamento Confirmado!";
      notificationBody = `Seu agendamento para "${serviceName}" em ${formattedDate} às ${formattedTime} foi confirmado.`;
    } else if (afterData.status === "cancelled") {
      if (
        beforeData.status === "pending" ||
        beforeData.status === "confirmed"
      ) {
        notificationTitle = "Agendamento Recusado";
        notificationBody = `Infelizmente, seu agendamento para "${serviceName}" em ${formattedDate} não pôde ser confirmado.`;
      }
    }

    if (notificationTitle && clientId) {
      logger.info(`Enviando notificação de status para o cliente: ${clientId}`);
      await sendNotification(clientId, notificationTitle, notificationBody);
    }
  }
);

export const onUserCreate = onDocumentCreated(
  {
    document: "users/{userId}",
    region: REGION,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No data associated with the user creation event");
      return;
    }
    const userId = event.params.userId;

    const defaultFields = {
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userRef = db.collection("users").doc(userId);
    await userRef.update(defaultFields);

    logger.log(`User profile for ${userId} initialized.`);
  }
);

export const createStripeCheckout = onCall(
  { region: REGION },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Você precisa estar autenticado."
      );
    }

    const { priceId, successUrl, cancelUrl } = request.data;
    if (!priceId || !successUrl || !cancelUrl) {
      throw new HttpsError(
        "invalid-argument",
        "Dados da requisição incompletos."
      );
    }

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-08-27.basil",
    });

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: request.auth.token.email,
      });

      return { sessionId: session.id };
    } catch (error) {
      logger.error("Erro ao criar sessão de checkout do Stripe:", error);
      throw new HttpsError(
        "internal",
        "Não foi possível criar a sessão de checkout."
      );
    }
  }
);

export const onappointmentcompleted = onDocumentUpdated(
  {
    document: "appointments/{appointmentId}",
    region: REGION,
  },
  async (event) => {
    if (!event.data) {
      logger.info("Nenhum dado associado ao evento. Saindo.");
      return;
    }

    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    const appointmentId = event.params.appointmentId;

    if (newData.status !== "completed" || oldData.status === "completed") {
      logger.log(
        `Agendamento ${appointmentId} não foi concluído nesta atualização. Saindo.`
      );
      return;
    }

    const transactionRef = db
      .collection("transactions")
      .where("appointmentId", "==", appointmentId);
    const snapshot = await transactionRef.get();
    if (!snapshot.empty) {
      logger.log(
        `Transação para o agendamento ${appointmentId} já existe. Saindo.`
      );
      return;
    }

    const {
      providerId,
      clientId,
      clientName,
      serviceName,
      finalPrice,
      professionalName,
    } = newData;

    if (!providerId || !finalPrice) {
      logger.error(`Dados ausentes no agendamento ${appointmentId}.`, newData);
      return;
    }

    const transactionData = {
      providerId,
      appointmentId,
      clientId: clientId || "N/A",
      clientName: clientName || "N/A",
      serviceName: serviceName || "Serviço não informado",
      amount: finalPrice,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      professionalName: professionalName || "N/A",
    };

    try {
      await db.collection("transactions").add(transactionData);
      logger.log(
        `Transação criada com sucesso para o agendamento ${appointmentId}`
      );
    } catch (error) {
      logger.error(
        `Erro ao criar transação para o agendamento ${appointmentId}:`,
        error
      );
    }
  }
);
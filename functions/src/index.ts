/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

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

// Inicialização do Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging(); // <--- INICIALIZAR O MESSAGING

const REGION = "southamerica-east1";

// Função auxiliar para enviar notificações
const sendNotification = async (userId: string, title: string, body: string) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    // Verifica se o usuário existe e tem um fcmToken
    if (userData && userData.fcmToken) {
      const message = {
        notification: { title, body },
        token: userData.fcmToken,
      };
      await messaging.send(message);
      logger.info(`Notificação enviada com sucesso para ${userId}`);
    } else {
      logger.warn(`Usuário ${userId} não encontrado ou não possui fcmToken.`);
    }
  } catch (error) {
    logger.error(`Erro ao enviar notificação para ${userId}:`, error);
  }
};


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onCall((request) => {
  logger.info("Hello logs!", { structuredData: true });
  return { message: "Hello from Firebase!", data: request.data };
});

export const onBookingCreate = onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    region: REGION,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No data associated with the event");
      return;
    }
    const bookingData = snapshot.data();
    const bookingId = event.params.bookingId; // Obter o ID do documento

    const { providerId, clientId, clientName, serviceName, date, time } = bookingData;

    // Adicionar o ID do documento aos dados do agendamento
    const bookingDataWithId = { ...bookingData, id: bookingId };

    // Atualizar o perfil do prestador de serviço
    if (providerId) {
      const providerRef = db.collection("users").doc(providerId);
      await providerRef.update({
        bookings: admin.firestore.FieldValue.arrayUnion(bookingDataWithId),
      });
      logger.log(`Booking ${bookingId} added to provider ${providerId}`);
      
      // --- LÓGICA DE NOTIFICAÇÃO ---
      const notificationTitle = "Novo Agendamento!";
      const notificationBody = `${clientName} agendou ${serviceName} para ${date} às ${time}.`;
      await sendNotification(providerId, notificationTitle, notificationBody);
    }

    // Atualizar o perfil do cliente
    if (clientId) {
      const clientRef = db.collection("users").doc(clientId);
      await clientRef.update({
        myAppointments:
          admin.firestore.FieldValue.arrayUnion(bookingDataWithId),
      });
      logger.log(`Booking ${bookingId} added to client ${clientId}`);
    }
  }
);

// --- ATUALIZA PERFIS QUANDO UM AGENDAMENTO MUDA ---
export const onBookingUpdate = onDocumentUpdated(
  {
    document: "bookings/{bookingId}",
    region: REGION,
  },
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      logger.warn(
        `Dados de agendamento ausentes no evento de atualização para ${event.params.bookingId}.`
      );
      return;
    }

    // Se não houve mudança relevante, não faz nada.
    if (beforeData.status === afterData.status) {
      logger.info(
        `Status do agendamento ${event.params.bookingId} não mudou. Nenhuma ação necessária.`
      );
      return;
    }

    const { providerId, clientId, clientName, serviceName, date, time } = afterData;

    // --- LÓGICA DE NOTIFICAÇÃO DE CANCELAMENTO ---
    if (afterData.status === "cancelled") {
        const notificationTitle = "Agendamento Cancelado";
        const notificationBody = `O agendamento de ${clientName} para ${serviceName} em ${date} às ${time} foi cancelado.`;
        await sendNotification(providerId, notificationTitle, notificationBody);
    }

    // --- Atualiza o perfil do prestador ---
    if (providerId) {
      const providerRef = db.collection("users").doc(providerId);
      const providerSnap = await providerRef.get();
      if (providerSnap.exists) {
        const providerData = providerSnap.data();
        const existingBookings = providerData?.bookings || [];

        const updatedBookings = existingBookings.map((booking: any) => {
          if (booking.id === event.params.bookingId) {
            return { ...booking, ...afterData };
          }
          return booking;
        });

        await providerRef.update({ bookings: updatedBookings });
        logger.info(
          `Perfil do prestador ${providerId} atualizado para o agendamento ${event.params.bookingId}.`
        );
      }
    }

    // --- Atualiza o perfil do cliente ---
    if (clientId) {
      const clientRef = db.collection("users").doc(clientId);
      const clientSnap = await clientRef.get();
      if (clientSnap.exists) {
        const clientData = clientSnap.data();
        const existingAppointments = clientData?.myAppointments || [];

        const updatedAppointments = existingAppointments.map(
          (appointment: any) => {
            if (appointment.id === event.params.bookingId) {
              return { ...appointment, ...afterData };
            }
            return appointment;
          }
        );

        await clientRef.update({ myAppointments: updatedAppointments });
        logger.info(
          `Perfil do cliente ${clientId} atualizado para o agendamento ${event.params.bookingId}.`
        );
      }
    }
  }
);

// Adicione aqui suas outras funções, como a de criação de usuário, se tiver.
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

    // Exemplo: Definir campos padrão no perfil do usuário
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

    // Lazy load do Stripe para não carregar em todas as functions
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      // CORREÇÃO: Atualizado para a versão que a biblioteca espera.
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

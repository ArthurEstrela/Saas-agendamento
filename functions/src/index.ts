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
const messaging = admin.messaging();

const REGION = "southamerica-east1";

// Função auxiliar para enviar notificações (sem alterações)
const sendNotification = async (userId: string, title: string, body: string) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

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

// --- FUNÇÃO ACIONADA QUANDO UM NOVO AGENDAMENTO É CRIADO ---
export const onAppointmentCreate = onDocumentCreated(
  {
    // 1. CORREÇÃO: Escutando a coleção correta
    document: "appointments/{appointmentId}",
    region: REGION,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No data associated with the event");
      return;
    }
    const appointmentData = snapshot.data();

    // 2. CORREÇÃO: Usando os nomes de campos da interface Appointment
    const {
      serviceProviderId,
      clientName,
      serviceName,
      date,
      startTime,
    } = appointmentData;

    // A principal responsabilidade é notificar o prestador de serviço
    if (serviceProviderId) {
      const notificationTitle = "Novo Agendamento!";
      const notificationBody = `${clientName} agendou "${serviceName}" para ${date} às ${startTime}.`;
      
      logger.info(`Enviando notificação para o prestador: ${serviceProviderId}`);
      await sendNotification(serviceProviderId, notificationTitle, notificationBody);
    }
  }
);

// --- FUNÇÃO ACIONADA QUANDO UM AGENDAMENTO É ATUALIZADO (EX: CANCELADO) ---
export const onAppointmentUpdate = onDocumentUpdated(
  {
    // 3. CORREÇÃO: Escutando a coleção correta
    document: "appointments/{appointmentId}",
    region: REGION,
  },
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      logger.warn(`Dados ausentes no evento de atualização para ${event.params.appointmentId}.`);
      return;
    }

    // Só faz algo se o status do agendamento mudou
    if (beforeData.status === afterData.status) {
      return;
    }

    // 4. CORREÇÃO: Usando os nomes de campos da interface Appointment
    const {
      serviceProviderId,
      clientName,
      serviceName,
      date,
      startTime,
    } = afterData;

    // Envia notificação de cancelamento para o prestador de serviço
    if (afterData.status === "cancelled") {
      const notificationTitle = "Agendamento Cancelado";
      const notificationBody = `O agendamento de ${clientName} ("${serviceName}") em ${date} às ${startTime} foi cancelado.`;
      
      logger.info(`Enviando notificação de cancelamento para: ${serviceProviderId}`);
      await sendNotification(serviceProviderId, notificationTitle, notificationBody);
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

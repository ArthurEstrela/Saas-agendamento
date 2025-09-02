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
const sendNotification = async (
  userId: string,
  title: string,
  body: string
) => {
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
    const { serviceProviderId, clientName, serviceName, date, startTime } =
      appointmentData;

    // A principal responsabilidade é notificar o prestador de serviço
    if (serviceProviderId) {
      const notificationTitle = "Novo Agendamento!";
      const notificationBody = `${clientName} agendou "${serviceName}" para ${date} às ${startTime}.`;

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

// --- FUNÇÃO ACIONADA QUANDO UM AGENDAMENTO É ATUALIZADO (EX: CANCELADO) ---
export const onAppointmentUpdate = onDocumentUpdated(
  {
    document: "appointments/{appointmentId}",
    region: REGION,
  },
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData || beforeData.status === afterData.status) {
      return; // Sai se não houver dados ou se o status não mudou
    }

    const {
      clientId, // ID do cliente para enviar a notificação
      serviceName,
      date,
      startTime,
    } = afterData;

    let notificationTitle = "";
    let notificationBody = "";

    // Lógica para notificar o CLIENTE
    if (afterData.status === "confirmed") {
      notificationTitle = "Agendamento Confirmado!";
      notificationBody = `Seu agendamento para "${serviceName}" em ${date} às ${startTime} foi confirmado.`;
    } else if (afterData.status === "cancelled") {
      // Verifica se foi o prestador que cancelou (antes era 'pending' ou 'confirmed')
      if (
        beforeData.status === "pending" ||
        beforeData.status === "confirmed"
      ) {
        notificationTitle = "Agendamento Recusado";
        notificationBody = `Infelizmente, seu agendamento para "${serviceName}" em ${date} não pôde ser confirmado.`;
      }
    }

    // Se houver um título, envia a notificação para o cliente
    if (notificationTitle && clientId) {
      logger.info(`Enviando notificação de status para o cliente: ${clientId}`);
      await sendNotification(clientId, notificationTitle, notificationBody);
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

export const onappointmentcompleted = onDocumentUpdated(
  {
    document: "appointments/{appointmentId}",
    region: REGION,
  },
  async (event) => {
    // O evento contém todos os dados
    if (!event.data) {
      logger.info("Nenhum dado associado ao evento. Saindo.");
      return;
    }

    // Acessando os dados de antes e depois
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    // Acessando os parâmetros da URL
    const appointmentId = event.params.appointmentId;

    // Condição: Executar apenas se o status mudou para 'completed'
    if (newData.status !== "completed" || oldData.status === "completed") {
      logger.log(
        `Agendamento ${appointmentId} não foi concluído nesta atualização. Saindo.`
      );
      return;
    }

    // Prevenir a criação de transações duplicadas
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
      serviceProviderId,
      clientId,
      clientName,
      serviceName,
      servicePrice,
      professionalName,
    } = newData;

    if (!serviceProviderId || !servicePrice) {
      logger.error(`Dados ausentes no agendamento ${appointmentId}.`, newData);
      return;
    }

    const transactionData = {
      serviceProviderId,
      appointmentId,
      clientId: clientId || "N/A",
      clientName: clientName || "N/A",
      serviceName: serviceName || "Serviço não informado",
      amount: servicePrice,
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

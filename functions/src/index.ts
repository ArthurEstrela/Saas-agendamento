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

import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURAÇÕES GLOBAIS ---
const REGION = "southamerica-east1"; // Região onde suas functions irão rodar
const TIME_ZONE = "America/Sao_Paulo"; // Fuso horário para as funções agendadas

const PLANOS_PERMITIDOS = {
  MENSAL: "price_1SMeWT3zDQy3p6yeWl0LC4wi",
  TRIMESTRAL: "price_1SMeWT3zDQy3p6yezkMmrByP",
  ANUAL: "price_1SO7sB3zDQy3p6yevNXLXO8v",
};

const YOUR_APP_URL = "http://localhost:5173"; // Altere para a URL do seu app


let stripeInstance: Stripe;

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    // !! ESTA É A VERSÃO CORRETA !!
    // Ela usa process.env, que é o correto para v2
    const stripeSecret = process.env.STRIPE_API_SECRET; 
    
    if (!stripeSecret) {
      throw new Error("Stripe secret key is not configured in .env file (STRIPE_API_SECRET).");
    }
    
    stripeInstance = new Stripe(stripeSecret, {
      apiVersion: "2025-08-27.basil", // A versão que seu TS pediu
    });
  }
  return stripeInstance;
};
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
  await createFirestoreNotification(recipientId, title, body);
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
    const title = "Nova Solicitação de Agendamento";
    const body = `${clientName || "Um cliente"} quer agendar "${
      serviceName || "um serviço"
    }" para ${formattedDate} às ${formattedTime}.`;

    // A notificação agora é criada pela sendPushNotification
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

    const { formattedDate, formattedTime } = formatDate(afterData.startTime);

    // 1. Notificação para o CLIENTE (Confirmado / Recusado pelo Prestador)
    if (
      beforeData.status === "requested" &&
      (afterData.status === "scheduled" || afterData.status === "cancelled")
    ) {
      const { clientId, serviceName } = afterData;
      if (clientId) {
        const isConfirmed = afterData.status === "scheduled";
        const title = isConfirmed
          ? "Agendamento Confirmado!"
          : "Agendamento Recusado";
        const body = `Seu agendamento para "${
          serviceName || "o serviço"
        }" em ${formattedDate} às ${formattedTime} foi ${
          isConfirmed ? "confirmado" : "recusado"
        }.`;
        await sendPushNotification(clientId, title, body);
      } else {
        logger.warn(
          `Agendamento ${appointmentId} ${afterData.status} sem clientId para notificar.`
        );
      }
    }

    // 2. Notificação para o PRESTADOR (Cancelado pelo Cliente)
    if (beforeData.status === "scheduled" && afterData.status === "cancelled") {
      const { professionalId, serviceName, clientName } = afterData;
      if (professionalId) {
        const title = "Agendamento Cancelado";
        const body = `${
          clientName || "Cliente"
        } cancelou o agendamento de "${
          serviceName || "serviço"
        }" de ${formattedDate} às ${formattedTime}.`;
        await sendPushNotification(professionalId, title, body);
      } else {
        logger.warn(
          `Agendamento ${appointmentId} cancelado pelo cliente, mas sem professionalId para notificar.`
        );
      }
    }

    // 3. !! LÓGICA DE TRANSAÇÃO REMOVIDA !!
    // A lógica 'if (afterData.status === "completed")' foi removida.
    // Ela agora está na callable function 'completeAppointment'.
    // Isso impede que um cliente mal-intencionado mude o status para
    // 'completed' e crie uma transação financeira indevidamente.
  }
);

export const completeAppointment = onCall(
  { region: REGION, cors: ["http://localhost:5173"] }, 
  async (request) => {
    // 1. Validação de Autenticação
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Você precisa estar autenticado."
      );
    }

    const { appointmentId, finalPrice } = request.data;
    const uid = request.auth.uid;

    // 2. Validação de Inputs
    if (!appointmentId || typeof finalPrice === "undefined" || finalPrice < 0) {
      throw new HttpsError(
        "invalid-argument",
        "Dados inválidos (appointmentId ou finalPrice)."
      );
    }

    const appointmentRef = db.collection("appointments").doc(appointmentId);

    try {
      // Usamos uma transação para garantir que a conclusão e a
      // criação da transação financeira sejam atômicas.
      await db.runTransaction(async (transaction) => {
        const appointmentDoc = await transaction.get(appointmentRef);

        // 3. Validação de Existência
        if (!appointmentDoc.exists) {
          throw new HttpsError("not-found", "Agendamento não encontrado.");
        }

        const appointmentData = appointmentDoc.data()!;

        // 4. Validação de Permissão (CRUCIAL)
        // O UID do usuário autenticado DEVE ser o mesmo do professionalId
        // associado ao agendamento.
        if (appointmentData.professionalId !== uid) {
          logger.error(
            `Falha de permissão: Usuário ${uid} tentou completar agendamento ${appointmentId} que pertence a ${appointmentData.professionalId}.`
          );
          throw new HttpsError(
            "permission-denied",
            "Você não tem permissão para concluir este agendamento."
          );
        }

        // 5. Validação de Status
        // Só podemos completar um agendamento que está 'scheduled'.
        if (appointmentData.status !== "scheduled") {
          logger.warn(
            `Tentativa de completar agendamento ${appointmentId} que não estava 'scheduled' (status atual: ${appointmentData.status}).`
          );
          // Pode ser que o usuário clicou duas vezes. Se já estiver 'completed', não é um erro.
          if (appointmentData.status === "completed") {
            return; // Já foi concluído, encerra a operação sem erro.
          }
          throw new HttpsError(
            "failed-precondition",
            "Este agendamento não pode ser concluído (status atual: " +
              appointmentData.status +
              ")."
          );
        }

        // 6. Lógica de Negócio (Movida do onAppointmentUpdate)
        // 6a. Criar a Transação Financeira
        const transRef = db
          .collection("transactions")
          .where("appointmentId", "==", appointmentId);
        const transSnapshot = await transaction.get(transRef);

        if (!transSnapshot.empty) {
          logger.log(
            `Transação para agendamento ${appointmentId} já existe. Ignorando.`
          );
        } else {
          const {
            clientId,
            clientName,
            serviceName,
            professionalName,
            professionalId,
          } = appointmentData;
          const newTransRef = db.collection("transactions").doc();
          transaction.set(newTransRef, {
            providerId: professionalId, // professionalId é o dono do negócio
            appointmentId,
            clientId: clientId || "N/A",
            clientName: clientName || "N/A",
            serviceName: serviceName || "Serviço não informado",
            amount: finalPrice, // Usa o preço final validado
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            professionalName: professionalName || "N/A",
          });
        }

        // 6b. Atualizar o Agendamento
        transaction.update(appointmentRef, {
          status: "completed",
          finalPrice: finalPrice,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      logger.log(
        `Agendamento ${appointmentId} concluído com sucesso por ${uid}. Preço: R$${finalPrice}`
      );
      return { success: true, appointmentId };
    } catch (error) {
      logger.error(
        `Erro ao concluir agendamento ${appointmentId} por ${uid}:`,
        error
      );
      if (error instanceof HttpsError) {
        throw error; // Re-lança erros Https (permissão, não encontrado, etc)
      }
      throw new HttpsError(
        "internal",
        "Ocorreu um erro interno ao concluir o agendamento."
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
    logger.info("Executando envio de lembretes de agendamento.");

    const tomorrowStart = startOfTomorrow();
    const tomorrowEnd = endOfTomorrow();

    const appointmentsRef = db.collection("appointments");
    const q = appointmentsRef
      .where("status", "==", "scheduled") // Alterado para 'scheduled'
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
    logger.info(`${remindersSent.length} lembretes de agendamento enviados.`);
  }
);

// --- FUNÇÕES CHAMÁVEIS (CALLABLE FUNCTIONS) ---

/**
 * Cria uma sessão de checkout do Stripe para pagamentos de assinatura.
 */
export const createStripeCheckout = onCall(
  // Especificando os segredos que esta função v2 precisa
  { region: REGION, cors: ["http://localhost:5173"], secrets: ["STRIPE_API_SECRET"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Você precisa estar autenticado."
      );
    }

    // 1. Recebemos o priceId do frontend
    const { priceId } = request.data;

    // 2. Validação de segurança: Verificamos se o priceId enviado
    // é um dos IDs que permitimos no backend.
    if (
      !priceId ||
      !Object.values(PLANOS_PERMITIDOS).includes(priceId as string)
    ) {
      logger.error("Tentativa de checkout com priceId inválido:", priceId);
      throw new HttpsError(
        "invalid-argument",
        "O ID do plano fornecido é inválido ou não existe."
      );
    }

    const uid = request.auth.uid;
    const userDocRef = db.collection("users").doc(uid);

    try {
      const stripe = getStripe(); // Pega a instância que usa process.env
      const userDoc = await userDocRef.get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError("not-found", "Usuário não encontrado.");
      }

      // 3. LÓGICA PARA ENCONTRAR OU CRIAR O CLIENTE STRIPE (stripeCustomerId)
      // Isso é essencial para o usuário gerenciar a assinatura depois
      let stripeCustomerId = userData.stripeCustomerId;
      if (!stripeCustomerId) {
        logger.info(`Criando novo cliente Stripe para o usuário ${uid}`);
        const customer = await stripe.customers.create({
          email: userData.email,
          name: userData.name,
          metadata: { firebaseUID: uid },
        });
        stripeCustomerId = customer.id;
        // Salva o ID no perfil do usuário no Firestore
        await userDocRef.update({ stripeCustomerId: stripeCustomerId });
      }

      // 4. CRIA A SESSÃO DE CHECKOUT
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "boleto"],
        mode: "subscription",
        customer: stripeCustomerId, // Associa ao cliente
        line_items: [{ price: priceId, quantity: 1 }], // Usa o priceId do frontend
        allow_promotion_codes: true,
        success_url: `${YOUR_APP_URL}/dashboard?checkout=success`, // Redireciona
        cancel_url: `${YOUR_APP_URL}/dashboard`, // Volta para o dashboard
        client_reference_id: uid, // Importante para o webhook
      });

      if (!session.url) {
        throw new HttpsError(
          "internal",
          "Não foi possível criar a sessão do Stripe."
        );
      }

      // 5. Retorna a URL para o frontend (como o subscriptionService.ts espera)
      return { url: session.url };
    } catch (error) {
      logger.error("Erro ao criar checkout do Stripe:", error);
      if (error instanceof Stripe.errors.StripeError) {
        throw new HttpsError("internal", error.message);
      }
      throw new HttpsError("internal", "Ocorreu um erro inesperado.");
    }
  }
);

export const createStripeCustomerPortal = onCall(
  { region: REGION, cors: ["http://localhost:5173"], secrets: ["STRIPE_API_SECRET"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Você precisa estar autenticado."
      );
    }

    const uid = request.auth.uid;

    try {
      const userDoc = await db.collection("users").doc(uid).get();
      const stripeCustomerId = userDoc.data()?.stripeCustomerId;

      if (!stripeCustomerId) {
        logger.error(`Usuário ${uid} tentou acessar portal sem stripeCustomerId.`);
        throw new HttpsError(
          "not-found",
          "ID de cliente Stripe não encontrado."
        );
      }

      const stripe = getStripe();
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${YOUR_APP_URL}/dashboard`, // Para onde ele volta
      });

      // Retorna a URL para o frontend
      return { url: portalSession.url };
    } catch (error) {
      logger.error("Erro ao criar portal do cliente:", error);
      throw new HttpsError(
        "internal",
        "Não foi possível acessar o portal do cliente."
      );
    }
  }
);

/**
 * Cria uma notificação no Firestore para o usuário.
 * @param recipientId O ID do usuário.
 * @param title O título da notificação.
 * @param message A mensagem da notificação.
 */
const createFirestoreNotification = async (
  recipientId: string,
  title: string,
  message: string
) => {
  if (!recipientId) {
    logger.warn("Tentativa de criar notificação para um ID de usuário vazio.");
    return;
  }
  try {
    await db.collection("notifications").add({
      userId: recipientId,
      title,
      message,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      link: "/dashboard", // Link padrão para a dashboard
    });
    logger.info(
      `Notificação do Firestore criada para ${recipientId}: "${title}"`
    );
  } catch (error) {
    logger.error(
      `Erro ao criar notificação no Firestore para ${recipientId}:`,
      error
    );
  }
};


export const stripeWebhook = onRequest(
  { region: REGION, cors: ["http://localhost:5173"], secrets: ["STRIPE_API_SECRET", "STRIPE_WEBHOOK_KEY"] }, 
  async (request, response) => {
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_KEY; 
    
    if (!webhookSecret) {
      logger.error("Stripe webhook secret is not configured in .env file (STRIPE_WEBHOOK_KEY).");
      response.status(400).send("Webhook Error: Missing secret");
      return;
    }

    const sig = request.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      const stripe = getStripe(); // Pega a instância que usa process.env
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      logger.error("Erro na verificação do webhook:", err);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Lida com os eventos
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id;
          const subscriptionId = session.subscription;
          // !! MUDANÇA IMPORTANTE: Captura o customerId !!
          const stripeCustomerId = session.customer;

          if (!userId || !subscriptionId || !stripeCustomerId) {
            logger.error(
              "checkout.session.completed sem userId, subscriptionId ou customerId",
              session
            );
            break;
          }

          const userRef = db.collection("users").doc(userId);
          await userRef.update({
            subscriptionStatus: "active",
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: stripeCustomerId, // !! SALVA O ID DO CLIENTE !!
          });

          logger.info(`Usuário ${userId} iniciou assinatura ${subscriptionId}`);
          break;
        }
        
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          
          if (!invoice.lines || !invoice.lines.data || invoice.lines.data.length === 0) {
            logger.info("Fatura sem 'line items', ignorando.", invoice);
            break;
          }
          
          const subscriptionId = invoice.lines.data[0].subscription;

          if (!subscriptionId) {
            logger.info("invoice.payment_succeeded sem ID de assinatura (pagamento avulso).", invoice);
            break;
          }

          const userQuery = await db
            .collection("users")
            .where("stripeSubscriptionId", "==", subscriptionId)
            .limit(1)
            .get();

          if (!userQuery.empty) {
            const userId = userQuery.docs[0].id;
            await db.collection("users").doc(userId).update({
              subscriptionStatus: "active",
            });
            logger.info(`Renovação de assinatura paga para ${userId}`);
          }
          break;
        }

        case "invoice.payment_failed":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const userQuery = await db
            .collection("users")
            .where("stripeSubscriptionId", "==", subscription.id)
            .limit(1)
            .get();

          if (!userQuery.empty) {
            const userId = userQuery.docs[0].id;
            await db.collection("users").doc(userId).update({
              subscriptionStatus: "cancelled",
            });
            logger.warn(`Assinatura com falha ou cancelada para ${userId}`);
          }
          break;
        }
      }
    } catch (error) {
      logger.error("Erro ao processar evento do webhook:", error);
      response.status(500).send("Erro interno ao processar webhook.");
      return;
    }

    response.status(200).send({ received: true });
  }
);

export const createProfessionalUser = onCall(
 { region: REGION, cors: ["http://localhost:5173"] }, 
  async (request) => {
    // 1. Validação de Autenticação (Quem está a chamar?)
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Você precisa estar autenticado."
      );
    }

    const { name, email, password, serviceIds } = request.data;
    const providerId = request.auth.uid; // O "Dono" que está a criar

    // 2. Validação de Inputs
    if (!name || !email || !password || !serviceIds) {
      throw new HttpsError(
        "invalid-argument",
        "Dados incompletos para criar profissional."
      );
    }

    let providerDoc;
    try {
      providerDoc = await db.collection("users").doc(providerId).get();
      // 3. Validação de Role (O chamador é um Dono?)
      if (providerDoc.data()?.role !== "serviceProvider") {
        throw new HttpsError(
          "permission-denied",
          "Você não tem permissão para criar profissionais."
        );
      }
    } catch (error) {
      logger.error("Erro ao validar 'Dono':", error);
      throw new HttpsError("internal", "Erro ao validar permissões.");
    }

    // --- Lógica de Criação em 3 Passos ---

    let userRecord;
    let newProfessionalRef;

    try {
      // Passo 1: Criar o Utilizador no Firebase Auth
      userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: false, // Pode definir como 'true' se quiser
      });

      // Passo 2: Criar o Recurso Profissional
      // (Buscamos os serviços completos do Dono para embutir)
      const providerData = providerDoc.data();
      const allServices = providerData?.services || [];
      const selectedServices = allServices.filter((s: { id: string }) =>
        serviceIds.includes(s.id)
      );
      
      // O seu 'professionalsManagementService.ts' aponta para esta coleção
      newProfessionalRef = db
        .collection("serviceProviders")
        .doc(providerId)
        .collection("professionals")
        .doc(); // Cria um ID automático

      await newProfessionalRef.set({
        id: newProfessionalRef.id,
        name: name,
        services: selectedServices,
        availability: [], // Disponibilidade padrão (vazia)
        // photoURL será atualizado depois pelo frontend se houver foto
      });

      // Passo 3: Criar o Perfil de Utilizador (para login)
      await db.collection("users").doc(userRecord.uid).set({
        id: userRecord.uid,
        name: name,
        email: email,
        role: "professional", // <-- O NOVO ROLE
        serviceProviderId: providerId, // Link para o "Dono"
        professionalId: newProfessionalRef.id, // Link para o "Recurso"
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Novo profissional ${userRecord.uid} criado por ${providerId}.`);
      return { success: true, professionalId: newProfessionalRef.id, uid: userRecord.uid };

    } catch (error: any) {
      logger.error("Erro ao criar profissional:", error);
      
      // Rollback: Se a criação do utilizador no Auth funcionou mas o Firestore falhou,
      // devemos deletar o utilizador do Auth para evitar órfãos.
      if (userRecord) {
        await admin.auth().deleteUser(userRecord.uid);
        logger.warn(`Rollback: Utilizador Auth ${userRecord.uid} deletado.`);
      }
      
      if (error.code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "Este e-mail já está em uso.");
      }
      throw new HttpsError("internal", "Ocorreu um erro ao criar o profissional.");
    }
  }
);
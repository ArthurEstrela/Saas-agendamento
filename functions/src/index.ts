// functions/src/index.ts
import * as admin from "firebase-admin";
import { SitemapStream, streamToPromise } from "sitemap";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { formatInTimeZone } from "date-fns-tz";
import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";
import { Resend } from "resend";
import * as React from "react";
import { StyloNotification } from "./emails/StyloNotification";
import { setGlobalOptions } from "firebase-functions/v2";

// Limita o uso de recursos para evitar sustos na fatura
setGlobalOptions({
  maxInstances: 10, // No máximo 10 servidores simultâneos (evita ataque DDoS ou bug de loop)
  memory: "256MiB", // O padrão é 512MB ou mais. 256MB é suficiente para suas funções leves.
  timeoutSeconds: 60, // Se travar, mata em 60s (padrão é maior)
  region: "southamerica-east1", // Mantém sua região
});

admin.initializeApp();
const db = admin.firestore();

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// --- CONFIGURAÇÕES GLOBAIS ---
const REGION = "southamerica-east1";
const TIME_ZONE = "America/Sao_Paulo";

const PLANOS_PERMITIDOS = {
  MENSAL: "price_1SqnYS3zDQy3p6yeBktBjaKY",
  TRIMESTRAL: "price_1SqnZd3zDQy3p6yeEnKfODmW",
  ANUAL: "price_1SqnaO3zDQy3p6yefwnogUrm",
};

const YOUR_APP_URL = "https://stylo.app.br"; // Altere para a URL de produção quando lançar

export const generateSitemap = onRequest(
  { region: REGION },
  async (req, res) => {
    try {
      const smStream = new SitemapStream({
        hostname: "https://stylo.app.br", // ⚠️ Troque pelo domínio real do Stylo
      });

      // 1. Adicione as páginas estáticas principais
      smStream.write({ url: "/", changefreq: "daily", priority: 1.0 });
      smStream.write({ url: "/login", changefreq: "monthly", priority: 0.5 });

      // 2. Busque todos os profissionais no Firestore
      const snapshot = await admin
        .firestore()
        .collection("users")
        .where("role", "==", "serviceProvider") // Filtra apenas prestadores
        .get();

      // 3. Adicione o link de cada perfil público ao sitemap
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.publicProfileSlug) {
          smStream.write({
            url: `/schedule/${data.publicProfileSlug}`, // ✨ ALTERADO DE /p/ PARA /schedule/
            changefreq: "weekly",
            priority: 0.8,
          });
        }
      });
      smStream.end();

      const sitemapOutput = await streamToPromise(smStream);

      // Configura o cabeçalho para XML e envia
      res.header("Content-Type", "application/xml");
      res.send(sitemapOutput);
    } catch (error) {
      console.error("Erro ao gerar sitemap:", error);
      res.status(500).send("Erro interno");
    }
  },
);

let stripeInstance: Stripe;

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const stripeSecret = process.env.STRIPE_API_SECRET;
    if (!stripeSecret) {
      throw new Error(
        "Stripe secret key is not configured in .env file (STRIPE_API_SECRET).",
      );
    }
    stripeInstance = new Stripe(stripeSecret, {
      apiVersion: "2025-08-27.basil",
    });
  }
  return stripeInstance;
};

// --- FUNÇÕES AUXILIARES ---

const formatDate = (timestamp: admin.firestore.Timestamp) => {
  if (!timestamp)
    return { formattedDate: "data indefinida", formattedTime: "" };
  const date = timestamp.toDate();
  const formattedDate = formatInTimeZone(date, TIME_ZONE, "dd/MM/yyyy");
  const formattedTime = formatInTimeZone(date, TIME_ZONE, "HH:mm");
  return { formattedDate, formattedTime };
};

/**
 * CENTRAL DE NOTIFICAÇÕES UNIFICADA
 * Envia Push + E-mail + Notificação no App de forma robusta.
 */
const sendNotification = async (
  recipientId: string,
  title: string,
  body: string,
  options?: { skipEmail?: boolean; customLink?: string }, // <--- Adicionado customLink
) => {
  if (!recipientId) return;

  const resendApiKey = process.env.RESEND_API_KEY;
  const resend = resendApiKey ? new Resend(resendApiKey) : null;

  try {
    const userRef = db.collection("users").doc(recipientId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      logger.warn(`Usuário ${recipientId} não encontrado para notificação.`);
      return;
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;
    const email = userData?.email;
    const userName = userData?.name || "Usuário";

    // Define o link de destino (Padrão: dashboard, ou o link específico da ação)
    const linkToUse = options?.customLink || "/dashboard";

    const tasks: Promise<any>[] = [];

    // 1. Enviar Push Notification (FCM)
    if (fcmToken) {
      const pushTask = admin
        .messaging()
        .send({
          notification: { title, body },
          // Envia o link nos dados para o app interceptar e navegar
          data: { link: linkToUse },
          token: fcmToken,
        })
        .catch((e) => logger.error(`Erro Push:`, e));
      tasks.push(pushTask);
    }

    // 2. Enviar E-mail (Resend) - Respeita a flag skipEmail
    if (email && resend && !options?.skipEmail) {
      const emailTask = resend.emails
        .send({
          from: "Agendamento <contato@stylo.app.br>",
          to: email,
          subject: title,
          react: React.createElement(StyloNotification, {
            userName: userName,
            title: title,
            body: body,
            actionLink: `${YOUR_APP_URL}${linkToUse}`, // Concatena URL base + link interno
          }),
        })
        .catch((e) => logger.error(`Erro Email:`, e));

      tasks.push(emailTask);
    }

    // 3. Salvar Notificação Interna (Firestore/Sininho) com o LINK CORRETO
    const firestoreTask = createFirestoreNotification(
      recipientId,
      title,
      body,
      linkToUse,
    );
    tasks.push(firestoreTask);

    await Promise.all(tasks);
  } catch (error) {
    logger.error(`Erro ao processar notificações:`, error);
  }
};

/**
 * Cria uma notificação no Firestore para o usuário (Persistência no App).
 */
const createFirestoreNotification = async (
  recipientId: string,
  title: string,
  message: string,
  link: string = "/dashboard", // <--- Padrão mantido, mas sobrescrevível
) => {
  try {
    await db.collection("notifications").add({
      userId: recipientId,
      title,
      message,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      link: link, // Salva o link para o front-end usar no clique
    });
  } catch (error) {
    logger.error(
      `Erro ao salvar notificação no Firestore para ${recipientId}:`,
      error,
    );
  }
};

// --- GATILHOS DO FIRESTORE (TRIGGERS) ---

export const onAppointmentCreate = onDocumentCreated(
  { document: "appointments/{appointmentId}", region: REGION },
  async (event) => {
    const appointmentData = event.data?.data();
    if (!appointmentData) return;

    const {
      providerId, // ID do Dono do Negócio
      professionalId, // ID do Profissional que vai atender
      clientName,
      serviceName,
      startTime,
    } = appointmentData;

    // Se não tiver dados essenciais, para
    if (!providerId && !professionalId) return;

    const { formattedDate, formattedTime } = formatDate(startTime);

    const title = "📅 Novo Agendamento!";
    const body = `${clientName || "Cliente"} agendou "${
      serviceName || "um serviço"
    }" para ${formattedDate} às ${formattedTime}.`;

    const recipients = new Set<string>();

    if (providerId) recipients.add(providerId);
    if (professionalId) recipients.add(professionalId);

    // --- ENVIO PARALELO ---
    const tasks = Array.from(recipients).map((userId) =>
      sendNotification(userId, title, body, {
        skipEmail: true, // ✅ Garante que NÃO envia e-mail
        customLink: "/dashboard/agenda", // ✅ Clica e vai direto pra agenda
      }),
    );

    await Promise.all(tasks);
    logger.info(
      `Notificação de novo agendamento enviada para: ${Array.from(recipients).join(", ")}`,
    );
  },
);

export const onAppointmentUpdate = onDocumentUpdated(
  {
    document: "appointments/{appointmentId}",
    region: REGION,
    secrets: ["RESEND_API_KEY"],
  },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Recupera o ID do agendamento vindo da URL do documento
    const appointmentId = event.params.appointmentId;

    if (!beforeData || !afterData || beforeData.status === afterData.status) {
      return;
    }

    const { formattedDate, formattedTime } = formatDate(afterData.startTime);

    // 1. Notificação para o CLIENTE (Confirmado / Recusado)
    if (
      (beforeData.status === "requested" || beforeData.status === "pending") &&
      (afterData.status === "scheduled" || afterData.status === "cancelled")
    ) {
      const { clientId, serviceName } = afterData;
      if (clientId) {
        const isConfirmed = afterData.status === "scheduled";
        const title = isConfirmed
          ? "✅ Agendamento Confirmado!"
          : "❌ Agendamento Recusado";
        const body = `Seu agendamento para "${
          serviceName || "serviço"
        }" em ${formattedDate} às ${formattedTime} foi ${
          isConfirmed ? "confirmado" : "recusado"
        }.`;

        await sendNotification(clientId, title, body);
      }
    }

    // 2. Notificação para o PRESTADOR (Cancelado pelo Cliente)
    if (beforeData.status === "scheduled" && afterData.status === "cancelled") {
      const { professionalId, serviceName, clientName } = afterData;
      if (professionalId) {
        const title = "⚠️ Agendamento Cancelado";
        const body = `${clientName || "Cliente"} cancelou o agendamento de "${
          serviceName || "serviço"
        }" de ${formattedDate} às ${formattedTime}.`;

        await sendNotification(professionalId, title, body);
      }
    }

    // 3. NOVO: Notificação para o CLIENTE avaliar (Quando status muda para 'completed')
    if (beforeData.status !== "completed" && afterData.status === "completed") {
      const { clientId, serviceName, professionalName } = afterData;

      if (clientId) {
        const title = "Como foi seu atendimento? ⭐";
        const body = `O serviço "${serviceName || "Atendimento"}" foi concluído. Toque para avaliar ${professionalName || "o profissional"}!`;

        // Cria o Deep Link para abrir o modal de review
        const reviewLink = `/dashboard?action=review&appointmentId=${appointmentId}`;

        await sendNotification(clientId, title, body, {
          skipEmail: true, // Economiza custo
          customLink: reviewLink, // Garante que abre o modal certo
        });
      }
    }
  },
);

export const onReviewCreate = onDocumentCreated(
  { document: "reviews/{reviewId}", region: REGION }, // Sem secrets, pois não manda email
  async (event) => {
    const reviewData = event.data?.data();
    if (!reviewData) return;

    const { serviceProviderId, rating } = reviewData;
    if (!serviceProviderId || typeof rating !== "number") return;

    const providerRef = db.collection("users").doc(serviceProviderId);

    // 1. Atualiza a média de notas (Lógica original)
    await db.runTransaction(async (transaction) => {
      const providerDoc = await transaction.get(providerRef);
      if (!providerDoc.exists) return;

      const providerData = providerDoc.data()!;
      const oldReviewCount = providerData.reviewCount || 0;
      const oldAverageRating = providerData.averageRating || 0;

      const newReviewCount = oldReviewCount + 1;
      const newAverageRating =
        (oldAverageRating * oldReviewCount + rating) / newReviewCount;

      transaction.update(providerRef, {
        reviewCount: newReviewCount,
        averageRating: parseFloat(newAverageRating.toFixed(1)),
      });
    });

    // 2. Envia Notificação SOMENTE NO APP (Sem E-mail)
    await sendNotification(
      serviceProviderId,
      "⭐ Nova Avaliação Recebida",
      `Você recebeu uma nota ${rating}. Parabéns!`,
      { skipEmail: true }, // <--- A MÁGICA ACONTECE AQUI
    );
  },
);

// --- FUNÇÕES CHAMÁVEIS (CALLABLE) ---
// (Mantidas inalteradas, pois sua lógica é de negócio/financeira e já está correta)

export const createStripeCheckout = onCall(
  {
    region: REGION,
    cors: ["https://stylo.app.br"],
    secrets: ["STRIPE_API_SECRET"],
  },
  async (request) => {
    // 1. Validação de Autenticação
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Autenticação necessária.");
    }

    // 2. Validação do Plano
    const { priceId } = request.data;
    if (
      !priceId ||
      !Object.values(PLANOS_PERMITIDOS).includes(priceId as string)
    ) {
      throw new HttpsError("invalid-argument", "Plano inválido.");
    }

    const uid = request.auth.uid;
    const userDocRef = db.collection("users").doc(uid);

    try {
      const stripe = getStripe();
      const userDoc = await userDocRef.get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError("not-found", "Usuário não encontrado.");
      }

      // --- FUNÇÃO AUXILIAR PARA CRIAR A SESSÃO (SÓ CARTÃO) ---
      const createSession = async (customerId: string) => {
        // 👇 REMOVI PIX E BOLETO PARA NÃO DAR ERRO
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          allow_promotion_codes: true,
          success_url: `${YOUR_APP_URL}/dashboard?checkout=success`,
          cancel_url: `${YOUR_APP_URL}/dashboard`,
          client_reference_id: uid,
        });

        if (!session.url) throw new Error("URL da sessão não gerada.");
        return { url: session.url };
      };

      // --- LÓGICA DE CLIENTE ---
      let stripeCustomerId = userData.stripeCustomerId;

      // Se o usuário nunca teve ID, cria agora
      if (!stripeCustomerId) {
        const newCustomer = await stripe.customers.create({
          email: userData.email,
          name: userData.name,
          metadata: { firebaseUID: uid },
        });
        stripeCustomerId = newCustomer.id;
        await userDocRef.update({ stripeCustomerId });
      }

      // --- TENTATIVA DE CHECKOUT (SELF-HEALING) ---
      try {
        return await createSession(stripeCustomerId);
      } catch (stripeError: any) {
        // Se der erro de "Cliente não encontrado", recria e tenta de novo
        if (
          stripeError.code === "resource_missing" ||
          (stripeError.message &&
            stripeError.message.includes("No such customer"))
        ) {
          logger.warn(
            `Cliente Stripe inválido detectado (${stripeCustomerId}). Recriando...`,
          );

          const freshCustomer = await stripe.customers.create({
            email: userData.email,
            name: userData.name,
            metadata: { firebaseUID: uid },
          });

          await userDocRef.update({ stripeCustomerId: freshCustomer.id });
          return await createSession(freshCustomer.id);
        }

        // Relança outros erros
        throw stripeError;
      }
    } catch (error: any) {
      logger.error("Erro Fatal no Stripe Checkout:", error);
      throw new HttpsError(
        "internal",
        "Erro ao processar pagamento. Tente novamente.",
      );
    }
  },
);

export const createStripeCustomerPortal = onCall(
  {
    region: REGION,
    cors: ["https://stylo.app.br"],
    secrets: ["STRIPE_API_SECRET"],
  },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Autenticação necessária.");
    const uid = request.auth.uid;

    try {
      const userDoc = await db.collection("users").doc(uid).get();
      const stripeCustomerId = userDoc.data()?.stripeCustomerId;

      if (!stripeCustomerId)
        throw new HttpsError("not-found", "Cliente Stripe não encontrado.");

      const stripe = getStripe();
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${YOUR_APP_URL}/dashboard`,
      });

      return { url: portalSession.url };
    } catch (error) {
      logger.error("Erro Portal Stripe:", error);
      throw new HttpsError("internal", "Erro ao acessar portal.");
    }
  },
);

export const stripeWebhook = onRequest(
  {
    region: REGION,
    cors: ["https://stylo.app.br"],
    secrets: ["STRIPE_API_SECRET", "STRIPE_WEBHOOK_KEY"],
  },
  async (request, response) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_KEY;
    if (!webhookSecret) {
      response.status(400).send("Webhook Error: Missing secret");
      return;
    }

    const sig = request.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        webhookSecret,
      );
    } catch (err: any) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const {
            client_reference_id: userId,
            subscription: subscriptionId,
            customer: stripeCustomerId,
          } = session;

          if (userId && subscriptionId && stripeCustomerId) {
            await db.collection("users").doc(userId).update({
              subscriptionStatus: "active",
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: stripeCustomerId,
            });
            logger.info(`Assinatura ativada para ${userId}`);
          }
          break;
        }
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.lines?.data[0]?.subscription;
          if (subscriptionId) {
            const users = await db
              .collection("users")
              .where("stripeSubscriptionId", "==", subscriptionId)
              .limit(1)
              .get();
            if (!users.empty) {
              await users.docs[0].ref.update({ subscriptionStatus: "active" });
            }
          }
          break;
        }
        case "invoice.payment_failed":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const users = await db
            .collection("users")
            .where("stripeSubscriptionId", "==", subscription.id)
            .limit(1)
            .get();
          if (!users.empty) {
            await users.docs[0].ref.update({ subscriptionStatus: "cancelled" });
          }
          break;
        }
      }
    } catch (error) {
      logger.error("Erro Webhook:", error);
      response.status(500).send("Erro interno.");
      return;
    }
    response.status(200).send({ received: true });
  },
);

export const createProfessionalUser = onCall(
  { region: REGION, cors: ["https://stylo.app.br"] },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Autenticação necessária.");

    const { name, email, password, serviceIds } = request.data;
    const providerId = request.auth.uid;

    if (!name || !email || !password || !serviceIds)
      throw new HttpsError("invalid-argument", "Dados incompletos.");

    const providerDoc = await db.collection("users").doc(providerId).get();
    if (providerDoc.data()?.role !== "serviceProvider") {
      throw new HttpsError(
        "permission-denied",
        "Apenas prestadores podem criar equipe.",
      );
    }

    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false,
      });

      const providerData = providerDoc.data();
      const allServices = providerData?.services || [];
      const selectedServices = allServices.filter((s: { id: string }) =>
        serviceIds.includes(s.id),
      );

      const newProfessionalRef = db
        .collection("serviceProviders")
        .doc(providerId)
        .collection("professionals")
        .doc();

      await newProfessionalRef.set({
        id: newProfessionalRef.id,
        name,
        services: selectedServices,
        availability: [],
      });

      await db.collection("users").doc(userRecord.uid).set({
        id: userRecord.uid,
        name,
        email,
        role: "professional",
        serviceProviderId: providerId,
        professionalId: newProfessionalRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        professionalId: newProfessionalRef.id,
        uid: userRecord.uid,
      };
    } catch (error: any) {
      if (userRecord) await admin.auth().deleteUser(userRecord.uid);
      logger.error("Erro ao criar profissional:", error);
      throw new HttpsError(
        "internal",
        error.message || "Erro ao criar profissional.",
      );
    }
  },
);

export const createAppointment = onCall(
  { region: REGION, cors: ["https://stylo.app.br"] },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Autenticação necessária.");

    const {
      clientId,
      professionalId,
      providerId,
      startTime,
      endTime,
      serviceName,
      clientName,
      clientPhone,
      professionalName,
      services,
      totalPrice,
      totalDuration,
      notes,
      reminderMinutes,
    } = request.data;

    if (!clientId || !professionalId || !startTime || !endTime) {
      throw new HttpsError("invalid-argument", "Dados incompletos.");
    }

    if (providerId) {
      await checkSubscription(providerId);
    } else {
      throw new HttpsError(
        "invalid-argument",
        "ID do estabelecimento não fornecido.",
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start < new Date())
      throw new HttpsError("invalid-argument", "Data inválida (passado).");

    const minutesToSubtract = typeof reminderMinutes === "number" ? reminderMinutes : 60;
    const reminderDate = new Date(start.getTime() - minutesToSubtract * 60000);

    const appointmentsRef = db.collection("appointments");
    const lockRef = db.collection("availability_locks").doc(professionalId);

    try {
      const appointmentId = await db.runTransaction(async (transaction) => {
        await transaction.get(lockRef); // Lock

        const startOfDay = new Date(start);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(start);
        endOfDay.setHours(23, 59, 59, 999);

        const snapshot = await transaction.get(
          appointmentsRef
            .where("professionalId", "==", professionalId)
            .where("startTime", ">=", startOfDay)
            .where("startTime", "<=", endOfDay)
            .where("status", "in", ["scheduled", "pending"]),
        );

        let hasConflict = false;
        snapshot.forEach((doc) => {
          const appt = doc.data();
          const s = appt.startTime.toDate();
          const e = appt.endTime.toDate();
          if (start < e && end > s) hasConflict = true;
        });

        if (hasConflict)
          throw new HttpsError("already-exists", "Horário indisponível.");

        const newRef = appointmentsRef.doc();
        transaction.set(newRef, {
          clientId,
          clientName,
          clientPhone,
          professionalId,
          professionalName,
          providerId,
          serviceName,
          services,
          totalPrice,
          totalDuration,
          notes: notes || "",
          startTime: admin.firestore.Timestamp.fromDate(start),
          endTime: admin.firestore.Timestamp.fromDate(end),
          reminderTime: admin.firestore.Timestamp.fromDate(reminderDate),
          reminderSent: false,
          reminderMinutes: minutesToSubtract,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        transaction.set(
          lockRef,
          { lastUpdate: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true },
        );

        return newRef.id;
      });

      return { success: true, appointmentId };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Erro no agendamento:", error);
      throw new HttpsError("internal", "Erro ao agendar.");
    }
  },
);

export const completeAppointment = onCall(
  { region: REGION, cors: ["https://stylo.app.br"] }, // Ajuste o CORS conforme prod
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Autenticação necessária.");

    const { appointmentId, finalPrice } = request.data;
    const uid = request.auth.uid;

    if (!appointmentId || finalPrice === undefined || finalPrice < 0) {
      throw new HttpsError("invalid-argument", "Dados inválidos.");
    }

    const userDocRef = db.collection("users").doc(uid);
    const userDocSnap = await userDocRef.get();
    const userData = userDocSnap.data();

    const appointmentRef = db.collection("appointments").doc(appointmentId);

    try {
      await db.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(appointmentRef);
        if (!docSnap.exists)
          throw new HttpsError("not-found", "Agendamento não encontrado.");

        const data = docSnap.data()!;

        const isOwner = data.providerId === uid;

        const isLinkedProfessional =
          userData?.professionalId === data.professionalId;

        const isDirectMatch = data.professionalId === uid;

        if (!isOwner && !isLinkedProfessional && !isDirectMatch) {
          throw new HttpsError(
            "permission-denied",
            "Você não tem permissão para finalizar este agendamento.",
          );
        }

        if (data.status !== "scheduled") {
          if (data.status === "completed") return; // Já feito
          throw new HttpsError("failed-precondition", "Status inválido.");
        }

        const transRef = db
          .collection("transactions")
          .where("appointmentId", "==", appointmentId);
        const transSnap = await transaction.get(transRef);

        if (transSnap.empty) {
          const newTransRef = db.collection("transactions").doc();
          transaction.set(newTransRef, {
            providerId: data.providerId, // Usa o providerId do agendamento
            appointmentId,
            clientId: data.clientId || "N/A",
            clientName: data.clientName || "N/A",
            serviceName: data.serviceName || "N/A",
            amount: finalPrice,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            professionalName: data.professionalName || "N/A",
          });
        }

        transaction.update(appointmentRef, {
          status: "completed",
          finalPrice,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return { success: true, appointmentId };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Erro ao completar:", error);
      throw new HttpsError("internal", "Erro interno.");
    }
  },
);

export const cancelAppointmentByClient = onCall(
  { region: REGION, cors: ["https://stylo.app.br"] }, // Ajuste o CORS conforme prod
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Autenticação necessária.");
    }

    const { appointmentId, reason } = request.data;
    const uid = request.auth.uid;

    if (!appointmentId) {
      throw new HttpsError("invalid-argument", "ID e motivo são obrigatórios.");
    }

    const appointmentRef = db.collection("appointments").doc(appointmentId);

    try {
      await db.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(appointmentRef);

        if (!docSnap.exists) {
          throw new HttpsError("not-found", "Agendamento não encontrado.");
        }

        const appointment = docSnap.data()!;

        // 1. Verificar se quem está cancelando é o dono do agendamento
        if (appointment.clientId !== uid) {
          throw new HttpsError(
            "permission-denied",
            "Este agendamento não é seu.",
          );
        }

        // 2. Verificar status atual
        if (
          appointment.status !== "scheduled" &&
          appointment.status !== "pending"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Agendamento não pode ser cancelado neste estado.",
          );
        }

        // 3. Buscar regra de cancelamento do PRESTADOR (Business Owner)
        // O appointment tem providerId (dono do negócio) e professionalId (funcionário)
        // A regra fica no providerId (ServiceProviderProfile)
        const providerRef = db.collection("users").doc(appointment.providerId);
        const providerSnap = await transaction.get(providerRef);
        const providerData = providerSnap.data();

        // Default: 2 horas se não configurado
        const minHours = providerData?.cancellationMinHours ?? 2;

        // 4. Validação de Tempo
        const startTime = appointment.startTime.toDate();
        const now = new Date(); // Hora atual do servidor (UTC)

        // Diferença em milissegundos
        const diffMs = startTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < minHours) {
          throw new HttpsError(
            "failed-precondition",
            `O prazo para cancelamento online expirou. Necessário ${minHours}h de antecedência.`,
          );
        }

        // 5. Executar cancelamento
        transaction.update(appointmentRef, {
          status: "cancelled",
          rejectionReason:
            reason || "Cancelado pelo cliente (sem motivo informado)",
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          cancelledBy: "client",
        });
      });

      return { success: true };
    } catch (error: any) {
      logger.error("Erro ao cancelar agendamento:", error);
      // Repassar erro HttpsError para o front
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        "internal",
        error.message || "Erro interno ao cancelar.",
      );
    }
  },
);

// functions/src/index.ts

export const deleteProfessionalAccount = onCall(
  {
    region: REGION,
    cors: true, // 👈 Mude para true para evitar bloqueios de domínio durante os testes
  },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Acesso negado.");

    const { professionalId, providerId } = request.data;

    if (request.auth.uid !== providerId) {
      throw new HttpsError("permission-denied", "Apenas o dono pode excluir.");
    }

    try {
      const userQuery = await db
        .collection("users")
        .where("professionalId", "==", professionalId)
        .limit(1)
        .get();

      const batch = db.batch();

      const profRef = db
        .collection("serviceProviders")
        .doc(providerId)
        .collection("professionals")
        .doc(professionalId);
      batch.delete(profRef);

      if (!userQuery.empty) {
        const userDoc = userQuery.docs[0];
        batch.delete(userDoc.ref);
        await batch.commit();

        // Deleta o login permanentemente
        await admin.auth().deleteUser(userDoc.id);
        logger.info(`Conta ${userDoc.id} removida com sucesso.`);
      } else {
        await batch.commit();
      }

      return { success: true };
    } catch (error: any) {
      logger.error("Erro na Cloud Function:", error);
      // Retorna o erro real para o seu console.log do front-end
      throw new HttpsError(
        "internal",
        error.message || "Erro ao excluir conta.",
      );
    }
  },
);

const checkSubscription = async (uid: string) => {
  if (!uid) return;

  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.data();

  const allowedStatuses = ["active", "trialing", "trial","free", "lifetime"];

  const status = userData?.subscriptionStatus;

  if (!status || !allowedStatuses.includes(status)) {
    logger.warn(
      `Bloqueio de Kill Switch acionado para provider: ${uid}. Status: ${status}`,
    );
    throw new HttpsError(
      "permission-denied",
      "O estabelecimento está com a assinatura inativa ou pendente. Agendamento não permitido.",
    );
  }
};

export const checkExpiredTrials = onSchedule(
  {
    schedule: "every day 00:00",
    timeZone: TIME_ZONE,
    region: REGION,
    secrets: ["RESEND_API_KEY"],
  },
  async () => {
    logger.info("Verificando trials expirados...");

    const now = admin.firestore.Timestamp.now();
    const usersRef = db.collection("users");

    // Busca usuários 'trial' vencidos
    const snapshot = await usersRef
      .where("role", "==", "serviceProvider")
      .where("subscriptionStatus", "==", "trial")
      .where("trialEndsAt", "<", now)
      .get();

    if (snapshot.empty) {
      logger.info("Nenhum trial expirado encontrado hoje.");
      return;
    }

    const batch = db.batch();
    const notificationPromises: Promise<any>[] = []; // Array para disparar notificações em paralelo
    let count = 0;

    // Nota: O Batch do Firestore suporta até 500 operações.
    // Se seu app crescer muito (milhares de expirações/dia), precisará dividir em chunks.
    // Para o início, isso atende perfeitamente.

    snapshot.forEach((doc) => {
      // 1. Atualiza o status no Banco
      batch.update(doc.ref, {
        subscriptionStatus: "expired",
      });

      // 2. Prepara a notificação (Push + Email)
      // Usando sua função sendNotification existente
      notificationPromises.push(
        sendNotification(
          doc.id,
          "Seu período de teste acabou 🔒",
          "Seus agendamentos públicos foram pausados. Assine um plano agora para continuar usando o Stylo sem interrupções.",
        ),
      );

      count++;
    });

    // Executa as atualizações no banco
    await batch.commit();

    // Envia todas as notificações
    await Promise.all(notificationPromises);

    logger.info(`${count} contas de trial foram expiradas e notificadas.`);
  },
);

// Adicione em functions/src/index.ts

// Esta função roda a cada 15 minutos para garantir precisão
export const sendPreciseReminders = onSchedule(
  {
    schedule: "every 15 minutes", // Frequência de verificação
    timeZone: TIME_ZONE,
    region: REGION,
    secrets: ["RESEND_API_KEY"],
  },
  async () => {
    logger.info("Verificando lembretes personalizados...");

    const now = admin.firestore.Timestamp.now();
    
    // Busca agendamentos onde a hora do lembrete JÁ PASSOU (ou é agora) 
    // e o lembrete AINDA NÃO foi enviado.
    const appointmentsRef = db.collection("appointments");
    const q = appointmentsRef
      .where("reminderSent", "==", false) // Ainda não enviado
      .where("reminderTime", "<=", now) // Hora do lembrete já chegou
      .where("status", "==", "scheduled"); // Agendamento confirmado

    const snapshot = await q.get();

    if (snapshot.empty) return;

    const batch = db.batch();
    const notifications: Promise<any>[] = [];

    snapshot.forEach((doc) => {
      const appt = doc.data();
      
      // Validação de segurança: Não enviar se o agendamento já passou há muito tempo (ex: > 2h de atraso no cron)
      // Isso evita spam de notificações velhas se o servidor ficar offline
      const reminderTime = appt.reminderTime.toDate();
      const diffHours = (now.toDate().getTime() - reminderTime.getTime()) / 36e5;
      
      if (diffHours > 2) {
        // Marca como enviado só para limpar da fila, mas não manda notificação
        batch.update(doc.ref, { reminderSent: true });
        return;
      }

      // Prepara atualização do banco (Marca como enviado)
      batch.update(doc.ref, { reminderSent: true });

      // Prepara envio da notificação
      const { formattedTime } = formatDate(appt.startTime);
      const title = "⏰ Seu horário está chegando!";
      const body = `Lembrete: Você tem um agendamento de "${appt.serviceName}" às ${formattedTime}.`;

      notifications.push(sendNotification(appt.clientId, title, body));
    });

    await batch.commit();
    await Promise.all(notifications);
    
    logger.info(`${notifications.length} lembretes personalizados enviados.`);
  }
);
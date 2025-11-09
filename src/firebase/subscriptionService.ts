// src/firebase/subscriptionService.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "./config"; // Importa a instância do functions

/**
 * Chama a Cloud Function para criar uma sessão de checkout no Stripe.
 * Esta versão está correta e aceita o priceId
 */
export const createCheckoutSession = async (
  priceId: string
): Promise<{ url: string }> => {
  try {
    const createSession = httpsCallable(functions, "createStripeCheckout");

    // Envia o priceId selecionado para a função de backend
    const result = await createSession({ priceId });

    const data = result.data as { url: string };

    if (!data.url) {
      throw new Error("URL de checkout não retornada pela função.");
    }

    return data;
  } catch (error) {
    console.error("Erro ao chamar createStripeCheckout:", error);
    // Propaga a mensagem de erro vinda do backend (ex: "ID inválido")
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Falha ao iniciar o pagamento.");
  }
};

/**
 * Chama a Cloud Function para criar uma sessão do Portal do Cliente Stripe.
 */
export const createCustomerPortalSession = async (): Promise<{ url: string }> => {
  try {
    const createPortal = httpsCallable(
      functions,
      "createStripeCustomerPortal"
    );

    const result = await createPortal();
    const data = result.data as { url: string };

    if (!data.url) {
      throw new Error("URL do portal não retornada pela função.");
    }

    return data;
  } catch (error) {
    console.error("Erro ao chamar createStripeCustomerPortal:", error);
    throw new Error("Falha ao acessar o portal do cliente.");
  }
};
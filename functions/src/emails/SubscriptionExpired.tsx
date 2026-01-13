import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";

interface SubscriptionExpiredProps {
  userName?: string;
  daysLeft?: number; // Opcional, se quiser avisar "Faltam 3 dias"
  actionLink?: string;
}

export const SubscriptionExpired = ({
  userName = "Parceiro",
  daysLeft = 0,
  actionLink = "https://stylo-app.com/dashboard/billing",
}: SubscriptionExpiredProps) => {
  
  // Lógica simples para mudar o texto dependendo se já expirou ou vai expirar
  const titleText = daysLeft > 0 
    ? `Sua assinatura expira em ${daysLeft} dias` 
    : "Sua assinatura expirou";
    
  const bodyText = daysLeft > 0
    ? "Para evitar interrupções nos seus agendamentos e manter seu perfil ativo, renove seu plano agora."
    : "Seus agendamentos estão pausados e seu perfil não aparece mais nas buscas. Para voltar a atender, reative seu plano.";

  return (
    <Html>
      <Head />
      <Preview>{titleText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#000000",
                alert: "#e11d48", // Um vermelho elegante para urgência
              },
            },
          },
        }}
      >
        <Body className="bg-[#fafafa] my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
            <Section className="mt-[32px] text-center">
              <Heading className="text-brand text-[24px] font-bold p-0 my-[30px] mx-0">
                Stylo.
              </Heading>
            </Section>

            <Heading className="text-brand text-[20px] font-normal text-center p-0 my-[20px] mx-0">
              Olá, {userName}.
            </Heading>

            {/* Texto de Alerta */}
            <Section className="text-center">
                <Text className="text-[18px] font-bold text-alert m-0">
                    ⚠️ {titleText}
                </Text>
            </Section>

            <Text className="text-[#444] text-[14px] leading-[24px] mt-4 text-center">
              {bodyText}
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-4"
                href={actionLink}
              >
                Renovar Assinatura
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] text-center">
              Precisa de ajuda com o pagamento? Responda este e-mail.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SubscriptionExpired;
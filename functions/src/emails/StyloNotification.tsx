import * as React from 'react';
import { Html, Body, Container, Section, Heading, Text, Button, Hr, Tailwind, Preview } from "@react-email/components";

interface StyloNotificationProps {
  title: string;
  body: string;
  actionLink?: string;
  userName?: string;
}

export const StyloNotification = ({
  title,
  body,
  actionLink = "https://seusite.com/dashboard", // Coloque seu link real aqui
  userName = "Usuário",
}: StyloNotificationProps) => {
  return (
    <Html>
      <Preview>{title}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#000000",
                offwhite: "#fafafa",
              },
            },
          },
        }}
      >
        <Body className="bg-offwhite my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
            <Section className="mt-[32px]">
              <Heading className="text-brand text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                Stylo.
              </Heading>
            </Section>
            
            <Heading className="text-brand text-[18px] font-normal text-center p-0 my-[20px] mx-0">
              Olá, <strong>{userName}</strong>
            </Heading>
            
            <Text className="text-[#444] text-[14px] leading-[24px]">
              {body}
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={actionLink}
              >
                Acessar Painel
              </Button>
            </Section>
            
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              © 2025 Stylo Agendamentos.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default StyloNotification;
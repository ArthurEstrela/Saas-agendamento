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
  Link,
} from "@react-email/components";

interface WelcomeStyloProps {
  userName?: string;
  actionLink?: string;
}

export const WelcomeStylo = ({
  userName = "Membro",
  actionLink = "https://stylo-app.com/dashboard", // Link de produção ou login
}: WelcomeStyloProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bem-vindo à nova experiência Stylo.</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#000000", // Preto Stylo
                offwhite: "#fafafa",
              },
            },
          },
        }}
      >
        <Body className="bg-offwhite my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
            <Section className="mt-[32px] text-center">
              {/* Se tiver um logo hospedado, use <Img src="..." /> aqui. 
                  Por enquanto, vou deixar o texto estilizado que fica muito elegante. */}
              <Heading className="text-brand text-[24px] font-bold p-0 my-[30px] mx-0">
                Stylo.
              </Heading>
            </Section>

            <Heading className="text-brand text-[20px] font-normal text-center p-0 my-[30px] mx-0">
              Bem-vindo ao <strong>Stylo</strong>.
            </Heading>

            <Text className="text-[#444] text-[14px] leading-[24px]">
              Olá, <strong>{userName}</strong>.
            </Text>
            
            <Text className="text-[#444] text-[14px] leading-[24px]">
              Estamos muito felizes em ter você a bordo. A plataforma Stylo foi desenhada para simplificar sua gestão e profissionalizar seus agendamentos.
            </Text>
            
            <Text className="text-[#444] text-[14px] leading-[24px]">
             Para começar a configurar seus serviços e horários, acesse seu painel agora mesmo:
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={actionLink}
              >
                Acessar Meu Painel
              </Button>
            </Section>

            <Text className="text-[#444] text-[14px] leading-[24px]">
              Ou copie e cole esse link no seu navegador:{" "}
              <Link href={actionLink} className="text-blue-600 no-underline break-all">
                {actionLink}
              </Link>
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              © 2025 Stylo Inc. Gerencie com classe.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeStylo;
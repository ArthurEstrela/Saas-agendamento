// src/components/TermsOfUse.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  UserCircle2,
  CalendarCheck2,
  CreditCard,
  ShieldCheck,
  Scale,
  Ban,
  AlertTriangle,
  RefreshCw,
  Mail,
  FileSignature,
  type LucideIcon
} from "lucide-react";

const TermSection = ({
  title,
  icon: Icon,
  children,
  delay,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay }}
    className="mb-12 last:mb-0"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-gray-800/50 text-amber-500 border border-gray-700">
        <Icon size={24} />
      </div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
    <div className="pl-0 md:pl-14 text-gray-400 leading-relaxed space-y-4">
      {children}
    </div>
  </motion.div>
);

const TermsOfUse = () => {
  return (
    <div className="bg-gray-950 min-h-screen font-sans relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative pt-24 pb-12 sm:pt-32 bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium mb-6">
              <FileSignature size={14} />
              <span>Termos Legais</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Termos de Uso
            </h1>
            <p className="text-gray-400">
              Vigência a partir de:{" "}
              <span className="text-gray-200 font-semibold">
                04 de agosto de 2025
              </span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-12 shadow-2xl">
          <div className="prose prose-invert prose-lg max-w-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-12 text-lg text-gray-300 leading-relaxed border-l-4 border-amber-500 pl-6 bg-gray-800/20 py-4 rounded-r-lg"
            >
              <p className="mb-0">
                Bem-vindo à Stylo! Estes Termos de Uso ("Termos") governam o seu
                acesso e uso da nossa plataforma. Ao acessar ou usar nossos
                serviços, você concorda em cumprir e ficar vinculado a estes
                Termos.
              </p>
            </motion.div>

            <TermSection title="1. Definições" icon={BookOpen} delay={0.1}>
              <ul className="list-disc pl-5 space-y-2 marker:text-amber-500">
                <li>
                  <strong>"Plataforma"</strong>: refere-se ao software, website
                  e serviços fornecidos pela Stylo.
                </li>
                <li>
                  <strong>"Utilizador Cliente"</strong>: qualquer pessoa que
                  utiliza a Plataforma para encontrar e agendar serviços.
                </li>
                <li>
                  <strong>"Utilizador Profissional"</strong>: empresas ou
                  indivíduos registrados para oferecer serviços.
                </li>
                <li>
                  <strong>"Conteúdo"</strong>: todo texto, imagens, dados e
                  informações disponíveis na Plataforma.
                </li>
              </ul>
            </TermSection>

            <TermSection
              title="2. Contas de Utilizador"
              icon={UserCircle2}
              delay={0.2}
            >
              <p>
                Para acessar certas funcionalidades, é necessário criar uma
                conta. Você concorda em fornecer informações precisas e atuais.
                A segurança da sua senha é de sua responsabilidade, assim como
                todas as atividades que ocorram sob sua conta.
              </p>
            </TermSection>

            <TermSection
              title="3. Serviços de Agendamento"
              icon={CalendarCheck2}
              delay={0.3}
            >
              <p>
                A Stylo atua como intermediária tecnológica para agendamentos.
                Não somos parte de nenhum contrato de serviço entre Clientes e
                Profissionais, nem nos responsabilizamos pela qualidade ou
                segurança dos serviços prestados.
              </p>
              <p>
                Os Profissionais são responsáveis por gerir sua própria
                disponibilidade, preços e políticas, que devem ser
                transparentes.
              </p>
            </TermSection>

            <TermSection
              title="4. Pagamentos e Cancelamentos"
              icon={CreditCard}
              delay={0.4}
            >
              <p>
                A Stylo facilita o processamento de pagamentos através de
                gateways seguros terceirizados e não armazena dados completos de
                cartões de crédito.
              </p>
              <p>
                Políticas de cancelamento e reembolso são definidas
                individualmente por cada Profissional. Recomendamos revisar
                essas políticas antes de confirmar um agendamento.
              </p>
            </TermSection>

            <TermSection
              title="5. Conduta do Utilizador"
              icon={ShieldCheck}
              delay={0.5}
            >
              <p>
                Você concorda em <strong>não</strong> usar a Plataforma para:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-amber-500">
                <li>
                  Publicar conteúdo falso, enganoso, difamatório ou ilegal.
                </li>
                <li>Violar leis locais, nacionais ou internacionais.</li>
                <li>Assediar, ameaçar ou prejudicar outros usuários.</li>
                <li>
                  Tentar invadir, sobrecarregar ou comprometer a segurança dos
                  nossos sistemas.
                </li>
              </ul>
            </TermSection>

            <TermSection
              title="6. Propriedade Intelectual"
              icon={Scale}
              delay={0.6}
            >
              <p>
                Todo o conteúdo da Plataforma (logotipo, design, código-fonte) é
                propriedade exclusiva da Stylo. É proibida a cópia, modificação
                ou distribuição sem nossa autorização expressa por escrito.
              </p>
            </TermSection>

            <TermSection title="7. Rescisão" icon={Ban} delay={0.7}>
              <p>
                Reservamo-nos o direito de suspender ou encerrar sua conta a
                qualquer momento, caso haja violação destes Termos ou suspeita
                de atividade fraudulenta.
              </p>
            </TermSection>

            <TermSection
              title="8. Limitação de Responsabilidade"
              icon={AlertTriangle}
              delay={0.8}
            >
              <p>
                A Stylo não será responsável por danos indiretos, incidentais ou
                consequenciais (como perda de lucros ou dados) resultantes do
                uso ou incapacidade de uso da Plataforma.
              </p>
            </TermSection>

            <TermSection
              title="9. Alterações aos Termos"
              icon={RefreshCw}
              delay={0.9}
            >
              <p>
                Podemos atualizar estes Termos periodicamente. Notificaremos
                sobre mudanças significativas através da Plataforma. O uso
                continuado após as alterações constitui aceitação dos novos
                termos.
              </p>
            </TermSection>

            <TermSection title="10. Contato" icon={Mail} delay={1.0}>
              <p>
                Dúvidas sobre estes Termos? Nossa equipe jurídica está à
                disposição através do canal oficial:
              </p>
              <div className="mt-4 p-4 bg-gray-800 rounded-lg inline-block border border-gray-700">
                <a
                  href="mailto:suporte@stylo.com"
                  className="text-amber-500 font-bold hover:text-amber-400 hover:underline flex items-center gap-2"
                >
                  <Mail size={18} /> suporte@stylo.com
                </a>
              </div>
            </TermSection>
          </div>
        </div>

        <div className="text-center mt-12 pb-8 text-gray-500 text-sm">
          © {new Date().getFullYear()} Stylo Inc. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
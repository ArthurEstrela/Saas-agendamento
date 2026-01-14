import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  UserCircle2,
  CalendarCheck2,
  CreditCard,
  ShieldCheck,
  Scale,
  AlertTriangle,
  RefreshCw,
  Mail,
  FileSignature,
  type LucideIcon,
  Check,
} from "lucide-react";

// Componente de Seção Reutilizável Otimizado
const TermSection = ({
  title,
  icon: Icon,
  children,
  index,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }} // Anima apenas uma vez para performance
    transition={{ duration: 0.5, delay: Math.min(index * 0.1, 0.3) }} // Limita o delay acumulado
    className="mb-12 last:mb-0 group"
  >
    <div className="flex items-center gap-4 mb-4 md:mb-6">
      {/* Ícone: Fundo sólido no mobile, vidro no desktop */}
      <div className="p-3 rounded-xl bg-[#27272a] md:bg-gray-900/50 text-amber-500 border border-white/5 md:group-hover:border-amber-500/30 transition-all duration-300 md:shadow-lg md:shadow-black/20 shrink-0">
        <Icon size={24} />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-100 md:group-hover:text-white transition-colors">
        {title}
      </h2>
    </div>
    <div className="pl-0 md:pl-[4.5rem] text-gray-400 leading-relaxed space-y-4 text-base md:text-lg font-light">
      {children}
    </div>
  </motion.div>
);

const ListDot = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 mb-3">
    <div className="mt-1.5 p-0.5 rounded-full bg-amber-500/20 text-amber-500 shrink-0">
       <Check size={10} strokeWidth={4} />
    </div>
    <span className="text-gray-300 text-sm md:text-base">{children}</span>
  </li>
);

const TermsOfUse = () => {
  return (
    // Fundo base consistente
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">
      
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Padrão de Grade (Leve) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Mobile: Gradiente Estático (Rápido) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden opacity-90" />
        
        {/* Desktop: Blurs Ricos */}
        <div className="hidden md:block absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none opacity-40"></div>
        <div className="hidden md:block absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[100px] rounded-full pointer-events-none opacity-30"></div>
      </div>

      {/* --- HEADER --- */}
      <div className="relative pt-24 pb-16 md:pt-32 md:pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/5 bg-[#0c0c0e] md:bg-gray-950/50 md:backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-6 md:mb-8 hover:bg-amber-500/20 transition-colors cursor-default">
              <FileSignature size={12} />
              Termos Legais
            </div>

            <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6 text-white leading-tight">
              Termos de <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700">
                Uso
              </span>
            </h1>

            <p className="text-gray-500 text-xs md:text-sm uppercase tracking-widest">
              Vigência a partir de:{" "}
              <span className="text-gray-300 font-semibold">
                04 de agosto de 2025
              </span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* --- CONTEÚDO --- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        
        {/* Container Principal: Sólido no Mobile para Scroll Liso */}
        <div className="bg-[#18181b] border border-white/5 md:bg-gray-900/40 md:backdrop-blur-xl rounded-3xl p-6 md:p-16 shadow-xl md:shadow-2xl">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12 md:mb-16 p-6 md:p-8 bg-[#27272a] md:bg-gray-950/50 rounded-2xl border border-white/5"
          >
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed text-center font-light">
              Bem-vindo à Stylo! Ao acessar nossa plataforma, você concorda com
              os termos abaixo. Eles existem para proteger tanto o seu negócio
              quanto o nosso.
            </p>
          </motion.div>

          <TermSection
            title="1. Definições Essenciais"
            icon={BookOpen}
            index={1}
          >
            <ul className="mt-4">
              <ListDot>
                <strong>"Plataforma":</strong> O ecossistema de software, site e
                apps da Stylo.
              </ListDot>
              <ListDot>
                <strong>"Profissional":</strong> Você, empresa ou indivíduo que
                usa a Stylo para gerir o negócio.
              </ListDot>
              <ListDot>
                <strong>"Cliente Final":</strong> O usuário que agenda serviços
                com você através da Stylo.
              </ListDot>
              <ListDot>
                <strong>"Assinatura":</strong> O plano pago que concede acesso
                aos recursos premium.
              </ListDot>
            </ul>
          </TermSection>

          <TermSection
            title="2. Contas & Segurança"
            icon={UserCircle2}
            index={2}
          >
            <p>
              Você é responsável por manter suas credenciais seguras. Qualquer
              atividade realizada na sua conta é de sua responsabilidade.
              Comprometa-se a fornecer dados reais e atualizados sobre seu
              negócio.
            </p>
          </TermSection>

          <TermSection title="3. Agendamentos" icon={CalendarCheck2} index={3}>
            <p>
              A Stylo fornece a infraestrutura tecnológica. Não somos
              responsáveis pela prestação do serviço final (corte, barba, etc.).
              A gestão de horários, preços e atendimento ao cliente final é de
              responsabilidade do Profissional.
            </p>
          </TermSection>

          <TermSection
            title="4. Pagamentos & Cancelamentos"
            icon={CreditCard}
            index={4}
          >
            <p>
              Processamos pagamentos de forma segura via parceiros. A Stylo não
              armazena dados de cartão. Sobre cancelamentos de assinatura: você
              pode cancelar a qualquer momento, mantendo o acesso até o fim do
              ciclo pago. Não há multas.
            </p>
          </TermSection>

          <TermSection
            title="5. Código de Conduta"
            icon={ShieldCheck}
            index={5}
          >
            <p>
              É proibido usar a plataforma para atividades ilícitas,
              fraudulentas ou para enviar spam. Reservamo-nos o direito de
              suspender contas que violem a integridade da nossa comunidade.
            </p>
          </TermSection>

          <TermSection
            title="6. Propriedade Intelectual"
            icon={Scale}
            index={6}
          >
            <p>
              O design, código e marca "Stylo" são propriedades exclusivas
              nossas. Os dados dos seus clientes e do seu negócio pertencem a
              você.
            </p>
          </TermSection>

          <TermSection
            title="7. Limitação de Responsabilidade"
            icon={AlertTriangle}
            index={7}
          >
            <p>
              Trabalhamos para manter o serviço no ar 99.9% do tempo. No
              entanto, não nos responsabilizamos por lucros cessantes
              decorrentes de instabilidades momentâneas da internet ou de
              terceiros.
            </p>
          </TermSection>

          <TermSection title="8. Atualizações" icon={RefreshCw} index={8}>
            <p>
              A tecnologia evolui rápido. Podemos atualizar estes termos. Se a
              mudança for significativa, avisaremos você por e-mail ou
              notificação no painel.
            </p>
          </TermSection>

          <TermSection title="9. Jurídico" icon={Mail} index={9}>
            <p>Dúvidas legais? Estamos à disposição.</p>
            <div className="mt-6 inline-block w-full sm:w-auto">
              <a
                href="mailto:juridico@stylo.app.br"
                className="flex items-center justify-center sm:justify-start gap-3 px-6 py-4 bg-[#27272a] md:bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-amber-500/50 rounded-xl transition-all group touch-manipulation"
              >
                <div className="p-2 bg-gray-900 rounded-lg text-amber-500 group-hover:text-white transition-colors">
                  <Mail size={20} />
                </div>
                <span className="text-gray-200 font-medium group-hover:text-white">
                  juridico@stylo.app.br
                </span>
              </a>
            </div>
          </TermSection>
        </div>

        <div className="text-center mt-12 md:mt-16 text-gray-600 text-xs md:text-sm">
          © {new Date().getFullYear()} Stylo Inc. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
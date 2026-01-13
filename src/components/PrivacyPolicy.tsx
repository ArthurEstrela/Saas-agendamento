// src/components/PrivacyPolicy.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  Share2, 
  Cookie, 
  RefreshCcw, 
  Mail,
  CheckCircle2,
  type LucideIcon
} from 'lucide-react';

const Section = ({ 
  title, 
  icon: Icon, 
  children, 
  delay 
}: { 
  title: string; 
  icon: LucideIcon; // Substituído 'any' por 'LucideIcon'
  children: React.ReactNode; 
  delay: number;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
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

const ListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 mb-2">
    <CheckCircle2 size={18} className="text-amber-500 mt-1 shrink-0" />
    <span>{children}</span>
  </li>
);

const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-950 min-h-screen font-sans relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
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
              <Shield size={14} />
              <span>Segurança e Transparência</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Política de Privacidade
            </h1>
            <p className="text-gray-400">
              Última atualização: <span className="text-gray-200 font-semibold">04 de agosto de 2025</span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-12 shadow-2xl">
          
          <div className="prose prose-invert prose-lg max-w-none">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 mb-12 leading-relaxed border-l-4 border-amber-500 pl-6 italic"
            >
              A sua privacidade é importante para nós. É política da Stylo respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar na nossa plataforma.
            </motion.p>

            <Section title="1. Informações que Coletamos" icon={FileText} delay={0.1}>
              <p>Coletamos informações que você nos fornece diretamente, como quando cria uma conta, preenche um formulário ou se comunica conosco:</p>
              <ul className="list-none pl-0 space-y-2 mt-4">
                <ListItem><strong>Informações da Conta:</strong> Nome, endereço de e-mail, número de telefone e senha.</ListItem>
                <ListItem><strong>Perfil do Profissional:</strong> Nome do negócio, endereço, serviços oferecidos, preços e horários.</ListItem>
                <ListItem><strong>Agendamento:</strong> Dados sobre os serviços que você agenda na plataforma.</ListItem>
                <ListItem><strong>Pagamento:</strong> Processamos via parceiros seguros (Stripe/Pagar.me). Não armazenamos seu cartão completo.</ListItem>
              </ul>
            </Section>

            <Section title="2. Como Usamos Seus Dados" icon={RefreshCcw} delay={0.2}>
              <p>Usamos as informações para operar e melhorar a nossa plataforma. Os usos incluem:</p>
              <ul className="list-none pl-0 space-y-2 mt-4">
                <ListItem>Facilitar agendamentos e comunicação entre Clientes e Profissionais.</ListItem>
                <ListItem>Processar transações e enviar faturas/recibos.</ListItem>
                <ListItem>Enviar notificações técnicas, alertas de segurança e atualizações.</ListItem>
                <ListItem>Personalizar sua experiência e analisar tendências de uso.</ListItem>
              </ul>
            </Section>

            <Section title="3. Compartilhamento" icon={Share2} delay={0.3}>
              <p>Não vendemos suas informações. Compartilhamos apenas nas seguintes circunstâncias:</p>
              <ul className="list-none pl-0 space-y-2 mt-4">
                <ListItem><strong>Entre Usuários:</strong> Dados necessários para o agendamento (ex: nome do cliente para o barbeiro).</ListItem>
                <ListItem><strong>Prestadores de Serviço:</strong> Parceiros que nos ajudam a operar (ex: gateway de pagamento).</ListItem>
                <ListItem><strong>Legal:</strong> Se exigido por lei ou processo judicial.</ListItem>
              </ul>
            </Section>

            <Section title="4. Segurança dos Dados" icon={Lock} delay={0.4}>
              <p>
                Empregamos medidas de segurança de nível bancário, incluindo criptografia SSL e proteção contra ataques DDoS, 
                para proteger suas informações contra acesso não autorizado. Embora nenhum sistema seja 100% infalível, 
                nossa equipe de segurança trabalha 24/7 para manter seus dados seguros.
              </p>
            </Section>

            <Section title="5. Seus Direitos" icon={Eye} delay={0.5}>
              <p>
                Você tem controle total sobre seus dados. Você pode acessar, corrigir ou excluir suas informações 
                diretamente pelo painel de configurações da conta. Se desejar exportar seus dados ou solicitar exclusão total, 
                nossa equipe de suporte está pronta para ajudar.
              </p>
            </Section>

            <Section title="6. Cookies" icon={Cookie} delay={0.6}>
              <p>
                Usamos cookies essenciais para manter você logado e cookies analíticos para entender como melhorar a plataforma. 
                Você pode gerenciar suas preferências de cookies nas configurações do seu navegador a qualquer momento.
              </p>
            </Section>

            <Section title="7. Contato" icon={Mail} delay={0.7}>
              <p>
                Se tiver alguma dúvida sobre como tratamos seus dados, não hesite em nos contatar.
                Estamos à disposição através do canal oficial:
              </p>
              <div className="mt-4 p-4 bg-gray-800 rounded-lg inline-block border border-gray-700">
                <a href="mailto:contato@stylo.app.br" className="text-amber-500 font-bold hover:text-amber-400 hover:underline flex items-center gap-2">
                  <Mail size={18} /> contato@stylo.app.br
                </a>
              </div>
            </Section>

          </div>
        </div>
        
        <div className="text-center mt-12 pb-8 text-gray-500 text-sm">
          © {new Date().getFullYear()} Stylo Inc. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
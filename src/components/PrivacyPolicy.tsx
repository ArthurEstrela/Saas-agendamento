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
  Check,
  type LucideIcon
} from 'lucide-react';

// Componente de Seção Reutilizável com Design Premium
const Section = ({ 
  title, 
  icon: Icon, 
  children, 
  index 
}: { 
  title: string; 
  icon: LucideIcon; 
  children: React.ReactNode; 
  index: number;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="mb-12 last:mb-0 group"
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 rounded-xl bg-gray-900/50 text-amber-500 border border-white/5 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-all duration-300 shadow-lg shadow-black/20">
        <Icon size={24} />
      </div>
      <h2 className="text-2xl font-bold text-gray-100 group-hover:text-white transition-colors">
        {title}
      </h2>
    </div>
    <div className="pl-0 md:pl-[4.5rem] text-gray-400 leading-relaxed space-y-4 text-lg font-light">
      {children}
    </div>
  </motion.div>
);

const ListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 mb-3">
    <div className="mt-1.5 p-0.5 rounded-full bg-amber-500/20 text-amber-500 shrink-0">
        <Check size={12} strokeWidth={3} />
    </div>
    <span className="text-gray-300">{children}</span>
  </li>
);

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none opacity-30"></div>
      </div>

      {/* --- HEADER --- */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/5 bg-gray-950/50 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-8 hover:bg-amber-500/20 transition-colors cursor-default">
              <Shield size={12} />
              Segurança & Transparência
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-white">
              Política de <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700">
                Privacidade
              </span>
            </h1>
            
            <p className="text-gray-400 text-sm uppercase tracking-widest">
              Última atualização: <span className="text-white font-semibold">04 de agosto de 2025</span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* --- CONTEÚDO --- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 sm:p-16 shadow-2xl">
          
          {/* Introdução */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-16 p-8 bg-gray-950/50 rounded-2xl border border-white/5"
          >
            <p className="text-xl text-gray-300 leading-relaxed italic text-center font-light">
              "A sua privacidade é inegociável para nós. É política da Stylo respeitar e proteger qualquer informação sua que possamos coletar."
            </p>
          </motion.div>

          <Section title="1. Informações que Coletamos" icon={FileText} index={1}>
            <p>Coletamos informações essenciais para fornecer a melhor experiência possível:</p>
            <ul className="mt-4">
              <ListItem><strong>Informações da Conta:</strong> Nome, email, telefone e credenciais de acesso.</ListItem>
              <ListItem><strong>Dados Profissionais:</strong> Detalhes do seu negócio, serviços, preços e agenda.</ListItem>
              <ListItem><strong>Uso da Plataforma:</strong> Dados de agendamentos e interações com clientes.</ListItem>
              <ListItem><strong>Transações:</strong> Processadas via Stripe/Pagar.me. Não armazenamos números completos de cartão.</ListItem>
            </ul>
          </Section>

          <Section title="2. Como Usamos Seus Dados" icon={RefreshCcw} index={2}>
            <p>Cada dado coletado tem um propósito específico para melhorar sua gestão:</p>
            <ul className="mt-4">
              <ListItem>Operacionalizar agendamentos entre você e seus clientes.</ListItem>
              <ListItem>Processar pagamentos de forma segura e automática.</ListItem>
              <ListItem>Enviar lembretes automáticos (WhatsApp/Email) para reduzir faltas.</ListItem>
              <ListItem>Melhorar nossos algoritmos e funcionalidades da plataforma.</ListItem>
            </ul>
          </Section>

          <Section title="3. Compartilhamento" icon={Share2} index={3}>
            <p>Seus dados são seus. Não vendemos informações para terceiros. O compartilhamento ocorre apenas:</p>
            <ul className="mt-4">
              <ListItem><strong>No Agendamento:</strong> Dados necessários para identificar o cliente ao profissional.</ListItem>
              <ListItem><strong>Infraestrutura:</strong> Com parceiros de nuvem e pagamento (ex: Google Cloud, Stripe).</ListItem>
              <ListItem><strong>Obrigação Legal:</strong> Apenas se estritamente exigido por ordem judicial.</ListItem>
            </ul>
          </Section>

          <Section title="4. Segurança de Nível Bancário" icon={Lock} index={4}>
            <p>
              Utilizamos criptografia SSL/TLS em todas as comunicações. Nossos bancos de dados são protegidos por
              firewalls avançados e backups diários. Monitoramos atividades suspeitas 24/7 para garantir que seu negócio nunca pare.
            </p>
          </Section>

          <Section title="5. Seus Direitos" icon={Eye} index={5}>
            <p>
              Você está no controle. A qualquer momento, através do painel, você pode:
            </p>
            <ul className="mt-4">
              <ListItem>Visualizar e exportar todos os seus dados.</ListItem>
              <ListItem>Corrigir informações imprecisas.</ListItem>
              <ListItem>Solicitar a exclusão total da sua conta e dados associados.</ListItem>
            </ul>
          </Section>

          <Section title="6. Cookies & Rastreamento" icon={Cookie} index={6}>
            <p>
              Utilizamos cookies essenciais para manter sua sessão segura e cookies analíticos anônimos
              para entender como melhorar a performance do sistema. Você pode gerenciar isso no seu navegador.
            </p>
          </Section>

          <Section title="7. Fale com o DPO" icon={Mail} index={7}>
            <p>
              Temos um encarregado de proteção de dados pronto para tirar suas dúvidas.
            </p>
            <div className="mt-6 inline-block">
              <a href="mailto:contato@stylo.app.br" className="flex items-center gap-3 px-6 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-amber-500/50 rounded-xl transition-all group">
                <div className="p-2 bg-gray-900 rounded-lg text-amber-500 group-hover:text-white transition-colors">
                   <Mail size={20} /> 
                </div>
                <span className="text-gray-200 font-medium group-hover:text-white">contato@stylo.app.br</span>
              </a>
            </div>
          </Section>

        </div>
        
        <div className="text-center mt-16 text-gray-600 text-sm">
          © {new Date().getFullYear()} Stylo Inc. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
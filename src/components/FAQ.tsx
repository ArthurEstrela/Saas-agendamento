// src/components/FAQ.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, Sparkles, MessageCircle } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick, index }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`group rounded-2xl border transition-all duration-300 ${
        isOpen 
          ? 'bg-gray-900/60 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.05)]' 
          : 'bg-gray-900/20 border-white/5 hover:border-white/10 hover:bg-gray-900/40'
      }`}
    >
      <button
        onClick={onClick}
        className="w-full flex justify-between items-center py-6 px-6 sm:px-8 text-left focus:outline-none"
      >
        <span className={`text-lg font-medium transition-colors duration-300 pr-8 ${
          isOpen ? 'text-white' : 'text-gray-300 group-hover:text-white'
        }`}>
          {question}
        </span>
        <span className="flex-shrink-0 relative">
          {/* Ícone Animado */}
          <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 group-hover:bg-white/10'}`}>
             {isOpen ? <Minus size={18} /> : <Plus size={18} />}
          </div>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }} // Curva de Bezier suave
            className="overflow-hidden"
          >
            <div className="px-6 sm:px-8 pb-8 pt-0">
              <p className="text-base text-gray-400 leading-relaxed font-light">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqData = [
    {
      question: 'O que é a Stylo?',
      answer: 'A Stylo é uma plataforma SaaS (Software as a Service) premium desenhada para revolucionar a gestão de negócios de beleza. Simplificamos agendamentos, gestão financeira e relacionamento com clientes para salões, barbearias e spas, tudo em um único lugar.'
    },
    {
      question: 'Como funciona o agendamento online?',
      answer: 'Você recebe uma página exclusiva (ex: stylo.app/seu-salao). Seus clientes acessam esse link via Instagram ou WhatsApp, visualizam sua disponibilidade em tempo real e agendam sozinhos em segundos, 24 horas por dia.'
    },
    {
      question: 'Posso testar a plataforma antes de assinar?',
      answer: 'Com certeza! Oferecemos 15 dias de teste totalmente gratuitos com acesso ilimitado a todas as funcionalidades premium. Você só decide se quer continuar após conhecer o valor que entregamos.'
    },
    {
      question: 'Os lembretes automáticos realmente funcionam?',
      answer: 'Sim! Nossa taxa de redução de faltas (no-show) chega a 80%. O sistema envia lembretes automáticos via WhatsApp e E-mail, garantindo que seu cliente não esqueça do compromisso.'
    },
    {
      question: 'A Stylo processa pagamentos?',
      answer: 'Sim. Integramos com gateways seguros para permitir pagamentos antecipados (sinal) ou total via Pix e Cartão de Crédito. O dinheiro vai direto para sua conta, garantindo segurança e previsibilidade.'
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Segurança é nossa prioridade número um. Utilizamos criptografia de nível bancário e servidores de alta segurança para blindar todas as informações do seu negócio e dos seus clientes.'
    },
    {
      question: 'Existe multa de cancelamento?',
      answer: 'Não. Acreditamos na liberdade. Você pode cancelar sua assinatura a qualquer momento através do seu painel, sem burocracia, sem multas e sem letras miúdas.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none opacity-30"></div>
      </div>

      <div className="max-w-4xl mx-auto py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-6 hover:bg-amber-500/20 transition-colors cursor-default"
          >
            <HelpCircle size={12} />
            Central de Ajuda
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4"
          >
            Perguntas Frequentes
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto font-light"
          >
            Tudo o que você precisa saber sobre a revolução na gestão do seu negócio.
          </motion.p>
        </div>

        {/* --- LISTA DE FAQ --- */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <FAQItem 
              key={index} 
              index={index}
              question={item.question} 
              answer={item.answer} 
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </div>

        {/* --- FOOTER CTA --- */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-block p-6 rounded-2xl bg-gray-900/40 border border-white/5 backdrop-blur-sm">
            <p className="text-gray-400 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm">
              <span className="flex items-center gap-2">
                <Sparkles className="text-amber-500" size={16} /> Ainda tem dúvidas?
              </span>
              <a 
                href="mailto:contato@stylo.app.br" 
                className="font-bold text-white hover:text-amber-500 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5"
              >
                <MessageCircle size={16} /> Falar com o suporte
              </a>
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default FAQ;
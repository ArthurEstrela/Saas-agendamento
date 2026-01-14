// src/components/FAQ.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, Sparkles, MessageCircle } from 'lucide-react';
import { cn } from "../lib/utils/cn"; // Utilitário de classes recomendado

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
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4 }} // Delay limitado para não demorar em listas longas
      className={cn(
        "group rounded-xl md:rounded-2xl border transition-all duration-200 overflow-hidden",
        // Mobile: Fundo sólido (Performance) | Desktop: Efeitos visuais
        isOpen 
          ? "bg-[#18181b] border-amber-500/30 md:bg-gray-900/60 md:shadow-[0_0_30px_rgba(245,158,11,0.05)]" 
          : "bg-[#0c0c0e] border-white/5 hover:border-white/10 md:bg-gray-900/20 md:hover:bg-gray-900/40"
      )}
    >
      <button
        onClick={onClick}
        className="w-full flex justify-between items-center py-4 px-5 sm:py-6 sm:px-8 text-left focus:outline-none touch-manipulation"
      >
        <span className={cn(
          "text-base md:text-lg font-medium transition-colors duration-200 pr-4 md:pr-8 leading-snug",
          isOpen ? "text-white" : "text-gray-300 group-hover:text-white"
        )}>
          {question}
        </span>
        <span className="flex-shrink-0 relative ml-2">
          {/* Ícone Animado */}
          <div className={cn(
            "p-1.5 md:p-2 rounded-full transition-all duration-200",
            isOpen ? "bg-amber-500 text-black" : "bg-white/5 text-gray-400 group-hover:bg-white/10"
          )}>
             {isOpen ? <Minus size={16} className="md:w-[18px] md:h-[18px]" /> : <Plus size={16} className="md:w-[18px] md:h-[18px]" />}
          </div>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }} // Animação mais rápida
            className="overflow-hidden will-change-[height,opacity]" // Dica de performance
          >
            <div className="px-5 pb-6 pt-0 sm:px-8 sm:pb-8">
              <p className="text-sm md:text-base text-gray-400 leading-relaxed font-light">
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
      answer: 'A Stylo é uma plataforma SaaS premium desenhada para revolucionar a gestão de negócios de beleza. Simplificamos agendamentos, gestão financeira e relacionamento com clientes.'
    },
    {
      question: 'Como funciona o agendamento online?',
      answer: 'Você recebe uma página exclusiva (ex: stylo.app/seu-salao). Seus clientes acessam esse link, visualizam sua disponibilidade em tempo real e agendam sozinhos em segundos.'
    },
    {
      question: 'Posso testar a plataforma antes de assinar?',
      answer: 'Com certeza! Oferecemos 15 dias de teste totalmente gratuitos com acesso ilimitado a todas as funcionalidades premium.'
    },
    {
      question: 'Os lembretes automáticos realmente funcionam?',
      answer: 'Sim! Nossa taxa de redução de faltas (no-show) chega a 80%. O sistema envia lembretes automáticos via WhatsApp e E-mail.'
    },
    {
      question: 'A Stylo processa pagamentos?',
      answer: 'Sim. Integramos com gateways seguros para permitir pagamentos via Pix e Cartão de Crédito. O dinheiro vai direto para sua conta.'
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Segurança é nossa prioridade. Utilizamos criptografia de nível bancário e servidores de alta segurança para blindar todas as informações.'
    },
    {
      question: 'Existe multa de cancelamento?',
      answer: 'Não. Você pode cancelar sua assinatura a qualquer momento através do seu painel, sem burocracia e sem multas.'
    }
  ];

  return (
    // Fundo consistente otimizado
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">
      
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Padrão de Grade (Leve) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Mobile: Gradiente Estático (Rápido) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden opacity-90" />
        
        {/* Desktop: Blurs Ricos */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none opacity-30"></div>
      </div>

      <div className="max-w-4xl mx-auto py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-6 hover:bg-amber-500/20 transition-colors cursor-default"
          >
            <HelpCircle size={12} />
            Central de Ajuda
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight"
          >
            Perguntas Frequentes
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto font-light px-2"
          >
            Tudo o que você precisa saber sobre a revolução na gestão do seu negócio.
          </motion.p>
        </div>

        {/* --- LISTA DE FAQ --- */}
        <div className="space-y-3 md:space-y-4">
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
          transition={{ delay: 0.3 }}
          className="mt-12 md:mt-16 text-center"
        >
          <div className="inline-block p-5 md:p-6 rounded-2xl bg-[#18181b] md:bg-gray-900/40 border border-white/5 md:backdrop-blur-sm shadow-lg">
            <p className="text-gray-400 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs md:text-sm">
              <span className="flex items-center gap-2">
                <Sparkles className="text-amber-500" size={14} /> Ainda tem dúvidas?
              </span>
              <a 
                href="mailto:contato@stylo.app.br" 
                className="font-bold text-white hover:text-amber-500 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 touch-manipulation"
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
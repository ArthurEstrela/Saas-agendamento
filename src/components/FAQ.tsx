// src/components/FAQ.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

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
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`border-b border-gray-800 transition-colors duration-300 ${isOpen ? 'bg-gray-900/30' : 'hover:bg-gray-900/20'}`}
    >
      <dt>
        <button
          onClick={onClick}
          className="w-full flex justify-between items-center py-6 px-4 text-left focus:outline-none group"
        >
          <span className={`text-lg font-medium transition-colors duration-300 ${isOpen ? 'text-amber-500' : 'text-gray-200 group-hover:text-amber-400'}`}>
            {question}
          </span>
          <span className="ml-6 flex-shrink-0">
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className={`p-1 rounded-full ${isOpen ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'}`}
            >
              <ChevronDown size={20} />
            </motion.div>
          </span>
        </button>
      </dt>
      <AnimatePresence>
        {isOpen && (
          <motion.dd
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-6 text-base text-gray-400 leading-relaxed border-l-2 border-amber-500/20 ml-4 mb-2">
              {answer}
            </p>
          </motion.dd>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ = () => {
  // Estado para permitir apenas um aberto por vez (accordion behavior)
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqData = [
    {
      question: 'O que é a Stylo?',
      answer: 'A Stylo é uma plataforma SaaS (Software as a Service) premium desenhada para revolucionar a gestão de negócios de beleza. Simplificamos agendamentos, gestão financeira e relacionamento com clientes para salões, barbearias e spas.'
    },
    {
      question: 'Como funciona o agendamento online?',
      answer: 'Você recebe uma página exclusiva e personalizada. Seus clientes acessam esse link (via Instagram, WhatsApp, etc.), veem sua disponibilidade em tempo real e agendam sozinhos em segundos, 24/7.'
    },
    {
      question: 'Posso testar a plataforma antes de assinar?',
      answer: 'Com certeza! Oferecemos um período de teste gratuito com acesso total a todas as funcionalidades premium. Sem necessidade de cartão de crédito para começar.'
    },
    {
      question: 'Os lembretes automáticos realmente funcionam?',
      answer: 'Sim! Nossa taxa de redução de faltas (no-show) chega a 80%. O sistema envia lembretes automáticos via WhatsApp e E-mail, garantindo que seu cliente não esqueça do compromisso.'
    },
    {
      question: 'A Stylo processa pagamentos?',
      answer: 'Sim. Integramos com gateways seguros para permitir pagamentos antecipados (sinal) ou total via Pix e Cartão de Crédito, garantindo seu faturamento mesmo se o cliente cancelar.'
    },
    {
      question: 'Meus dados e dos meus clientes estão seguros?',
      answer: 'Segurança é inegociável para nós. Utilizamos criptografia de ponta a ponta e servidores de alta segurança para blindar todas as informações do seu negócio.'
    },
    {
      question: 'Existe fidelidade ou multa de cancelamento?',
      answer: 'Não acreditamos em prender clientes. Você tem total liberdade para cancelar sua assinatura a qualquer momento através do painel, sem burocracia ou letras miúdas.'
    }
  ];

  return (
    <div className="bg-gray-950 min-h-screen relative overflow-hidden font-sans">
      
      {/* Background Decorativo (Glow) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto py-20 px-4 sm:py-24 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header da Seção */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-amber-500 text-sm font-medium mb-4"
          >
            <HelpCircle size={16} />
            <span>Tira-Dúvidas</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-white sm:text-5xl tracking-tight"
          >
            Perguntas Frequentes
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-xl text-gray-400"
          >
            Tudo o que você precisa saber sobre a revolução na gestão do seu negócio.
          </motion.p>
        </div>

        {/* Lista de FAQ */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <dl>
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
          </dl>
        </div>

        {/* Footer CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 flex items-center justify-center gap-2">
            Ainda tem dúvidas? 
            <a 
              href="mailto:contato@stylo.app.br" 
              className="font-bold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1 hover:underline"
            >
              <MessageCircle size={18} /> Falar com o suporte
            </a>
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default FAQ;
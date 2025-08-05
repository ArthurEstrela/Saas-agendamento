// src/components/FAQ.tsx
import React, { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-700 py-6">
      <dt>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-start text-left text-gray-300"
        >
          <span className="text-lg font-medium text-white">{question}</span>
          <span className="ml-6 h-7 flex items-center">
            <svg
              className={`h-6 w-6 transform transition-transform duration-300 ${isOpen ? '-rotate-180' : 'rotate-0'}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>
      </dt>
      <dd className={`mt-2 pr-12 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <p className="text-base text-gray-400 pt-4">{answer}</p>
      </dd>
    </div>
  );
};

const FAQ = () => {
    const faqData = [
        {
          question: 'O que é a Stylo?',
          answer: 'A Stylo é uma plataforma de software como serviço (SaaS) desenhada para simplificar a gestão e o agendamento de negócios na área da beleza e bem-estar, como salões, barbearias, estúdios de estética e spas.'
        },
        {
          question: 'Como funciona o agendamento online?',
          answer: 'Após se registar como profissional, você recebe uma página de agendamento online exclusiva. Os seus clientes podem aceder a esta página, ver a sua disponibilidade em tempo real e marcar um horário diretamente, 24 horas por dia, 7 dias por semana.'
        },
        {
          question: 'Posso testar a plataforma antes de assinar?',
          answer: 'Sim! Oferecemos um período de teste gratuito para que você possa explorar todas as funcionalidades da Stylo sem compromisso. Basta registar-se para começar.'
        },
        {
          question: 'Que tipo de notificações a plataforma envia?',
          answer: 'A plataforma envia notificações automáticas via WhatsApp e e-mail para si e para os seus clientes, confirmando novos agendamentos, lembretes de horários e notificações de cancelamento, ajudando a reduzir o número de faltas.'
        },
        {
          question: 'A Stylo processa pagamentos?',
          answer: 'Sim, integramos com gateways de pagamento seguros para permitir que os seus clientes paguem pelos serviços no momento do agendamento, se assim o desejar. Isto pode ajudar a garantir o compromisso do cliente.'
        },
        {
          question: 'É seguro armazenar os dados dos meus clientes na Stylo?',
          answer: 'A segurança é a nossa prioridade. Usamos encriptação de ponta e seguimos as melhores práticas de segurança de dados para garantir que todas as informações dos seus clientes e do seu negócio estejam sempre protegidas.'
        },
        {
            question: 'Posso cancelar a minha assinatura a qualquer momento?',
            answer: 'Sim, você tem total controlo sobre a sua assinatura. Pode cancelar a qualquer momento, sem taxas de cancelamento ou complicações. O seu acesso permanecerá ativo até ao final do período de faturação já pago.'
        }
      ];

  return (
    <div className="bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-3xl font-extrabold text-white sm:text-4xl">Perguntas Frequentes</h2>
          <p className="text-center mt-4 text-lg text-gray-400">Não consegue encontrar a resposta que procura? Entre em <a href="mailto:suporte@stylo.com" className="font-medium text-yellow-500 hover:text-yellow-400">contato</a> com a nossa equipa.</p>
          <dl className="mt-12 space-y-2">
            {faqData.map((item, index) => (
              <FAQItem key={index} question={item.question} answer={item.answer} />
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

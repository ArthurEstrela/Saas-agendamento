// src/components/Pricing.tsx
import React from "react";

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-amber-500- mr-2 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 13l4 4L19 7"
    ></path>
  </svg>
);

const Pricing = () => {
  return (
    <section
      id="pricing"
      className="bg-gradient-to-b from-gray-900 to-gray-800 py-20 px-4"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Título da Seção */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Planos flexíveis para o seu negócio
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Escolha a opção ideal para você e comece a organizar sua agenda hoje
            mesmo.
          </p>
        </div>

        {/* Grid de Planos - Agora com 3 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Plano 1: Mensal */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 flex flex-col h-full hover:border-gray-600 transition-colors duration-300">
            <h3 className="text-xl font-semibold text-white mb-2">Mensal</h3>
            <p className="text-gray-400 mb-6">
              Ideal para começar sem compromisso.
            </p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-white">R$49</span>
              <span className="text-lg font-medium text-gray-300">,90/mês</span>
            </div>
            <p className="text-xs text-gray-500 mb-8">Cobrado mensalmente</p>

            <ul className="space-y-4 text-gray-300 mb-8 flex-grow">
              <li className="flex items-center">
                <CheckIcon />
                Agendamentos Ilimitados
              </li>
              <li className="flex items-center">
                <CheckIcon />
                Cadastro de Clientes
              </li>
              <li className="flex items-center">
                <CheckIcon />
                Página de Agendamento
              </li>
            </ul>

            <button className="w-full bg-gray-700 text-white font-semibold py-3 rounded-lg hover:bg-gray-600 transition-colors duration-300">
              Começar agora
            </button>
          </div>

          {/* Plano 2: Trimestral (DESTAQUE) */}
          <div className="bg-gray-800 rounded-2xl p-8 flex flex-col h-full relative border-2 border-amber-500 shadow-2xl shadow-amber-500/10 transform scale-105 z-10">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
              Mais Popular
            </span>
            <h3 className="text-xl font-semibold text-white mb-2">Trimestral</h3>
            <p className="text-amber-300 mb-6">
              O equilíbrio perfeito para crescer.
            </p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-white">R$45</span>
              <span className="text-xl font-medium text-gray-300">,00/mês</span>
            </div>
            <p className="text-xs text-gray-500 mb-8">
              R$ 135,00 a cada 3 meses
            </p>

            <ul className="space-y-4 text-gray-300 mb-8 flex-grow">
              <li className="flex items-center">
                <CheckIcon />
                <strong>Tudo do Mensal</strong>
              </li>
              <li className="flex items-center">
                <CheckIcon />
                Notificações via WhatsApp
              </li>
              <li className="flex items-center">
                <CheckIcon />
                Suporte Prioritário
              </li>
              <li className="flex items-center">
                <CheckIcon />
                Relatórios de Desempenho
              </li>
            </ul>

            <button className="w-full bg-amber-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-amber-400 transition-colors duration-300 shadow-lg shadow-amber-500/25">
              Assinar agora
            </button>
          </div>

          {/* Plano 3: Anual */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 flex flex-col h-full hover:border-gray-600 transition-colors duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold text-white">Anual</h3>
              <span className="bg-green-500/20 text-green-300 text-[10px] font-bold px-2 py-1 rounded-full">
                ECONOMIA MÁXIMA
              </span>
            </div>
            <p className="text-gray-400 mb-6">
              Para quem pensa no longo prazo.
            </p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-white">R$39</span>
              <span className="text-lg font-medium text-gray-300">,00/mês</span>
            </div>
            <p className="text-xs text-gray-500 mb-8">R$ 468,00 anualmente</p>

            <ul className="space-y-4 text-gray-300 mb-8 flex-grow">
              <li className="flex items-center">
                <CheckIcon />
                <strong>Tudo do Trimestral</strong>
              </li>
              <li className="flex items-center">
                <CheckIcon />
                Domínio Personalizado
              </li>
              <li className="flex items-center">
                <CheckIcon />
                Consultoria de Configuração
              </li>
            </ul>

            <button className="w-full bg-gray-700 text-white font-semibold py-3 rounded-lg hover:bg-gray-600 transition-colors duration-300">
              Assinar anual
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

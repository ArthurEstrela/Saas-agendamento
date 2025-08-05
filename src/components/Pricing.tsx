// src/components/Pricing.tsx
import React from 'react';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const Pricing = () => {
  return (
    <section id="pricing" className="bg-gradient-to-b from-gray-900 to-gray-800 py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        
        {/* Título da Seção */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Planos flexíveis que impulsionam o seu negócio
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Escolha a opção ideal para você e comece a organizar sua agenda hoje mesmo.
          </p>
        </div>

        {/* Grid de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">

          {/* Plano 1: Mensal */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 flex flex-col h-full transform hover:scale-105 transition-transform duration-300">
            <h3 className="text-xl font-semibold text-white mb-2">Mensal</h3>
            <p className="text-gray-400 mb-6 flex-grow">Ideal para começar.</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-white">R$49</span>
              <span className="text-xl font-medium text-gray-300">,90/mês</span>
            </div>
            <p className="text-xs text-gray-500 mb-8">Cobrado mensalmente</p>
            <ul className="space-y-4 text-gray-300 mb-10">
              <li className="flex items-center"><CheckIcon />Agendamentos Ilimitados</li>
              <li className="flex items-center"><CheckIcon />Cadastro de Clientes</li>
              <li className="flex items-center"><CheckIcon />Página de Agendamento</li>
            </ul>
            <button className="w-full mt-auto bg-gray-700 text-white font-semibold py-3 rounded-lg hover:bg-amber-500 hover:text-gray-900 transition-colors duration-300">
              Começar agora
            </button>
          </div>

          {/* Plano 2: Trimestral */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 flex flex-col h-full transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold text-white">Trimestral</h3>
              <span className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full">ECONOMIZE 10%</span>
            </div>
            <p className="text-gray-400 mb-6 flex-grow">Mais flexibilidade.</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-white">R$44</span>
              <span className="text-xl font-medium text-gray-300">,90/mês</span>
            </div>
            <p className="text-xs text-gray-500 mb-8">Cobrado R$ 134,70 a cada 3 meses</p>
            <ul className="space-y-4 text-gray-300 mb-10">
                <li className="flex items-center"><CheckIcon />Agendamentos Ilimitados</li>
                <li className="flex items-center"><CheckIcon />Cadastro de Clientes</li>
                <li className="flex items-center"><CheckIcon />Página de Agendamento</li>
            </ul>
            <button className="w-full mt-auto bg-gray-700 text-white font-semibold py-3 rounded-lg hover:bg-amber-500 hover:text-gray-900 transition-colors duration-300">
              Assinar plano
            </button>
          </div>

          {/* Plano 3: Semestral (MAIS POPULAR) */}
          <div className="bg-gray-800 rounded-2xl p-8 flex flex-col h-full relative border-2 gradient-border scale-105 shadow-2xl shadow-amber-500/10">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Mais Popular</span>
            <h3 className="text-xl font-semibold text-white mb-2">Semestral</h3>
            <p className="text-amber-300 mb-6 flex-grow">O equilíbrio perfeito.</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-white">R$39</span>
              <span className="text-xl font-medium text-gray-300">,90/mês</span>
            </div>
            <p className="text-xs text-gray-500 mb-8">Cobrado R$ 239,40 a cada 6 meses</p>
            <ul className="space-y-4 text-gray-300 mb-10">
              <li className="flex items-center"><CheckIcon />Agendamentos Ilimitados</li>
              <li className="flex items-center"><CheckIcon />Cadastro de Clientes</li>
              <li className="flex items-center"><CheckIcon />Página de Agendamento</li>
              <li className="flex items-center"><CheckIcon />Notificações via WhatsApp</li>
            </ul>
            <button className="w-full mt-auto bg-amber-400 text-gray-900 font-bold py-3 rounded-lg hover:bg-amber-300 transition-colors duration-300">
              Assinar agora
            </button>
          </div>

          {/* Plano 4: Anual */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 flex flex-col h-full transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-white">Anual</h3>
                <span className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full">MELHOR CUSTO-BENEFÍCIO</span>
            </div>
            <p className="text-gray-400 mb-6 flex-grow">Economia máxima.</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-white">R$34</span>
              <span className="text-xl font-medium text-gray-300">,90/mês</span>
            </div>
            <p className="text-xs text-gray-500 mb-8">Cobrado R$ 418,80 anualmente</p>
            <ul className="space-y-4 text-gray-300 mb-10">
                <li className="flex items-center"><CheckIcon />Agendamentos Ilimitados</li>
                <li className="flex items-center"><CheckIcon />Cadastro de Clientes</li>
                <li className="flex items-center"><CheckIcon />Página de Agendamento</li>
                <li className="flex items-center"><CheckIcon />Notificações via WhatsApp</li>
            </ul>
            <button className="w-full mt-auto bg-gray-700 text-white font-semibold py-3 rounded-lg hover:bg-amber-500 hover:text-gray-900 transition-colors duration-300">
              Assinar plano
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Pricing;

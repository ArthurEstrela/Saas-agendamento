// src/components/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import Pricing from './Pricing';

const Home = () => {
  return (
    <div className="bg-gray-900 text-white">
      {/* Seção Hero */}
      <section className="relative text-center py-20 md:py-32 px-4">
        <div 
          className="absolute inset-0 bg-black opacity-50"
        ></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
            Conectamos clientes e profissionais da beleza.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            A plataforma ideal para agendar o seu próximo horário ou para gerir e impulsionar o seu negócio.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              to="/booking" 
              className="w-full sm:w-auto bg-yellow-500 text-black font-semibold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-transform transform hover:scale-105"
            >
              Quero Agendar
            </Link>
            <a 
              href="#pricing" 
              className="w-full sm:w-auto bg-transparent border-2 border-gray-500 text-gray-300 font-semibold px-8 py-3 rounded-lg hover:bg-gray-700 hover:border-gray-700 transition"
            >
              Sou Profissional
            </a>
          </div>
        </div>
      </section>

      {/* Seção de Funcionalidades (focada nos profissionais) */}
      <section id="features" className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Tudo que o seu negócio precisa em um só lugar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold text-yellow-400">Agenda Inteligente</h3>
              <p className="mt-4 text-gray-400">Visualize todos os seus compromissos, gerencie horários e evite conflitos com facilidade.</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold text-yellow-400">Página Pública</h3>
              <p className="mt-4 text-gray-400">Seus clientes podem agendar horários online 24/7 através de um link exclusivo para o seu negócio.</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold text-yellow-400">Gestão Financeira</h3>
              <p className="mt-4 text-gray-400">Acompanhe seu faturamento, despesas e veja relatórios de desempenho por profissional e serviço.</p>
            </div>
          </div>
        </div>
      </section>

      <Pricing />

    </div>
  );
};

export default Home;

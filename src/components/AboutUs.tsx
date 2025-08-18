// src/components/AboutUs.tsx
import React from "react";

const teamMembers = [
  {
    name: "Arthur Estrela",
    role: "CEO & Fundador",
    imageUrl: "https://placehold.co/400x400/1F2937/FFFFFF?text=AE",
    bio: "Apaixonado por tecnologia e beleza, Arthur fundou a Stylo para revolucionar a gestão de negócios no setor.",
  },
  {
    name: "Sávio Issa",
    role: "Diretora de Tecnologia (CTO)",
    imageUrl: "https://placehold.co/400x400/1F2937/FFFFFF?text=SL",
    bio: "Comanda a nossa equipa de engenharia, garantindo que a plataforma seja robusta, segura e inovadora.",
  },
];

const AboutUs = () => {
  return (
    <div className="bg-gray-900 text-white">
      {/* Seção Hero */}
      <div className="relative bg-gray-800 py-20 sm:py-28">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
            A nossa missão é o seu sucesso.
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-300">
            Nascemos da paixão por simplificar. Acreditamos que, com as
            ferramentas certas, todo o profissional de beleza pode prosperar,
            focando no que realmente importa: a arte de transformar e cuidar.
          </p>
        </div>
      </div>

      {/* Seção de Conteúdo */}
      <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-invert prose-lg text-gray-300 mx-auto">
            <h2 className="text-3xl font-bold text-white">A nossa história</h2>
            <p>
              A Stylo começou com uma observação simples: profissionais
              talentosos da área da beleza gastavam demasiado tempo com tarefas
              administrativas e perdiam clientes por falta de um sistema de
              agendamento eficiente. Decidimos mudar essa realidade.
            </p>
            <p>
              Reunimos uma equipa de especialistas em tecnologia e design, e
              trabalhámos lado a lado com donos de salões e barbearias para
              construir uma solução que realmente atendesse às suas
              necessidades. Hoje, orgulhamo-nos de oferecer uma plataforma que
              não só organiza a agenda, mas também impulsiona o crescimento dos
              nossos parceiros.
            </p>
            <blockquote className="border-l-4 border-yellow-500 pl-4">
              "Queremos ser mais do que um software. Queremos ser o parceiro
              estratégico que ajuda cada negócio de beleza a atingir o seu
              máximo potencial."
            </blockquote>
          </div>
        </div>
      </div>

      {/* Seção da Equipa */}
      <div className="bg-gray-800/50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">
              A equipe por detrás da Stylo
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Pessoas dedicadas a construir o futuro da gestão de beleza.
            </p>
          </div>
          <div className="mt-12 grid gap-12 space-y-0 lg:grid-cols-2 lg:gap-x-8">
            {teamMembers.map((person) => (
              <div
                key={person.name}
                className="flex flex-col items-center text-center"
              >
                <img
                  className="object-cover w-40 h-40 rounded-full"
                  src={person.imageUrl}
                  alt={`Foto de ${person.name}`}
                />
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-white">
                    {person.name}
                  </h3>
                  <p className="text-yellow-400">{person.role}</p>
                  <p className="mt-2 text-base text-gray-400">{person.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;

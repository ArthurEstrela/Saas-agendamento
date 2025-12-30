// src/components/AboutUs.tsx
import React from "react";
import { motion } from "framer-motion";
import { Users, Target, Sparkles, Quote, Linkedin, Github } from "lucide-react";

const teamMembers = [
  {
    name: "Arthur Estrela",
    role: "CEO & Fundador",
    imageUrl: "https://placehold.co/400x400/1F2937/FFFFFF?text=AE",
    bio: "Apaixonado por tecnologia e beleza, Arthur fundou a Stylo para revolucionar a gestão de negócios no setor, trazendo eficiência e modernidade.",
  },
  {
    name: "Sávio Issa",
    role: "Diretor de Tecnologia (CTO)",
    imageUrl: "https://placehold.co/400x400/1F2937/FFFFFF?text=SI", // Corrigi a inicial para SI
    bio: "Comanda a nossa equipa de engenharia, garantindo que a plataforma seja robusta, segura e inovadora, sempre na vanguarda tecnológica.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const AboutUs = () => {
  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen font-sans selection:bg-amber-500/30">
      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden py-24 sm:py-32">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-semibold tracking-wide uppercase mb-6">
              Sobre a Stylo
            </span>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
              A nossa missão é <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
                o seu sucesso.
              </span>
            </h1>
            <p className="mt-8 max-w-3xl mx-auto text-xl text-gray-400 leading-relaxed">
              Nascemos da paixão por simplificar. Acreditamos que, com as
              ferramentas certas, todo o profissional de beleza pode prosperar,
              focando no que realmente importa: <span className="text-gray-100 font-medium">a arte de transformar e cuidar.</span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* --- STORY & VALUES SECTION --- */}
      <div className="py-16 bg-gray-900/30 border-y border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Texto */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-800 rounded-lg text-amber-500">
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-white">A nossa história</h2>
                </div>
                <p className="text-gray-400 text-lg leading-relaxed">
                  A Stylo começou com uma observação simples: profissionais
                  talentosos da área da beleza gastavam demasiado tempo com tarefas
                  administrativas e perdiam clientes por falta de um sistema de
                  agendamento eficiente. Decidimos mudar essa realidade.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp}>
                 <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-800 rounded-lg text-amber-500">
                    <Target size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Nosso Propósito</h2>
                </div>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Reunimos uma equipa de especialistas em tecnologia e design, e
                  trabalhámos lado a lado com donos de salões e barbearias. 
                  Hoje, orgulhamo-nos de oferecer uma plataforma que
                  não só organiza a agenda, mas impulsiona o crescimento.
                </p>
              </motion.div>
            </motion.div>

            {/* Quote Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-12 shadow-2xl">
                <Quote className="text-amber-500/40 w-12 h-12 mb-6" />
                <blockquote className="text-2xl font-medium text-gray-200 leading-snug">
                  "Queremos ser mais do que um software. Queremos ser o parceiro
                  estratégico que ajuda cada negócio de beleza a atingir o seu
                  máximo potencial."
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                   <div className="h-px flex-1 bg-gray-800"></div>
                   <span className="text-amber-500 font-bold tracking-widest text-sm uppercase">Manifesto Stylo</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* --- TEAM SECTION --- */}
      <div className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center justify-center gap-3">
              <Users className="text-amber-500" /> Quem faz acontecer
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Pessoas dedicadas a construir o futuro da gestão de beleza com inovação e empatia.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            {teamMembers.map((person, index) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Avatar com Anel */}
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-amber-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <img
                      className="relative object-cover w-24 h-24 rounded-full border-2 border-gray-800 group-hover:border-amber-500 transition-colors"
                      src={person.imageUrl}
                      alt={`Foto de ${person.name}`}
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      {person.name}
                    </h3>
                    <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
                      {person.role}
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {person.bio}
                    </p>
                    
                    {/* Social Icons (Decorativos) */}
                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-4 text-gray-500">
                        <Github size={18} className="hover:text-white cursor-pointer transition-colors"/>
                        <Linkedin size={18} className="hover:text-white cursor-pointer transition-colors"/>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* --- FOOTER CTA --- */}
      <div className="pb-20 text-center">
        <p className="text-gray-500 text-sm">
            Feito com <span className="text-red-500">❤</span> para empreendedores.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
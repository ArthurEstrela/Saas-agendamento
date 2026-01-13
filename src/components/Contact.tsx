// src/components/Contact.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, MessageSquare, Send, ArrowRight } from 'lucide-react';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    // Simulação de envio
    setTimeout(() => {
      alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      (event.target as HTMLFormElement).reset();
      setIsSubmitting(false);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "contato@stylo.app.br",
      description: "Nossa equipe responde em até 24h."
    },
    {
      icon: MessageSquare,
      title: "Chat Ao Vivo",
      value: "Disponível no Dashboard",
      description: "Fale com especialistas em tempo real."
    },
    {
      icon: MapPin,
      title: "Escritório",
      value: "São Paulo, SP",
      description: "Onde a mágica acontece."
    }
  ];

  return (
    <div className="bg-gray-950 min-h-screen py-24 sm:py-32 relative overflow-hidden font-sans text-gray-100">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-amber-500 font-semibold tracking-wider uppercase text-sm mb-2 block">
            Fale Conosco
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Vamos conversar?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Tem alguma dúvida sobre a plataforma ou quer ser um parceiro? 
            Nossa equipe está pronta para te ouvir.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Lado Esquerdo - Infos */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6">Canais de Atendimento</h3>
              <div className="space-y-8">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex items-start gap-4 group">
                    <div className="p-3 bg-gray-800 rounded-lg text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-gray-300 font-medium">{item.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banner FAQ */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-8 relative overflow-hidden group cursor-pointer hover:border-amber-500/30 transition-colors">
              <div className="relative z-10">
                <h4 className="text-xl font-bold text-white mb-2">Dúvidas Frequentes?</h4>
                <p className="text-gray-400 mb-4 text-sm">
                  Confira nossa central de ajuda para respostas rápidas sobre pagamentos, agenda e conta.
                </p>
                <div className="flex items-center text-amber-500 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  Ir para FAQ <ArrowRight size={16} className="ml-2" />
                </div>
              </div>
              {/* Decor */}
              <MessageSquare className="absolute -bottom-4 -right-4 text-white/5 w-32 h-32 transform rotate-12 group-hover:scale-110 transition-transform duration-500" />
            </div>
          </motion.div>

          {/* Lado Direito - Formulário */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
              {/* Glow Effect Top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>

              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Send size={24} className="text-amber-500" /> Envie uma mensagem
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-300">Nome</label>
                    <input
                      type="text"
                      id="name"
                      required
                      placeholder="Seu nome"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                    <input
                      type="email"
                      id="email"
                      required
                      placeholder="seu@email.com"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-gray-300">Assunto</label>
                    <select
                      id="subject"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
                    >
                      <option>Quero contratar a Stylo</option>
                      <option>Suporte Técnico</option>
                      <option>Parcerias</option>
                      <option>Outro</option>
                    </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-gray-300">Mensagem</label>
                  <textarea
                    id="message"
                    rows={4}
                    required
                    placeholder="Como podemos ajudar?"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-4 rounded-lg shadow-lg shadow-amber-500/20 transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>Enviar Mensagem <Send size={18} /></>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
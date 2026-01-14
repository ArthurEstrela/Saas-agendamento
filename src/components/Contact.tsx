// src/components/Contact.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MapPin,
  MessageSquare,
  Send,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Simulação de envio
    setTimeout(() => {
      setIsSent(true);
      setIsSubmitting(false);
      (event.target as HTMLFormElement).reset();

      // Reset do estado de sucesso após alguns segundos
      setTimeout(() => setIsSent(false), 5000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email",
      value: "contato@stylo.app.br",
      description: "Resposta em até 24h úteis.",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Chat Suporte",
      value: "Disponível no Dashboard",
      description: "Atendimento em tempo real.",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Sede",
      value: "Pires do Rio, GO",
      description: "O coração da nossa operação.",
    },
  ];

  return (
    // Fundo base consistente com o resto do app
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">
      
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Padrão de Grade (Leve) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Mobile: Gradiente Leve (Zero Lag) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden opacity-90" />
        
        {/* Desktop: Blurs Ricos */}
        <div className="hidden md:block absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none opacity-40"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 sm:py-32">
        
        {/* --- HEADER --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-6 hover:bg-amber-500/20 transition-colors cursor-default">
            <Sparkles size={12} />
            Fale Conosco
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-white leading-tight">
            Como podemos <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700">
              ajudar você?
            </span>
          </h1>

          <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed px-4">
            Dúvidas sobre a plataforma, parcerias ou apenas um "oi". Nossa
            equipe está pronta para te ouvir.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          
          {/* --- LEFT COLUMN: INFO --- */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6 md:space-y-8"
          >
            {/* Card Info Mobile: Sólido | Desktop: Blur */}
            <div className="bg-[#18181b] md:bg-gray-900/40 md:backdrop-blur-sm border border-white/5 md:border-white/10 rounded-3xl p-6 md:p-8 hover:border-amber-500/20 transition-colors">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8">
                Canais Oficiais
              </h3>
              <div className="space-y-6 md:space-y-8">
                {contactInfo.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 md:gap-5 group"
                  >
                    <div className="p-3 bg-[#27272a] md:bg-gray-800/50 rounded-xl text-gray-400 border border-white/5 group-hover:text-amber-500 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-all duration-300 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-base md:text-lg text-white group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-gray-200 font-medium mt-0.5 text-sm md:text-base">
                        {item.value}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banner FAQ */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#18181b] to-[#0c0c0e] border border-white/10 rounded-3xl p-6 md:p-8 group cursor-pointer hover:border-amber-500/30 transition-all touch-manipulation active:scale-[0.99]">
              <div className="relative z-10">
                <h4 className="text-lg md:text-xl font-bold text-white mb-2">
                  Precisa de ajuda rápida?
                </h4>
                <p className="text-gray-400 mb-6 text-sm leading-relaxed max-w-xs">
                  Nossa Central de Ajuda tem tutoriais detalhados sobre
                  pagamentos e funcionalidades.
                </p>
                <div className="inline-flex items-center text-amber-500 font-bold text-sm group-hover:gap-2 transition-all">
                  Acessar FAQ <ArrowRight size={16} className="ml-1" />
                </div>
              </div>

              {/* Decorative Icon */}
              <div className="absolute -bottom-6 -right-6 text-white/5 transform rotate-12 group-hover:scale-110 group-hover:text-amber-500/10 transition-all duration-500">
                <MessageSquare size={120} />
              </div>
            </div>
          </motion.div>

          {/* --- RIGHT COLUMN: FORM --- */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Form Container: Sólido no mobile para evitar lag de teclado */}
            <div className="bg-[#18181b] md:bg-gray-900/60 md:backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl">
              
              <div className="mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  Envie uma mensagem
                </h3>
                <p className="text-gray-400 text-sm">
                  Preencha o formulário abaixo e retornaremos em breve.
                </p>
              </div>

              {isSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center"
                >
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-500 mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    Mensagem Enviada!
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Obrigado pelo contato. Em breve nossa equipe falará com
                    você.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
                      >
                        Nome
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        placeholder="Seu nome completo"
                        className="w-full bg-[#09090b] md:bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all touch-manipulation text-sm md:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        placeholder="seu@email.com"
                        className="w-full bg-[#09090b] md:bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all touch-manipulation text-sm md:text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
                    >
                      Assunto
                    </label>
                    <div className="relative">
                      <select
                        id="subject"
                        className="w-full bg-[#09090b] md:bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer touch-manipulation text-sm md:text-base"
                      >
                        <option>Quero contratar a Stylo</option>
                        <option>Suporte Técnico</option>
                        <option>Parcerias & Imprensa</option>
                        <option>Outros assuntos</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <ArrowRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
                    >
                      Mensagem
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      required
                      placeholder="Como podemos ajudar você hoje?"
                      className="w-full bg-[#09090b] md:bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none touch-manipulation text-sm md:text-base"
                    />
                  </div>

                  <div className="pt-4 relative group">
                    {/* Glow apenas no Desktop para poupar bateria no mobile */}
                    <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative w-full bg-[#27272a] md:bg-gray-900 ring-1 ring-white/10 hover:bg-gray-800 text-white font-bold py-3.5 md:py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        "Enviando..."
                      ) : (
                        <>
                          Enviar Mensagem{" "}
                          <Send size={18} className="text-amber-500" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
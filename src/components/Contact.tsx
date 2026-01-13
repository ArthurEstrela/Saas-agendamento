// src/components/Contact.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, MessageSquare, Send, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

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
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      value: "contato@stylo.app.br",
      description: "Resposta em até 24h úteis."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Chat Suporte",
      value: "Disponível no Dashboard",
      description: "Atendimento em tempo real para assinantes."
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Sede",
      value: "São Paulo, SP",
      description: "O coração da nossa operação."
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24 sm:py-32">
        
        {/* --- HEADER --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-6 hover:bg-amber-500/20 transition-colors cursor-default">
            <Sparkles size={12} />
            Fale Conosco
          </span>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-white">
            Como podemos <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700">
              ajudar você?
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Dúvidas sobre a plataforma, parcerias ou apenas um "oi". 
            Nossa equipe está pronta para te ouvir.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          {/* --- LEFT COLUMN: INFO --- */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-8">Canais Oficiais</h3>
              <div className="space-y-8">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex items-start gap-5 group">
                    <div className="p-3 bg-gray-800/50 rounded-xl text-gray-400 border border-white/5 group-hover:text-amber-500 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-all duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-gray-200 font-medium mt-1">{item.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banner FAQ */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-3xl p-8 group cursor-pointer hover:border-amber-500/30 transition-all">
              <div className="relative z-10">
                <h4 className="text-xl font-bold text-white mb-2">Precisa de ajuda rápida?</h4>
                <p className="text-gray-400 mb-6 text-sm leading-relaxed max-w-xs">
                  Nossa Central de Ajuda tem tutoriais detalhados sobre pagamentos e funcionalidades.
                </p>
                <div className="inline-flex items-center text-amber-500 font-bold text-sm group-hover:gap-2 transition-all">
                  Acessar FAQ <ArrowRight size={16} className="ml-1" />
                </div>
              </div>
              
              {/* Decorative Icon */}
              <div className="absolute -bottom-6 -right-6 text-white/5 transform rotate-12 group-hover:scale-110 group-hover:text-amber-500/10 transition-all duration-500">
                <MessageSquare size={140} />
              </div>
            </div>
          </motion.div>

          {/* --- RIGHT COLUMN: FORM --- */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 relative overflow-hidden">
              
              {/* Form Header */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  Envie uma mensagem
                </h3>
                <p className="text-gray-400 text-sm">Preencha o formulário abaixo e retornaremos em breve.</p>
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
                  <h4 className="text-xl font-bold text-white mb-2">Mensagem Enviada!</h4>
                  <p className="text-gray-400">Obrigado pelo contato. Em breve nossa equipe falará com você.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome</label>
                      <input
                        type="text"
                        id="name"
                        required
                        placeholder="Seu nome completo"
                        className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        required
                        placeholder="seu@email.com"
                        className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Assunto</label>
                    <div className="relative">
                      <select
                        id="subject"
                        className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer"
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
                    <label htmlFor="message" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Mensagem</label>
                    <textarea
                      id="message"
                      rows={4}
                      required
                      placeholder="Como podemos ajudar você hoje?"
                      className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none"
                    />
                  </div>

                  <div className="pt-4 relative group">
                     {/* Efeito Glow atrás do botão */}
                     <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                     
                     <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative w-full bg-gray-900 ring-1 ring-white/10 hover:bg-gray-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        "Enviando..."
                      ) : (
                        <>Enviar Mensagem <Send size={18} className="text-amber-500" /></>
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
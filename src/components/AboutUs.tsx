import { motion, type Variants } from "framer-motion";
import { Target, Sparkles, Quote, Linkedin, Github, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button"; 
import { Link } from "react-router-dom";
import { cn } from "../lib/utils/cn"; // Utilitário para classes condicionais

const teamMembers = [
  {
    name: "Arthur Estrela",
    role: "CEO & Fundador",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/stylo-28128.firebasestorage.app/o/fotos_criadores%2FArthur.jpeg?alt=media&token=8611e096-56b6-4dd2-903a-802ce5babe62",
    bio: "Visionário apaixonado por tecnologia e estética. Fundou a Stylo para trazer a revolução digital para o mercado de beleza.",
    linkedin: "#",
    github: "#"
  },
  {
    name: "Sávio Issa",
    role: "Diretor de Tecnologia (CTO)",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/stylo-28128.firebasestorage.app/o/fotos_criadores%2FSavio.jpeg?alt=media&token=e539c859-1a04-4f09-a145-e9f7604d29c0",
    bio: "Arquiteto de software e líder técnico. Garante que cada linha de código da Stylo seja segura, rápida e escalável.",
    linkedin: "#",
    github: "#"
  },
];

const containerVar: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }, // Delay reduzido para mobile
  },
};

const itemVar: Variants = {
  hidden: { opacity: 0, y: 20 }, // Reduzi o Y para menos movimento
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  },
};

const AboutUs = () => {
  return (
    // Fundo base consistente com o resto do app otimizado
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">
      
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Mobile: Gradiente Radial Simples (Leve) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-[#09090b] to-[#09090b] md:hidden"></div>
        
        {/* Desktop: Grid e Aurora Blur (Rico) */}
        <div className="hidden md:block absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none opacity-30"></div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 py-20 sm:py-32 flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVar}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={itemVar}>
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-6 md:mb-8 hover:bg-amber-500/20 transition-colors cursor-default">
              <Sparkles size={12} />
              Sobre a Stylo
            </span>
          </motion.div>
          
          <motion.h1 variants={itemVar} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 md:mb-8 leading-tight">
            A nossa missão é <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 drop-shadow-sm">
              o seu sucesso.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVar} className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed font-light px-2">
            Acreditamos que, com as ferramentas certas, todo profissional de beleza pode prosperar.
            Nós cuidamos da complexidade para você focar na <span className="text-gray-100 font-medium border-b border-amber-500/30">arte de transformar</span>.
          </motion.p>
        </motion.div>
      </section>

      {/* --- MANIFESTO / VALUES SECTION --- */}
      {/* Mobile: bg-[#0c0c0e] (Sólido) | Desktop: bg-gray-950/30 + blur */}
      <section className="relative z-10 py-16 md:py-20 border-y border-white/5 bg-[#0c0c0e] md:bg-gray-950/30 md:backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVar}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start"
          >
            {/* Texto Esquerda */}
            <div className="space-y-10 md:space-y-12">
              <motion.div variants={itemVar} className="group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-[#18181b] rounded-xl text-amber-500 border border-white/5 group-hover:border-amber-500/30 transition-colors">
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Nossa História</h2>
                </div>
                <p className="text-gray-400 text-base md:text-lg leading-relaxed pl-[60px] md:pl-16 border-l border-white/10 group-hover:border-amber-500/20 transition-colors">
                  A Stylo nasceu de uma observação simples: profissionais talentosos perdiam
                  muito tempo com papelada. Decidimos criar um ecossistema onde a gestão é invisível e o talento é o protagonista.
                </p>
              </motion.div>

              <motion.div variants={itemVar} className="group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-[#18181b] rounded-xl text-amber-500 border border-white/5 group-hover:border-amber-500/30 transition-colors">
                    <Target size={24} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Nosso Propósito</h2>
                </div>
                <p className="text-gray-400 text-base md:text-lg leading-relaxed pl-[60px] md:pl-16 border-l border-white/10 group-hover:border-amber-500/20 transition-colors">
                  Unimos tecnologia de ponta com design intuitivo. Não somos apenas um software; somos o parceiro estratégico que impulsiona o crescimento do seu salão ou barbearia.
                </p>
              </motion.div>
            </div>

            {/* Quote Card (Direita) */}
            <motion.div variants={itemVar} className="relative mt-4 lg:mt-0">
              <div className="hidden md:block absolute -inset-1 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50"></div>
              
              {/* Card Sólido no Mobile para contraste */}
              <div className="relative bg-[#18181b] md:bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 md:p-12 shadow-xl">
                <Quote className="text-amber-500 w-10 h-10 md:w-12 md:h-12 mb-6 md:mb-8 opacity-80" />
                <blockquote className="text-xl md:text-3xl font-medium text-gray-200 leading-snug tracking-tight">
                  "Queremos ser mais do que um software. Queremos ser a base sólida onde os sonhos dos empreendedores são construídos."
                </blockquote>
                
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">Manifesto Stylo</span>
                    <span className="text-gray-500 text-sm">Desde 2025</span>
                  </div>
                  <div className="h-px w-16 md:w-24 bg-gradient-to-r from-amber-500 to-transparent"></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- TEAM SECTION --- */}
      <section className="relative z-10 py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 md:mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6">Mentes Brilhantes</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg px-2">
              Os líderes dedicados a construir o futuro da gestão de beleza.
            </p>
          </motion.div>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:max-w-5xl lg:mx-auto">
            {teamMembers.map((person, index) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }} // Delay menor
                className="group relative h-full"
              >
                {/* Fundo do Card Otimizado */}
                <div className={cn(
                  "absolute inset-0 rounded-3xl border transition-all duration-500",
                  "bg-[#18181b] border-white/5", // Mobile
                  "md:bg-gray-900/40 md:group-hover:border-amber-500/30" // Desktop
                )}></div>
                
                <div className="relative p-6 md:p-8 flex flex-col sm:flex-row gap-6 md:gap-8 items-center sm:items-start h-full">
                  <div className="relative shrink-0">
                    {/* Glow apenas no desktop */}
                    <div className="hidden md:block absolute -inset-2 bg-gradient-to-br from-amber-500 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <img
                      className="relative object-cover w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-[#18181b] md:border-gray-900 shadow-xl"
                      src={person.imageUrl}
                      alt={person.name}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                      {person.name}
                    </h3>
                    <p className="text-xs md:text-sm font-bold text-amber-600 uppercase tracking-widest mb-3 md:mb-4">
                      {person.role}
                    </p>
                    <p className="text-gray-400 leading-relaxed text-sm mb-6 flex-grow">
                      {person.bio}
                    </p>

                    <div className="flex gap-4 mt-auto">
                      <a href={person.github} className="p-2 bg-[#27272a] md:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors touch-manipulation">
                        <Github size={18} />
                      </a>
                      <a href={person.linkedin} className="p-2 bg-[#27272a] md:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-400 transition-colors touch-manipulation">
                        <Linkedin size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="relative z-10 py-20 md:py-24 text-center border-t border-white/5 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Faça parte dessa revolução</h2>
          <p className="text-gray-400 mb-8 md:mb-10 text-sm md:text-base">
            Estamos sempre em busca de parceiros e clientes que queiram crescer conosco.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register-type">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 px-8 rounded-full w-full sm:w-auto touch-manipulation shadow-lg shadow-amber-500/10">
                Começar Agora
              </Button>
            </Link>
            
            <Link to="/contact">
              <Button variant="outline" size="lg" className="border-gray-700 bg-transparent text-gray-300 hover:text-white hover:bg-white/5 h-12 px-8 rounded-full flex items-center justify-center gap-2 w-full sm:w-auto touch-manipulation">
                Fale Conosco <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
          <p className="mt-12 md:mt-16 text-gray-600 text-xs md:text-sm">
            Feito com <span className="text-red-500 inline-block animate-pulse">❤</span> para o mundo.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
import {
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  BellRing,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils/cn"; // Utilitário de classes

const features = [
  {
    icon: <Calendar className="w-6 h-6 text-primary" />,
    title: "Agendamento Inteligente",
    description:
      "Dê adeus aos conflitos. Nossa agenda se adapta à disponibilidade de cada profissional automaticamente.",
  },
  {
    icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
    title: "Controle Financeiro",
    description:
      "Receitas, despesas e lucro líquido em tempo real. Saiba exatamente para onde seu dinheiro está indo.",
  },
  {
    icon: <Users className="w-6 h-6 text-blue-400" />,
    title: "Gestão de Equipe",
    description:
      "Gerencie permissões, comissões e horários de cada membro do time de forma individualizada.",
  },
  {
    icon: <BellRing className="w-6 h-6 text-yellow-400" />,
    title: "Notificações Automáticas",
    description:
      "Reduza o no-show enviando lembretes automáticos para seus clientes via WhatsApp ou E-mail.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-purple-400" />,
    title: "Relatórios Detalhados",
    description:
      "Decisões baseadas em dados. Visualize métricas de crescimento e serviços mais vendidos.",
  },
  {
    icon: <Smartphone className="w-6 h-6 text-pink-400" />,
    title: "Acesso Mobile",
    description:
      "Seu negócio no bolso. Plataforma totalmente otimizada para celulares e tablets.",
  },
];

const Features = () => {
  return (
    // Fundo base consistente
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
      
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Padrão de Grade (Leve e estático) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Mobile: Gradiente Linear (Rápido) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden opacity-90" />

        {/* Desktop: Blur Orb (Bonito) */}
        <div className="hidden md:block absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      {/* --- HERO SECTION --- */}
      <div className="relative z-10 pt-20 pb-16 md:pt-32 md:pb-28">
        <div className="container mx-auto px-4 text-center">
          
          {/* Badge Animada */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs md:text-sm font-medium text-primary mb-6 md:mb-8 animate-in fade-in zoom-in duration-500 hover:bg-primary/20 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Potencialize seu negócio hoje
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 md:mb-8 text-white leading-tight">
            Tudo o que você precisa <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500">
              em um só lugar.
            </span>
          </h1>

          <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed font-light px-2">
            O Stylo é o sistema operacional completo para profissionais que querem 
            escalar seus negócios com <span className="text-gray-200 font-medium">organização</span> e <span className="text-gray-200 font-medium">elegância</span>.
          </p>

          {/* --- BOTÕES PREMIUM --- */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
            <div className="relative group w-full sm:w-auto">
              <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              
              <Link to="/register-type" className="w-full sm:w-auto">
                <Button size="lg" className="relative w-full h-12 px-8 bg-[#27272a] md:bg-gray-900 ring-1 ring-white/10 hover:bg-gray-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98]">
                  Começar Agora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- GRID DE FEATURES --- */}
      <section className="relative z-10 py-16 md:py-24 border-t border-white/5 bg-[#0c0c0e] md:bg-gray-950/50 md:backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">Funcionalidades Poderosas</h2>
            <p className="text-gray-400 text-sm md:text-base">Ferramentas desenhadas para simplificar sua rotina.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "group relative p-6 md:p-8 rounded-2xl border transition-all duration-300 overflow-hidden",
                  // Mobile: Sólido e performático
                  "bg-[#18181b] border-white/5",
                  // Desktop: Transparente com efeitos
                  "md:bg-gray-900/40 md:hover:border-primary/30 md:hover:shadow-2xl md:hover:shadow-primary/5 md:hover:-translate-y-1"
                )}
              >
                {/* Gradiente sutil no hover (Desktop apenas para performance mobile) */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="mb-5 md:mb-6 p-3 rounded-xl bg-[#27272a] md:bg-gray-800/50 w-fit border border-white/5 group-hover:border-primary/20 group-hover:bg-primary/10 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-gray-100 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SEÇÃO DE SEGURANÇA --- */}
      <section className="relative z-10 py-16 md:py-24 container mx-auto px-4">
        <div className="relative overflow-hidden bg-[#18181b] md:bg-gray-900/60 rounded-3xl border border-white/10 p-6 md:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-12 md:backdrop-blur-md">
          
          {/* Background Glow (Apenas Desktop) */}
          <div className="hidden md:block absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/20 blur-[80px] rounded-full pointer-events-none opacity-50" />

          <div className="flex-1 space-y-6 md:space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-[10px] md:text-xs bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <ShieldCheck className="w-4 h-4" />
              Segurança Enterprise
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Seus dados, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                blindados.
              </span>
            </h2>
            
            <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-lg">
              Utilizamos a mesma infraestrutura de segurança que grandes bancos. 
              Foque no seu trabalho, a proteção é por nossa conta.
            </p>
            
            <ul className="space-y-3 pt-2">
              {[
                "Backup diário automático e redundante",
                "Criptografia SSL de ponta a ponta",
                "Total conformidade com LGPD",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-gray-300 text-sm md:text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual Element */}
          <div className="flex-1 w-full max-w-sm relative mt-8 md:mt-0">
             {/* Glow reduzido no mobile */}
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-xl md:blur-2xl opacity-40 rounded-full animate-pulse-slow"></div>
             
             <div className="relative bg-[#0c0c0e] md:bg-gray-950/80 border border-white/10 aspect-square rounded-2xl flex items-center justify-center md:backdrop-blur-xl shadow-2xl">
                <ShieldCheck className="w-24 h-24 md:w-32 md:h-32 text-gray-700" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-24 h-24 md:w-32 md:h-32 text-primary/20 animate-pulse" strokeWidth={1} />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="relative z-10 py-20 md:py-32 text-center border-t border-white/5 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none"></div>
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white tracking-tight">
            Pronto para o próximo nível?
          </h2>
          <p className="text-gray-400 mb-8 md:mb-10 max-w-xl mx-auto text-base md:text-lg">
            Junte-se a profissionais de elite que escolheram o Stylo.
          </p>
          
          <div className="flex justify-center">
            <Link to="/register-type">
              <Button
                size="lg"
                className="h-14 px-10 text-lg bg-white text-gray-950 hover:bg-gray-200 font-bold rounded-full shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)] md:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105 touch-manipulation active:scale-95"
              >
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs md:text-sm text-gray-500">
            Não é necessário cartão de crédito. Cancele quando quiser.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Features;
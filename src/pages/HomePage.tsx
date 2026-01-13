// src/pages/HomePage.tsx

import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { 
  Calendar, 
  Globe, 
  TrendingUp, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Zap
} from "lucide-react";
import { httpsCallable } from "@firebase/functions";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { toast } from "react-hot-toast";
import { functions } from "../firebase/config";
import { Button } from "../components/ui/button"; // Certifique-se de ter este componente ou use HTML button
import type { ServiceProviderProfile } from "../types";

// --- Interfaces ---
interface AnimateOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

// --- Componente de Animação (Mantido e Otimizado) ---
const AnimateOnScroll = ({
  children,
  delay = 0,
  className = "",
}: AnimateOnScrollProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-1000 ease-out`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
      }}
    >
      {children}
    </div>
  );
};

// --- Componente Principal ---

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const { userProfile } = useProfileStore();
  const navigate = useNavigate();

  const isProvider = userProfile?.role === "serviceProvider";
  const subscriptionStatus = isProvider
    ? (userProfile as ServiceProviderProfile)?.subscriptionStatus
    : undefined;

  const isSubscribed = isProvider && subscriptionStatus === "active";

  // --- Lógica de Pagamento ---
  const handleCheckout = async (priceId: string) => {
    if (!user || !userProfile) {
      toast.error("Crie uma conta para começar seus 15 dias grátis.");
      navigate("/register-type", { state: { from: location } }); // Mudei para register-type que é melhor
      return;
    }

    if (userProfile.role === "client") {
      toast.error("Nossos planos são exclusivos para Prestadores de Serviço.");
      return;
    }

    if (isSubscribed) {
      toast.success("Você já é um assinante!");
      navigate("/dashboard");
      return;
    }

    setIsLoading(true);
    toast.loading("Preparando seu período de teste...");

    try {
      const createStripeCheckout = httpsCallable(functions, "createStripeCheckout");
      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = window.location.origin;

      const result = await createStripeCheckout({ priceId, successUrl, cancelUrl });
      const { sessionUrl } = result.data as { sessionUrl: string };
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Erro ao iniciar pagamento:", error);
      toast.dismiss();
      toast.error("Erro ao conectar. Tente novamente.");
      setIsLoading(false);
    }
  };

  // --- Renderização dos Botões de Plano ---
  const renderPlanButton = (priceId: string, text: string, isPopular: boolean = false) => {
    const isClient = userProfile && userProfile.role === "client";
    
    if (isClient) {
      return (
        <Button disabled variant="outline" className="w-full border-gray-800 text-gray-500 cursor-not-allowed">
          Exclusivo para Profissionais
        </Button>
      );
    }

    if (isSubscribed) {
      return (
        <Button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/20"
        >
          Acessar Dashboard
        </Button>
      );
    }

    // Botão Principal (Trimestral) vs Botões Secundários
    if (isPopular) {
      return (
        <Button
          onClick={() => handleCheckout(priceId)}
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 relative transition-all hover:scale-[1.02]"
        >
          {isLoading ? "Processando..." : "Começar 15 Dias Grátis"}
        </Button>
      );
    }

    return (
      <Button
        onClick={() => handleCheckout(priceId)}
        disabled={isLoading}
        variant="outline"
        className="w-full h-12 border-gray-700 bg-transparent text-white hover:bg-white/5 hover:text-white rounded-xl"
      >
        {isLoading ? "Processando..." : text}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-primary/30 selection:text-white overflow-x-hidden">
      
      {/* --- BACKGROUND EFFECTS (Igual ao Pricing) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-40"></div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 min-h-[90vh] flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          
          <AnimateOnScroll>
            {/* Badge de Teste Grátis */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-400 mb-6 hover:bg-emerald-500/20 transition-colors cursor-default animate-fade-in">
              <ShieldCheck size={16} />
              <span>Teste Grátis de 15 Dias</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
              O seu negócio, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                sempre agendado.
              </span>
            </h1>
          </AnimateOnScroll>
          
          <AnimateOnScroll delay={200}>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 font-light leading-relaxed">
              Simplifique a gestão do seu tempo e automatize seus agendamentos. 
              <span className="text-gray-200 font-medium"> Elegância e eficiência</span> para você e seus clientes.
            </p>
          </AnimateOnScroll>
          
          <AnimateOnScroll delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {/* Botão Principal Hero */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <Button 
                  size="lg" 
                  className="relative h-14 px-8 bg-gray-900 ring-1 ring-white/10 hover:bg-gray-800 text-white font-semibold rounded-xl flex items-center gap-2 transition-all text-lg"
                  onClick={() => navigate("/register-type")}
                >
                  Começar Agora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                size="lg" 
                className="h-14 px-8 text-gray-400 hover:text-white border border-transparent hover:bg-white/5 rounded-xl text-lg"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Planos
              </Button>
            </div>
            <p className="mt-4 text-xs text-gray-500 uppercase tracking-widest">Sem cartão necessário para cadastro</p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="relative z-10 py-24 bg-gray-950/50 border-t border-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <AnimateOnScroll className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Tudo o que você precisa</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Ferramentas desenhadas para alavancar seu negócio sem complicar sua vida.
            </p>
          </AnimateOnScroll>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll>
              <div className="group p-8 rounded-3xl bg-gray-900/40 border border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 h-full">
                <div className="mb-6 p-3 rounded-xl bg-gray-800/50 w-fit group-hover:bg-primary/10 transition-colors">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Agenda Inteligente</h3>
                <p className="text-gray-400 leading-relaxed">Visualize e gerencie todos os seus compromissos com uma interface simples e intuitiva.</p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={200}>
              <div className="group p-8 rounded-3xl bg-gray-900/40 border border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 h-full">
                <div className="mb-6 p-3 rounded-xl bg-gray-800/50 w-fit group-hover:bg-blue-500/10 transition-colors">
                  <Globe className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Página Pública</h3>
                <p className="text-gray-400 leading-relaxed">Link exclusivo para seus clientes agendarem 24/7, totalmente integrado à sua agenda.</p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={400}>
              <div className="group p-8 rounded-3xl bg-gray-900/40 border border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 h-full">
                <div className="mb-6 p-3 rounded-xl bg-gray-800/50 w-fit group-hover:bg-emerald-500/10 transition-colors">
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Gestão Financeira</h3>
                <p className="text-gray-400 leading-relaxed">Acompanhe ganhos, controle despesas e tenha clareza total sobre seu lucro.</p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION (Integrada e Refinada) --- */}
      <section id="pricing" className="relative z-10 py-32 container mx-auto px-4">
        <AnimateOnScroll className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
            <Sparkles size={14} />
            <span>Investimento Inteligente</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Planos Transparentes</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Escolha seu plano. <span className="text-white font-medium">Você só paga depois de 15 dias</span> se decidir continuar.
          </p>
        </AnimateOnScroll>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          
          {/* MENSAL */}
          <AnimateOnScroll>
            <div className="relative p-8 rounded-3xl bg-gray-900/40 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1">
              <h3 className="text-xl font-semibold text-white mb-2">Mensal</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-sm text-gray-400">R$</span>
                <span className="text-4xl font-bold text-white">49,90</span>
                <span className="text-gray-400">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-gray-300">
                <li className="flex gap-3"><Check className="w-5 h-5 text-gray-500" /> Agendamentos ilimitados</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-gray-500" /> Gestão de Clientes</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-gray-500" /> Página Pública</li>
              </ul>
              {renderPlanButton("price_1SMeWT3zDQy3p6yeWl0LC4wi", "Testar Mensal", false)}
              <p className="text-[10px] text-center text-gray-600 mt-3 uppercase tracking-wide">15 dias grátis</p>
            </div>
          </AnimateOnScroll>

          {/* TRIMESTRAL (Destaque) */}
          <AnimateOnScroll delay={200}>
            <div className="relative p-8 rounded-3xl bg-gray-900/80 border border-primary/50 shadow-2xl shadow-primary/10 transform lg:-translate-y-6 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Zap size={12} fill="currentColor" />
                Mais Popular
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">Trimestral</h3>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-sm text-gray-400">R$</span>
                <span className="text-5xl font-extrabold text-white">45,00</span>
                <span className="text-gray-400">/mês</span>
              </div>
              <p className="text-xs text-gray-500 mb-8">Cobrado R$ 135,00 a cada 3 meses</p>

              <ul className="space-y-4 mb-8 text-sm text-white font-medium">
                <li className="flex gap-3"><div className="p-0.5 rounded-full bg-primary/20 text-primary"><Check className="w-3.5 h-3.5" /></div> Tudo do Plano Mensal</li>
                <li className="flex gap-3"><div className="p-0.5 rounded-full bg-primary/20 text-primary"><Check className="w-3.5 h-3.5" /></div> Notificações WhatsApp</li>
                <li className="flex gap-3"><div className="p-0.5 rounded-full bg-primary/20 text-primary"><Check className="w-3.5 h-3.5" /></div> Relatórios Avançados</li>
              </ul>
              {renderPlanButton("price_1SMeWT3zDQy3p6yezkMmrByP", "Assinar Trimestral", true)}
              <p className="text-xs text-center text-gray-400 mt-3 font-medium">Cancele quando quiser</p>
            </div>
          </AnimateOnScroll>

          {/* ANUAL */}
          <AnimateOnScroll delay={400}>
            <div className="relative p-8 rounded-3xl bg-gray-900/40 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-white">Anual</h3>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20">Economize 22%</span>
              </div>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-sm text-gray-400">R$</span>
                <span className="text-4xl font-bold text-white">39,00</span>
                <span className="text-gray-400">/mês</span>
              </div>
              <p className="text-xs text-gray-500 mb-8">R$ 468,00 anualmente</p>

              <ul className="space-y-4 mb-8 text-sm text-gray-300">
                <li className="flex gap-3"><Check className="w-5 h-5 text-gray-500" /> Tudo do Trimestral</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-gray-500" /> Domínio Personalizado</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-gray-500" /> Suporte Prioritário</li>
              </ul>
              {renderPlanButton("price_1SO7sB3zDQy3p6yevNXLXO8v", "Testar Anual", false)}
              <p className="text-[10px] text-center text-gray-600 mt-3 uppercase tracking-wide">15 dias grátis</p>
            </div>
          </AnimateOnScroll>
        </div>

        {/* Garantia Footer */}
        <div className="mt-16 text-center border-t border-white/5 pt-8">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <span>Garantia total. Não cobramos nada se cancelar durante o teste.</span>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
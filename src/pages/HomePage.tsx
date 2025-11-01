// src/pages/HomePage.tsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";

// --- IMPORTS ATUALIZADOS ---
import { httpsCallable } from "@firebase/functions";
import { useAuthStore } from "../store/authStore"; // Pega o usuário E o perfil
import { toast } from "react-hot-toast";
import { functions } from "../firebase/config";
import type { ServiceProviderProfile } from "../types"; // Importa o tipo
// --------------------------------

// Componente Wrapper para Animação de Scroll
const AnimateOnScroll = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );
    if (element) observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all ease-out duration-1000`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {children}
    </div>
  );
};

// --- Ícones (Seu código original - sem alterações) ---
const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 mb-4 text-[#daa520]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 mb-4 text-[#daa520]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.881 4.002l.023.023a1.5 1.5 0 002.121 2.121l.023.023M16.119 4.002l-.023.023a1.5 1.5 0 01-2.121 2.121l-.023.023M12 21a9 9 0 100-18 9 9 0 000 18z"
    />
  </svg>
);
const TrendingUpSvgIcon = () => (
  <TrendingUp className="h-12 w-12 mb-4 text-[#daa520]" />
);
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-[#daa520]"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);
// -----------------------------------

// Componente de Card com efeito 3D (Seu código original - sem alterações)
const FeatureCard = ({ icon, title, description }) => (
  <div className="group [perspective:1000px]">
    <div className="relative bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg h-full p-8 transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(15deg)_rotateX(5deg)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#daa520]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
      <div className="relative z-10 flex flex-col items-center text-center">
        {icon}
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// --- COMPONENTE HOME ATUALIZADO ---
const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation(); // <-- 2. INICIE O HOOK

  // !! MUDANÇA AQUI: Pegamos o userProfile também !!
  const { user, userProfile } = useAuthStore();
  const navigate = useNavigate();

  // Variáveis de estado para lógica dos botões
  const isProvider = userProfile?.role === "serviceProvider";
  const subscriptionStatus = (userProfile as ServiceProviderProfile)
    ?.subscriptionStatus;
  const isSubscribed = isProvider && subscriptionStatus === "active";

  // --- FUNÇÃO HANDLECHECKOUT ATUALIZADA ---
  const handleCheckout = async (priceId: string) => {
    // 1. Verifica se está logado (userProfile também)
    if (!user || !userProfile) {
      toast.error("Você precisa estar logado para assinar.");
      // Manda para o registro, sugerindo ser um prestador
      navigate("/login?type=register", { state: { from: location } });
      return;
    }

    // 2. !! NOVA VERIFICAÇÃO DE PAPEL !!
    // Se for um cliente, não pode assinar
    if (userProfile.role === "client") {
      toast.error("Nossos planos são exclusivos para Prestadores de Serviço.");
      return;
    }

    // 3. !! NOVA VERIFICAÇÃO DE STATUS !!
    // Se já for um prestador assinante, não paga de novo
    if (isSubscribed) {
      toast.success("Você já é um assinante!");
      navigate("/dashboard"); // Manda ele pro dashboard
      return;
    }

    // 4. Se for um prestador e NÃO for assinante, continua...
    setIsLoading(true);
    toast.loading("Redirecionando para o pagamento...");

    try {
      const createStripeCheckout = httpsCallable(
        functions,
        "createStripeCheckout"
      );

      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = window.location.origin;

      const result = await createStripeCheckout({
        priceId,
        successUrl,
        cancelUrl,
      });

      const { sessionUrl } = result.data as { sessionUrl: string };
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Erro ao iniciar pagamento:", error);
      toast.dismiss();
      if (error instanceof Error) {
        toast.error(`Erro: ${error.message || "Tente novamente."}`);
      } else {
        toast.error("Erro ao iniciar pagamento. Tente novamente.");
      }
      setIsLoading(false);
    }
  };

  // !! NOVA FUNÇÃO PARA RENDERIZAR O BOTÃO CORRETO !!
  const renderPlanButton = (
    priceId: string,
    text: string,
    popular: boolean = false
  ) => {
    // Caso 1: Usuário é um CLIENTE
    if (userProfile && userProfile.role === "client") {
      return (
        <button
          disabled
          className={`mt-auto w-full block text-center font-bold py-3 px-6 rounded-lg transition-colors duration-300 ${
            popular
              ? "bg-black text-white opacity-50 cursor-not-allowed"
              : "bg-gray-800 text-white opacity-50 cursor-not-allowed"
          }`}
        >
          Exclusivo para Prestadores
        </button>
      );
    }

    // Caso 2: Usuário é um PRESTADOR e JÁ É ASSINANTE
    if (isSubscribed) {
      return (
        <button
          onClick={() => navigate("/dashboard")}
          className={`mt-auto w-full block text-center font-bold py-3 px-6 rounded-lg transition-colors duration-300 ${
            popular
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-800 text-white group-hover:bg-[#daa520] group-hover:text-black"
          }`}
        >
          Ver meu Dashboard
        </button>
      );
    }

    // Caso 3: Usuário é VISITANTE ou PRESTADOR NÃO-ASSINANTE
    return (
      <button
        onClick={() => handleCheckout(priceId)}
        disabled={isLoading}
        className={`mt-auto w-full block text-center font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 ${
          popular
            ? "bg-black text-white hover:bg-gray-800"
            : "bg-gray-800 text-white group-hover:bg-[#daa520] group-hover:text-black"
        }`}
      >
        {isLoading ? "Aguarde..." : text}
      </button>
    );
  };

  return (
    <div className="bg-black text-white overflow-x-hidden">
      {/* --- SEÇÃO HERO (Seu código original - sem alterações) --- */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-gray-950"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#daa520]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10 text-center px-4">
          <AnimateOnScroll>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4">
              O seu negócio,{" "}
              <span className="text-[#daa520]">sempre agendado.</span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll delay={200}>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-300 mb-8">
              Simplifique a gestão do seu tempo, automatize seus agendamentos e
              ofereça a melhor experiência para seus clientes.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto bg-[#daa520] text-black font-bold py-3 px-8 rounded-lg text-lg hover:bg-[#c8961e] transition-transform duration-300 hover:scale-105"
              >
                Agendar Horário
              </Link>
              <Link
                to="/login?type=register"
                className="w-full sm:w-auto bg-transparent border-2 border-[#daa520] text-[#daa520] font-bold py-3 px-8 rounded-lg text-lg hover:bg-[#daa520] hover:text-black transition-all duration-300"
              >
                Trabalhe Conosco
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* --- SEÇÃO FEATURES (Seu código original - sem alterações) --- */}
      <section className="py-20 sm:py-32 bg-black/50">
        <div className="container mx-auto px-4">
          <AnimateOnScroll className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-gray-400 mt-2">
              Ferramentas poderosas para alavancar seu negócio.
            </p>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll>
              <FeatureCard
                icon={<CalendarIcon />}
                title="Agenda Inteligente"
                description="Visualize e gerencie todos os seus compromissos com uma interface simples e intuitiva."
              />
            </AnimateOnScroll>
            <AnimateOnScroll delay={200}>
              <FeatureCard
                icon={<GlobeIcon />}
                title="Página Pública"
                description="Seus clientes podem agendar horários diretamente pela sua página personalizada, disponível 24/7."
              />
            </AnimateOnScroll>
            <AnimateOnScroll delay={400}>
              <FeatureCard
                icon={<TrendingUpSvgIcon />}
                title="Gestão Financeira"
                description="Acompanhe seus ganhos, controle suas despesas e tenha uma visão clara da saúde financeira."
              />
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* --- SEÇÃO PLANOS (COM BOTÕES ATUALIZADOS) --- */}
      <section className="py-20 sm:py-32 bg-black">
        <div className="container mx-auto px-4">
          <AnimateOnScroll className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight">
              Planos transparentes para o seu sucesso
            </h2>
            <p className="text-lg text-gray-400 mt-2">
              Escolha o plano perfeito para o tamanho do seu negócio.
            </p>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* --- PLANO MENSAL --- */}
            <AnimateOnScroll>
              <div className="group relative bg-black border border-white/10 rounded-2xl p-8 flex flex-col h-full transition-all duration-300 hover:border-[#daa520]/50 hover:shadow-2xl hover:shadow-[#daa520]/10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-[#daa520] mb-2">
                    Mensal
                  </h3>
                  <p className="text-4xl font-extrabold mb-1">
                    R$49
                    <span className="text-xl font-medium text-gray-400">
                      ,99/mês
                    </span>
                  </p>
                  <p className="text-gray-400 mb-6 min-h-[40px]">
                    Flexibilidade total, cancele quando quiser.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3">
                      <CheckIcon /> Agendamentos ilimitados
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon /> Gestão de Clientes
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon /> Página Pública
                    </li>
                  </ul>

                  {/* !! BOTÃO COM LÓGICA !! */}
                  {renderPlanButton(
                    "price_1SMeWT3zDQy3p6yeWl0LC4wi",
                    "Começar",
                    false
                  )}
                </div>
              </div>
            </AnimateOnScroll>

            {/* --- PLANO ANUAL (POPULAR) --- */}
            <AnimateOnScroll delay={200}>
              <div className="group relative bg-[#daa520] border-2 border-[#c8961e] rounded-2xl p-8 flex flex-col h-full scale-105 shadow-2xl shadow-[#daa520]/20 transition-all duration-300 hover:scale-110">
                <div className="absolute -top-4 -right-4 bg-black text-[#daa520] text-xs font-bold px-3 py-1 rounded-full transform rotate-12">
                  MAIS POPULAR
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-black mb-2">Anual</h3>
                  <p className="text-4xl font-extrabold text-black mb-1">
                    R$34
                    <span className="text-xl font-medium text-black/70">
                      ,99/mês
                    </span>
                  </p>
                  <p className="text-black/70 mb-6 min-h-[40px]">
                    O melhor custo-benefício, cobrado anualmente.
                  </p>
                  <ul className="space-y-4 mb-8 text-black/80">
                    <li className="flex items-center gap-3">
                      <CheckIcon /> Tudo do plano Trimestral
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon /> Suporte Prioritário
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon /> Acesso a novas features
                    </li>
                  </ul>

                  {/* !! BOTÃO COM LÓGICA !! */}
                  {renderPlanButton(
                    "price_1SO7sB3zDQy3p6yevNXLXO8v",
                    "Economize 30%",
                    true
                  )}
                </div>
              </div>
            </AnimateOnScroll>

            {/* --- PLANO TRIMESTRAL --- */}
            <AnimateOnScroll delay={400}>
              <div className="group relative bg-black border border-white/10 rounded-2xl p-8 flex flex-col h-full transition-all duration-300 hover:border-[#daa520]/50 hover:shadow-2xl hover:shadow-[#daa520]/10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-[#daa520] mb-2">
                    Trimestral
                  </h3>
                  <p className="text-4xl font-extrabold mb-1">
                    R$44
                    <span className="text-xl font-medium text-gray-400">
                      ,99/mês
                    </span>
                  </p>
                  <p className="text-gray-400 mb-6 min-h-[40px]">
                    Um bom começo para economizar.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3">
                      <CheckIcon /> Tudo do plano Mensal
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon /> Relatórios Simplificados
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon /> Gestão de Equipe (até 3)
                    </li>
                  </ul>

                  {/* !! BOTÃO COM LÓGICA !! */}
                  {renderPlanButton(
                    "price_1SMeWT3zDQy3p6yezkMmrByP",
                    "Começar",
                    false
                  )}
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

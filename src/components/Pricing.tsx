import { Check, Zap, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

const PLANS_DATA = {
  monthly: {
    id: "monthly",
    name: "Mensal",
    price: "49,90",
    description: "Ideal para começar sem compromisso.",
    features: [
      "Agendamentos Ilimitados",
      "Cadastro de Clientes",
      "Página de Agendamento",
      "Suporte Básico",
    ],
  },
  quarterly: {
    id: "quarterly",
    name: "Trimestral",
    price: "45,00",
    total: "R$ 135,00 a cada 3 meses",
    description: "O equilíbrio perfeito para crescer.",
    features: [
      "Tudo do plano Mensal",
      "Notificações via WhatsApp",
      "Suporte Prioritário",
      "Relatórios de Desempenho",
    ],
    isPopular: true,
  },
  annual: {
    id: "annual",
    name: "Anual",
    price: "39,00",
    total: "R$ 468,00 anualmente",
    description: "Economia máxima para longo prazo.",
    features: [
      "Tudo do plano Trimestral",
      "Domínio Personalizado",
      "Consultoria de Configuração",
      "Badge de Verificado",
    ],
    discount: "Economize 22%",
  },
};

const Pricing = () => {
  return (
    <section
      id="pricing"
      // Alterado para #09090b para consistência com as outras páginas otimizadas
      className="relative min-h-screen bg-[#09090b] py-20 md:py-24 px-4 overflow-hidden font-sans selection:bg-primary/30 selection:text-white"
    >
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Grid Pattern (Leve e Estático) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Mobile: Gradiente Linear (Rápido) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden opacity-90" />

        {/* Desktop: Blur Orb (Bonito, mas pesado - só carrega em telas grandes) */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-16 md:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs md:text-sm font-bold text-emerald-400 mb-4 hover:bg-emerald-500/20 transition-colors cursor-default">
            <ShieldCheck size={14} className="md:w-4 md:h-4" />
            <span>Teste Grátis de 15 Dias</span>
          </div>

          <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-500 leading-tight">
            Planos flexíveis para <br /> o seu negócio
          </h2>

          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto font-light px-2">
            Escolha seu plano e comece a usar agora.{" "}
            <br className="hidden md:block" />
            <span className="text-white font-medium">
              Você só paga depois de 15 dias
            </span>{" "}
            se decidir continuar.
          </p>
        </div>

        {/* --- GRID DE PLANOS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          
          {/* === PLANO MENSAL === */}
          <div className="relative group p-6 md:p-8 rounded-3xl bg-[#18181b] border border-white/5 md:bg-gray-900/40 md:backdrop-blur-sm hover:border-white/10 transition-all duration-300 md:hover:-translate-y-1">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {PLANS_DATA.monthly.name}
              </h3>
              <p className="text-gray-400 text-sm h-auto md:h-10">
                {PLANS_DATA.monthly.description}
              </p>
            </div>

            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-sm text-gray-400">R$</span>
              <span className="text-4xl font-bold text-white tracking-tight">
                {PLANS_DATA.monthly.price}
              </span>
              <span className="text-gray-400">/mês</span>
            </div>

            <ul className="space-y-4 mb-8">
              {PLANS_DATA.monthly.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-gray-300 text-sm"
                >
                  <Check className="w-5 h-5 text-gray-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link to="/register-type" className="w-full block">
              <Button
                variant="outline"
                className="w-full border-gray-700 bg-transparent text-white hover:bg-white/5 hover:text-white h-12 rounded-xl touch-manipulation active:scale-[0.98] transition-transform"
              >
                Testar Grátis
              </Button>
            </Link>
            <p className="text-[10px] text-center text-gray-600 mt-3 uppercase tracking-wide">
              Sem cartão necessário
            </p>
          </div>

          {/* === PLANO TRIMESTRAL (DESTAQUE) === */}
          <div className="relative group p-6 md:p-8 rounded-3xl bg-[#1d1d20] border border-primary/50 md:bg-gray-900/80 md:backdrop-blur-md shadow-xl md:shadow-2xl md:shadow-primary/10 transform md:-translate-y-4 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1 w-max">
              <Zap size={12} fill="currentColor" />
              Mais Popular
            </div>

            {/* Gradiente interno sutil */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl pointer-events-none" />

            <div className="mb-6 relative">
              <h3 className="text-xl font-semibold text-white mb-2">
                {PLANS_DATA.quarterly.name}
              </h3>
              <p className="text-primary/90 text-sm h-auto md:h-10">
                {PLANS_DATA.quarterly.description}
              </p>
            </div>

            <div className="mb-2 flex items-baseline gap-1 relative">
              <span className="text-sm text-gray-400">R$</span>
              <span className="text-5xl font-extrabold text-white tracking-tight">
                {PLANS_DATA.quarterly.price}
              </span>
              <span className="text-gray-400">/mês</span>
            </div>
            <p className="text-xs text-gray-500 mb-8 relative">
              {PLANS_DATA.quarterly.total}
            </p>

            <ul className="space-y-4 mb-8 relative">
              {PLANS_DATA.quarterly.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-white text-sm font-medium"
                >
                  <div className="p-0.5 rounded-full bg-primary/20 text-primary">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Link to="/register-type" className="w-full block relative">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] touch-manipulation">
                Começar 15 dias Grátis
              </Button>
            </Link>
            <p className="text-xs text-center text-gray-400 mt-3 font-medium">
              Cancele quando quiser
            </p>
          </div>

          {/* === PLANO ANUAL === */}
          <div className="relative group p-6 md:p-8 rounded-3xl bg-[#18181b] border border-white/5 md:bg-gray-900/40 md:backdrop-blur-sm hover:border-white/10 transition-all duration-300 md:hover:-translate-y-1">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {PLANS_DATA.annual.name}
                </h3>
                <p className="text-gray-400 text-sm h-auto md:h-10 max-w-[140px]">
                  {PLANS_DATA.annual.description}
                </p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20">
                {PLANS_DATA.annual.discount}
              </span>
            </div>

            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-sm text-gray-400">R$</span>
              <span className="text-4xl font-bold text-white tracking-tight">
                {PLANS_DATA.annual.price}
              </span>
              <span className="text-gray-400">/mês</span>
            </div>
            <p className="text-xs text-gray-500 mb-8">
              {PLANS_DATA.annual.total}
            </p>

            <ul className="space-y-4 mb-8">
              {PLANS_DATA.annual.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-gray-300 text-sm"
                >
                  <Check className="w-5 h-5 text-gray-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link to="/register-type" className="w-full block">
              <Button
                variant="outline"
                className="w-full border-gray-700 bg-transparent text-white hover:bg-white/5 hover:text-white h-12 rounded-xl touch-manipulation active:scale-[0.98] transition-transform"
              >
                Testar Grátis
              </Button>
            </Link>
            <p className="text-[10px] text-center text-gray-600 mt-3 uppercase tracking-wide">
              Sem cartão necessário
            </p>
          </div>
        </div>

        {/* --- GARANTIA NO RODAPÉ --- */}
        <div className="mt-12 md:mt-16 text-center border-t border-white/5 pt-8">
          <p className="text-gray-500 text-xs md:text-sm flex items-center justify-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <span>
              Garantia de satisfação. Não cobramos nada durante o período de
              teste.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
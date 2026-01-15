import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { ServiceProviderProfile } from "../types";
import { getProviderProfileBySlug } from "../firebase/userService";
import {
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Calendar,
  Star,
  Scissors,
  Instagram,
  Globe,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { PublicReviewsSection } from "../components/Public/PublicReviewsSection";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async"; // Adicione este import

// UI Components
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils/cn";

const PublicBookingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<ServiceProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("services");

  useEffect(() => {
    const fetchProvider = async () => {
      if (!slug) {
        setError("Nenhum perfil especificado.");
        setIsLoading(false);
        return;
      }
      try {
        const profile = await getProviderProfileBySlug(slug);
        if (!profile) setError("Perfil não encontrado.");
        else setProvider(profile);
      } catch (err) {
        console.error("Falha ao carregar:", err);
        setError("Erro ao carregar o perfil.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProvider();
  }, [slug]);

  // Lógica de verificação da assinatura
  const isSubscriptionActive =
    provider?.subscriptionStatus === "active" ||
    provider?.subscriptionStatus === "trial" ||
    provider?.subscriptionStatus === "lifetime";

  const handleGoToBooking = () => {
    if (!isSubscriptionActive) return; // Bloqueio de segurança extra
    if (provider?.id) navigate(`/book/${provider.id}`);
    else setError("ID inválido.");
  };

  // --- TELA DE LOADING (Otimizada) ---
  if (isLoading)
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center relative overflow-hidden">
        {/* Background Leve para Mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-20" />
        <Loader2
          className="animate-spin text-primary relative z-10"
          size={48}
        />
      </div>
    );

  // --- TELA DE ERRO ---
  if (error || !provider) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-gray-100 p-4 text-center relative overflow-hidden">
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-red-900/10 rounded-full blur-[80px]" />
        <AlertCircle
          className="text-destructive mb-4 relative z-10"
          size={48}
        />
        <h1 className="text-2xl font-bold relative z-10">
          Perfil indisponível
        </h1>
        <p className="text-gray-400 mt-2 relative z-10">
          {error || "Página não encontrada."}
        </p>
        <Button
          variant="outline"
          className="mt-6 relative z-10 border-white/10 hover:bg-white/5 text-white"
          onClick={() => navigate("/")}
        >
          Voltar ao Início
        </Button>
      </div>
    );
  }

  const initials = provider.businessName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 pb-20 relative overflow-x-hidden selection:bg-primary/30 font-sans">
      {/* SEO DINÂMICO ✨ */}
    {provider && (
      <Helmet>
        <title>{`Agendar na ${provider.businessName} | Stylo`}</title>
        <meta name="description" content={`Reserve seu horário na ${provider.businessName}. Confira nossos serviços e avaliações.`} />
        
        {/* Tags para Redes Sociais (WhatsApp, Instagram) */}
        <meta property="og:title" content={`Agendar na ${provider.businessName} | Stylo`} />
        <meta property="og:description" content="Agendamento online rápido e fácil." />
        <meta property="og:image" content={provider.logoUrl || "/stylo-logo.png"} />
        <meta property="og:url" content={`https://stylo.app.br/schedule/${provider.publicProfileSlug}`} />
      </Helmet>
    )}
      {/* --- BACKGROUND OTIMIZADO --- 
          Removemos o blur excessivo no mobile e usamos gradientes (0 custo GPU).
          Mantemos a beleza (aurora) apenas no desktop.
      */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* MOBILE: Gradiente Estático e Leve */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden" />
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/5 to-transparent opacity-30 md:hidden" />

        {/* DESKTOP: Efeitos Visuais Ricos (Aurora) */}
        <div className="hidden md:block">
           <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[120px] opacity-40" />
           <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] opacity-30" />
           <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] bg-purple-900/5 rounded-full blur-[150px] opacity-30" />
        </div>

        {/* Textura de ruído (muito leve, não afeta performance) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="max-w-5xl mx-auto md:p-6 p-0 relative z-10">
        
        {/* --- HEADER / BANNER --- */}
        <header className="relative h-64 md:h-80 md:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl group border-b md:border border-white/5">
          {/* Botão Voltar - Otimizado: BG sólido com transparência em vez de blur pesado */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="absolute top-4 left-4 z-30 bg-black/40 text-white rounded-full border border-white/10 active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} />
          </Button>

          {provider.bannerUrl ? (
            <img
              src={provider.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
          )}

          {/* Gradiente Overlay para texto legível */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
        </header>

        {/* --- INFO DO PERFIL (Floating Card Otimizado) --- */}
        <div className="relative px-4 sm:px-6 -mt-20 sm:-mt-24 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Card: Mobile usa bg mais sólido para evitar repaint constante */}
            <Card className="bg-[#121214]/95 md:bg-[#121214]/60 backdrop-blur-none md:backdrop-blur-xl border-white/10 shadow-xl overflow-visible">
              <CardContent className="p-5 pt-0 sm:pt-6 flex flex-col sm:flex-row items-center sm:items-end gap-5">
                
                {/* Avatar com Borda Integrada */}
                <div className="-mt-16 sm:-mt-24 relative group shrink-0">
                  <Avatar className="h-28 w-28 sm:h-40 sm:w-40 border-[4px] sm:border-[6px] border-[#121214] shadow-2xl bg-zinc-800">
                    <AvatarImage
                      src={provider.logoUrl}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-3xl sm:text-4xl font-bold bg-zinc-800 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Status Indicator */}
                  <div
                    className={cn(
                      "absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-5 h-5 rounded-full border-4 border-[#121214]",
                      isSubscriptionActive ? "bg-green-500" : "bg-amber-500"
                    )}
                  />
                </div>

                {/* Textos e Info */}
                <div className="flex-grow text-center sm:text-left space-y-3 pb-2 w-full">
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      {provider.businessName}
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 max-w-lg mx-auto sm:mx-0 line-clamp-2">
                      Bem-vindo ao nosso espaço.
                    </p>
                  </div>

                  {provider.businessAddress && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-zinc-300">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                        <MapPin size={13} className="text-primary" />
                        {provider.businessAddress.city}
                      </span>
                      {provider.businessPhone && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                          <Phone size={13} className="text-primary" />
                          {provider.businessPhone}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Redes Sociais - Botões maiores no mobile para toque fácil */}
                  <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                    {provider.socialLinks?.instagram && (
                      <a
                        href={provider.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-pink-500 transition-colors p-2 bg-white/5 rounded-lg active:scale-95"
                      >
                        <Instagram size={20} />
                      </a>
                    )}
                    {provider.socialLinks?.whatsapp && (
                      <a
                        href={`https://wa.me/${provider.socialLinks.whatsapp.replace(/\D/g,"")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-green-500 transition-colors p-2 bg-white/5 rounded-lg active:scale-95"
                      >
                        <FaWhatsapp size={20} />
                      </a>
                    )}
                    {provider.socialLinks?.website && (
                      <a
                        href={provider.socialLinks.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-primary transition-colors p-2 bg-white/5 rounded-lg active:scale-95"
                      >
                        <Globe size={20} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Botão de Ação Principal */}
                <div className="w-full sm:w-auto pb-1">
                  <Button
                    onClick={handleGoToBooking}
                    disabled={!isSubscriptionActive}
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto font-bold h-12 px-8 text-base rounded-xl shadow-lg",
                      isSubscriptionActive
                        ? "bg-primary text-black hover:bg-primary/90 shadow-primary/20"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                    )}
                  >
                    {!isSubscriptionActive ? (
                      <>
                        <Lock size={18} className="mr-2" /> Indisponível
                      </>
                    ) : (
                      <>
                        <Calendar size={18} className="mr-2" /> Agendar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* --- ALERTA DE SERVIÇO INDISPONÍVEL --- */}
        {!isSubscriptionActive && (
          <div className="mx-4 mb-6">
             <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-bold text-amber-400 text-sm">Agendamento Indisponível</p>
                <p className="text-xs opacity-80 text-amber-200/80 mt-1 leading-relaxed">
                  Entre em contato por telefone ou WhatsApp para agendar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- CONTEÚDO PRINCIPAL --- */}
        <main className="px-4 sm:px-0 min-h-[400px]">
          {/* Navegação de Abas - Otimizada para toque */}
          <div className="flex justify-center sm:justify-start border-b border-white/10 mb-6">
            <nav className="flex w-full sm:w-auto justify-evenly sm:justify-start gap-0 sm:gap-8 relative">
              {["services", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-3 pt-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative px-4 flex-1 sm:flex-none outline-none",
                    activeTab === tab
                      ? "text-primary"
                      : "text-zinc-500"
                  )}
                >
                  {tab === "services" ? <Scissors size={16} /> : <Star size={16} />}
                  <span className="uppercase tracking-wider text-xs sm:text-sm">
                    {tab === "services" ? "Serviços" : "Avaliações"}
                  </span>
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_#daa520]"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "services" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-24">
                  {provider.services?.length > 0 ? (
                    provider.services.map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index < 5 ? index * 0.05 : 0 }} // Limita animação em listas longas
                      >
                        <Card className="bg-[#121214] border-white/5 hover:border-white/10 active:border-primary/30 transition-colors shadow-sm">
                          <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1.5 flex-1 w-full">
                              <div className="flex justify-between items-start w-full sm:block">
                                <h3 className="font-bold text-gray-100 text-base leading-tight">
                                  {service.name}
                                </h3>
                                {/* Preço visível no topo em mobile */}
                                <span className="sm:hidden font-bold text-primary text-base">
                                  R$ {service.price.toFixed(2)}
                                </span>
                              </div>
                              
                              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                {service.description || "Serviço especializado."}
                              </p>
                              
                              <div className="flex items-center gap-2 pt-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 px-2 border-white/10 text-zinc-400 font-normal bg-white/5 flex items-center gap-1"
                                >
                                  <Clock size={10} />
                                  {service.duration} min
                                </Badge>
                              </div>
                            </div>

                            <div className="hidden sm:flex flex-col items-end gap-3 min-w-[80px]">
                              <span className="font-bold text-lg text-primary">
                                R$ {service.price.toFixed(2)}
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={!isSubscriptionActive}
                                className={cn(
                                  "h-8 text-xs w-full",
                                  isSubscriptionActive
                                    ? "bg-white/5 text-white hover:bg-primary hover:text-black"
                                    : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                                )}
                                onClick={handleGoToBooking}
                              >
                                {isSubscriptionActive ? "Reservar" : "Fechado"}
                              </Button>
                            </div>

                            {/* Botão Mobile Full Width */}
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!isSubscriptionActive}
                                className={cn(
                                  "w-full sm:hidden h-9 text-xs mt-1 border-white/10",
                                  isSubscriptionActive
                                    ? "text-primary hover:bg-primary hover:text-black"
                                    : "text-zinc-600 bg-zinc-800/50"
                                )}
                                onClick={handleGoToBooking}
                              >
                                {isSubscriptionActive ? "Reservar Agora" : "Indisponível"}
                              </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center bg-[#121214] rounded-xl border border-dashed border-white/10">
                      <div className="bg-white/5 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <Scissors size={24} className="text-zinc-500" />
                      </div>
                      <h3 className="text-base font-medium text-white mb-1">
                        Nenhum serviço
                      </h3>
                      <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                        Ainda não há serviços cadastrados.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="pb-24">
                  <PublicReviewsSection providerId={provider.id} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default PublicBookingPage;
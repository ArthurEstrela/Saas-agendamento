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

  if (isLoading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        {/* Background de Carregamento */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[100px] opacity-20 animate-pulse" />
        <Loader2
          className="animate-spin text-primary relative z-10"
          size={48}
        />
      </div>
    );

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-4 text-center relative overflow-hidden">
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-red-900/10 rounded-full blur-[120px]" />
        <AlertCircle
          className="text-destructive mb-4 relative z-10"
          size={48}
        />
        <h1 className="text-2xl font-bold relative z-10">
          Perfil indisponível
        </h1>
        <p className="text-muted-foreground mt-2 relative z-10">
          {error || "Página não encontrada."}
        </p>
        <Button
          variant="outline"
          className="mt-6 relative z-10 border-white/10 hover:bg-white/5"
          onClick={() => navigate("/")}
        >
          Voltar ao Início
        </Button>
      </div>
    );
  }

  const initials = provider.businessName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative overflow-x-hidden selection:bg-primary/30 font-sans">
      {/* --- BACKGROUND AURORA --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] opacity-30" />
        <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] bg-purple-900/5 rounded-full blur-[150px] opacity-30" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="max-w-5xl mx-auto md:p-6 p-0 relative z-10">
        
        {/* --- ALERTA DE SERVIÇO INDISPONÍVEL (Se a assinatura expirou) --- */}
        {!isSubscriptionActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 backdrop-blur-md mx-4 sm:mx-0 mt-4 sm:mt-0 shadow-lg"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold text-amber-400">Agendamento Temporariamente Indisponível</p>
              <p className="text-sm opacity-80 text-amber-200/80">
                Este estabelecimento não está recebendo novos agendamentos pelo app no momento. Entre em contato por telefone ou WhatsApp.
              </p>
            </div>
          </motion.div>
        )}

        {/* --- HEADER / BANNER --- */}
        <header className="relative h-64 md:h-80 md:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl group border border-white/5">
          {/* Botão Voltar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="absolute top-4 left-4 z-30 bg-black/20 hover:bg-black/40 text-white backdrop-blur-md rounded-full border border-white/10 transition-all hover:scale-105"
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
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </header>

        {/* --- INFO DO PERFIL (Floating Card) --- */}
        <div className="relative px-4 sm:px-6 -mt-24 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl overflow-visible">
              <CardContent className="p-6 pt-0 sm:pt-6 flex flex-col sm:flex-row items-center sm:items-end gap-6">
                {/* Avatar com Borda Integrada */}
                <div className="-mt-20 sm:-mt-24 relative group">
                  <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-[6px] border-[#121214] shadow-2xl bg-zinc-800 transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage
                      src={provider.logoUrl}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-4xl font-bold bg-zinc-800 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status Indicator */}
                  {isSubscriptionActive ? (
                    <div
                      className="absolute bottom-4 right-4 sm:bottom-3 sm:right-3 bg-green-500 w-5 h-5 rounded-full border-4 border-[#121214]"
                      title="Aberto para Agendamentos"
                    />
                  ) : (
                    <div
                      className="absolute bottom-4 right-4 sm:bottom-3 sm:right-3 bg-amber-500 w-5 h-5 rounded-full border-4 border-[#121214]"
                      title="Indisponível"
                    />
                  )}
                </div>

                {/* Textos e Info */}
                <div className="flex-grow text-center sm:text-left space-y-3 pb-2 w-full">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
                      {provider.businessName}
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 max-w-lg mx-auto sm:mx-0 line-clamp-2">
                      Bem-vindo ao nosso espaço de agendamento online.
                    </p>
                  </div>

                  {provider.businessAddress && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-zinc-300">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                        <MapPin size={14} className="text-primary" />
                        {provider.businessAddress.city},{" "}
                        {provider.businessAddress.state}
                      </span>
                      {provider.businessPhone && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                          <Phone size={14} className="text-primary" />
                          {provider.businessPhone}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Redes Sociais */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                    {provider.socialLinks?.instagram && (
                      <a
                        href={provider.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-pink-500 transition-all p-2 hover:bg-white/5 rounded-lg hover:scale-110"
                      >
                        <Instagram size={20} />
                      </a>
                    )}
                    {provider.socialLinks?.whatsapp && (
                      <a
                        href={`https://wa.me/${provider.socialLinks.whatsapp.replace(
                          /\D/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-green-500 transition-all p-2 hover:bg-white/5 rounded-lg hover:scale-110"
                      >
                        <FaWhatsapp size={20} />
                      </a>
                    )}
                    {provider.socialLinks?.website && (
                      <a
                        href={provider.socialLinks.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-primary transition-all p-2 hover:bg-white/5 rounded-lg hover:scale-110"
                      >
                        <Globe size={20} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Botão de Ação Principal */}
                <div className="w-full sm:w-auto pb-2">
                  <Button
                    onClick={handleGoToBooking}
                    disabled={!isSubscriptionActive}
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto font-bold transition-all h-12 px-8 text-base rounded-xl",
                      isSubscriptionActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(218,165,32,0.2)] hover:shadow-[0_0_30px_rgba(218,165,32,0.4)]"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                    )}
                  >
                    {!isSubscriptionActive ? (
                      <>
                        <Lock size={18} className="mr-2" /> Indisponível
                      </>
                    ) : (
                      <>
                        <Calendar size={18} className="mr-2" /> Agendar Horário
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* --- CONTEÚDO PRINCIPAL --- */}
        <main className="px-4 sm:px-0 min-h-[400px]">
          {/* Navegação de Abas */}
          <div className="flex justify-center sm:justify-start border-b border-white/10 mb-8">
            <nav className="flex gap-8 relative">
              {["services", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-4 text-sm font-bold flex items-center gap-2 transition-colors relative px-2 outline-none",
                    activeTab === tab
                      ? "text-primary"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tab === "services" ? (
                    <Scissors size={18} />
                  ) : (
                    <Star size={18} />
                  )}
                  <span className="uppercase tracking-wider">
                    {tab === "services" ? "Serviços" : "Avaliações"}
                  </span>
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_#daa520]"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "services" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                  {provider.services?.length > 0 ? (
                    provider.services.map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="group relative overflow-hidden bg-zinc-900/40 border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                          {/* Efeito de brilho no hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />

                          <CardContent className="p-5 flex justify-between items-start gap-4 relative z-10">
                            <div className="space-y-2 flex-1">
                              <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors">
                                {service.name}
                              </h3>
                              <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                                {service.description ||
                                  "Serviço especializado com profissionais qualificados."}
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs border-white/10 text-zinc-400 font-normal bg-white/5 flex items-center gap-1"
                                >
                                  <Clock size={11} />
                                  {service.duration} min
                                </Badge>
                              </div>
                            </div>

                            <div className="text-right flex flex-col items-end gap-3 min-w-[80px]">
                              <span className="font-bold text-xl text-primary drop-shadow-sm">
                                R$ {service.price.toFixed(2)}
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={!isSubscriptionActive}
                                className={cn(
                                  "h-9 text-xs transition-all w-full",
                                  isSubscriptionActive
                                    ? "bg-white/5 text-white border border-white/10 hover:bg-primary hover:text-black hover:border-primary"
                                    : "bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed"
                                )}
                                onClick={handleGoToBooking}
                              >
                                {isSubscriptionActive ? "Reservar" : "Fechado"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <div className="bg-white/5 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Scissors size={32} className="text-zinc-500" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        Nenhum serviço encontrado
                      </h3>
                      <p className="text-zinc-500 max-w-xs mx-auto">
                        Este profissional ainda não cadastrou serviços para
                        agendamento online.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="pb-10">
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
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
  Facebook,
  Globe,
  Clock,
  ArrowLeft,
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

  const handleGoToBooking = () => {
    if (provider?.id) navigate(`/book/${provider.id}`);
    else setError("ID inválido.");
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white p-4 text-center">
        <AlertCircle className="text-destructive mb-4" size={48} />
        <h1 className="text-2xl font-bold">Perfil indisponível</h1>
        <p className="text-gray-400 mt-2">
          {error || "Página não encontrada."}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => navigate("/")}
        >
          Voltar ao Início
        </Button>
      </div>
    );
  }

  const initials = provider.businessName.substring(0, 2).toUpperCase();

  return (
    // MUDANÇA 1: Fundo #09090b (Zinc 950) em vez de preto puro
    <div className="bg-[#09090b] text-gray-100 min-h-screen pb-20 relative overflow-x-hidden selection:bg-primary/30">
      {/* MUDANÇA 2: Gradiente de luz no topo para dar profundidade */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      <div className="max-w-5xl mx-auto md:p-6 p-0 relative z-10">
        {/* Banner Hero */}
        <header className="relative h-56 md:h-80 md:rounded-3xl overflow-hidden bg-gray-900 border-b md:border border-white/5 shadow-2xl">
          {/* Botão Voltar Flutuante */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="absolute top-4 left-4 z-20 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md rounded-full border border-white/10"
          >
            <ArrowLeft size={20} />
          </Button>

          {provider.bannerUrl ? (
            <img
              src={provider.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-90" />
        </header>

        {/* Info do Perfil */}
        <div className="relative px-6 -mt-24 mb-10">
          {/* MUDANÇA 3: Card mais claro (gray-900/60) com borda sutil */}
          <Card className="bg-[#121214]/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-visible">
            <CardContent className="p-6 pt-0 sm:pt-6 flex flex-col sm:flex-row items-center sm:items-end gap-6">
              {/* Avatar */}
              <div className="-mt-20 sm:-mt-24 relative">
                <Avatar className="h-36 w-36 border-4 border-[#121214] shadow-2xl bg-gray-800">
                  <AvatarImage
                    src={provider.logoUrl}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl font-bold bg-gray-800 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute bottom-2 right-2 bg-green-500 w-5 h-5 rounded-full border-4 border-[#121214]"
                  title="Online"
                />
              </div>

              <div className="flex-grow text-center sm:text-left space-y-2 pb-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {provider.businessName}
                </h1>

                {provider.businessAddress && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                      <MapPin size={14} className="text-primary" />
                      {provider.businessAddress.city},{" "}
                      {provider.businessAddress.state}
                    </span>
                    {provider.businessPhone && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        <Phone size={14} className="text-primary" />{" "}
                        {provider.businessPhone}
                      </span>
                    )}
                  </div>
                )}

                {/* Redes Sociais */}
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-3">
                  {provider.socialLinks?.instagram && (
                    <a
                      href={provider.socialLinks.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-pink-500 transition-colors p-2 hover:bg-white/5 rounded-lg"
                    >
                      <Instagram size={22} />
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
                      className="text-gray-400 hover:text-green-500 transition-colors p-2 hover:bg-white/5 rounded-lg"
                    >
                      <FaWhatsapp size={22} />
                    </a>
                  )}
                  {provider.socialLinks?.website && (
                    <a
                      href={provider.socialLinks.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-white/5 rounded-lg"
                    >
                      <Globe size={22} />
                    </a>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-auto pb-2">
                <Button
                  onClick={handleGoToBooking}
                  size="lg"
                  className="w-full sm:w-auto font-bold bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_rgba(218,165,32,0.3)] hover:shadow-[0_0_30px_rgba(218,165,32,0.5)] transition-all h-12 px-8 text-base"
                >
                  <Calendar size={18} className="mr-2" /> Agendar Horário
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <main className="px-4 sm:px-0">
          {/* Navegação de Abas */}
          <div className="flex justify-center sm:justify-start border-b border-white/10 mb-8 sticky top-0 bg-[#09090b]/95 backdrop-blur-md z-20 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent">
            <nav className="flex gap-8">
              {["services", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-4 text-sm font-bold flex items-center gap-2 transition-colors relative px-2",
                    activeTab === tab
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-300"
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "services" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {provider.services?.length > 0 ? (
                    provider.services.map((service) => (
                      // MUDANÇA 4: Cards de serviço mais claros (bg-gray-900/50) e hover mais evidente
                      <Card
                        key={service.id}
                        className="bg-[#121214]/60 border-white/5 hover:border-primary/30 transition-all duration-300 group hover:bg-[#18181b]"
                      >
                        <CardContent className="p-5 flex justify-between items-start gap-4">
                          <div className="space-y-1.5">
                            <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors">
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2">
                              {service.description ||
                                "Profissional especializado."}
                            </p>
                            <div className="flex items-center gap-2 pt-2">
                              <Badge
                                variant="outline"
                                className="text-xs border-white/10 text-gray-400 font-normal bg-white/5"
                              >
                                <Clock size={12} className="mr-1.5" />{" "}
                                {service.duration} min
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <span className="font-bold text-xl text-primary drop-shadow-sm">
                              R$ {service.price.toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 text-xs bg-white/10 text-white hover:bg-primary hover:text-black transition-colors"
                              onClick={handleGoToBooking}
                            >
                              Reservar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <Scissors
                        size={40}
                        className="mx-auto mb-4 text-gray-600"
                      />
                      <p className="text-gray-400">
                        Nenhum serviço disponível no momento.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <PublicReviewsSection providerId={provider.id} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default PublicBookingPage;

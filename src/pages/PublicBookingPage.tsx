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
} from "lucide-react";
import { PublicReviewsSection } from "../components/Public/PublicReviewsSection";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

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
        if (!profile) {
          setError("Perfil de agendamento não encontrado.");
        } else {
          setProvider(profile);
        }
      } catch (err) {
        console.error("Falha ao carregar o perfil público:", err);
        setError("Ocorreu um erro ao carregar o perfil.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProvider();
  }, [slug]);

  const handleGoToBooking = () => {
    if (provider?.id) {
      navigate(`/book/${provider.id}`);
    } else {
      setError(
        "Não foi possível iniciar o agendamento. ID do prestador não encontrado."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#daa520]" size={48} />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center">
        <AlertCircle className="text-red-500" size={48} />
        <h1 className="mt-4 text-2xl font-bold">Oops! Algo deu errado.</h1>
        <p className="mt-2 text-gray-400">
          {error || "Perfil não encontrado."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* === HEADER ATUALIZADO COM O BANNER === */}
        <header className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-[-80px] bg-gray-800 border border-gray-700">
          {provider.bannerUrl ? (
            <img
              src={provider.bannerUrl}
              alt={`Banner de ${provider.businessName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            // Fallback caso não haja banner
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </header>

        <div className="relative bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={
                provider.logoUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  provider.businessName
                )}&background=1f2937&color=daa520&size=128`
              }
              alt={provider.businessName}
              className="h-32 w-32 rounded-full object-cover border-4 border-amber-500 -mt-24 sm:-mt-16 flex-shrink-0"
            />
            <div className="flex-grow text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                {provider.businessName}
              </h1>
              {provider.businessAddress && (
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-gray-300">
                  <span className="flex items-center gap-2">
                    <MapPin size={16} /> {provider.businessAddress.city},{" "}
                    {provider.businessAddress.state}
                  </span>
                  {provider.businessPhone && (
                    <span className="flex items-center gap-2">
                      <Phone size={16} /> {provider.businessPhone}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                {provider.socialLinks?.instagram && (
                  <a
                    href={provider.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-amber-500 transition-colors"
                  >
                    <Instagram size={22} />
                  </a>
                )}
                {provider.socialLinks?.facebook && (
                  <a
                    href={provider.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-amber-500 transition-colors"
                  >
                    <Facebook size={22} />
                  </a>
                )}
                {provider.socialLinks?.whatsapp && (
                  <a
                    href={`https://wa.me/${provider.socialLinks.whatsapp.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-green-500 transition-colors"
                  >
                    <FaWhatsapp size={22} />
                  </a>
                )}
                {provider.socialLinks?.website && (
                  <a
                    href={provider.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-amber-500 transition-colors"
                  >
                    <Globe size={22} />
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={handleGoToBooking}
              className="bg-[#daa520] hover:bg-[#c8961e] text-black font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-[#daa520]/20 w-full sm:w-auto"
            >
              <Calendar size={20} />
              Agendar Agora
            </button>
          </div>
        </div>

        <main className="mt-8">
          <div className="border-b border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("services")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "services"
                    ? "border-amber-500 text-amber-500"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                <Scissors size={16} />
                Serviços
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "reviews"
                    ? "border-amber-500 text-amber-500"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                <Star size={16} />
                Avaliações
              </button>
            </nav>
          </div>

          <div>
            <AnimatePresence mode="wait">
              {/* O motion.div precisa da 'key' para saber QUANDO animar.
        As props 'initial', 'animate', 'exit' definem COMO animar.
      */}
              <motion.div
                key={activeTab} // <-- 1. A key é essencial!
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* 2. A lógica condicional vai AQUI DENTRO,
             renderizando um ou outro componente.
        */}
                {activeTab === "services" && (
                  <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-3">
                      Serviços Oferecidos
                    </h2>
                    <ul className="divide-y divide-gray-700">
                      {provider.services?.length > 0 ? (
                        provider.services.map((service) => (
                          <li
                            key={service.id}
                            className="py-3 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-white">
                                {service.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {service.duration} min
                              </p>
                            </div>
                            <p className="font-bold text-lg text-[#daa520]">
                              R$ {service.price.toFixed(2)}
                            </p>
                          </li>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-4">
                          Nenhum serviço cadastrado.
                        </p>
                      )}
                    </ul>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <PublicReviewsSection providerId={provider.id} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PublicBookingPage;

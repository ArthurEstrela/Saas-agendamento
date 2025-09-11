import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { ServiceProviderProfile } from '../types';
import { getProviderProfileBySlug } from '../firebase/userService'; // Usamos nossa nova função
import { Loader2, AlertCircle, MapPin, Phone, Star, Calendar } from 'lucide-react';
import Footer from '../components/Footer';

const PublicBookingPage = () => {
  // O 'slug' vem da URL, ex: /agendar/:slug
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<ServiceProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError("Ocorreu um erro ao carregar o perfil.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProvider();
  }, [slug]);

  const handleGoToBooking = () => {
    // A mágica acontece aqui: navegamos para a nossa página de agendamento,
    // passando o ID do prestador na URL.
    navigate(`/book/${provider?.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#daa520]" size={48} />
        <p className="mt-4 text-lg">Carregando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center">
        <AlertCircle className="text-red-500" size={48} />
        <h1 className="mt-4 text-2xl font-bold">Oops! Algo deu errado.</h1>
        <p className="mt-2 text-gray-400">{error}</p>
        <Link to="/" className="mt-6 bg-[#daa520] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#c8961e]">
          Voltar para a Página Inicial
        </Link>
      </div>
    );
  }

  if (!provider) return null;

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header do Perfil */}
        <header className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-[-80px]">
          {/* Adicionar uma foto de capa aqui se tiver no seu 'types.ts' */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </header>

        <div className="relative bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <img
              src={provider.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.businessName)}&background=1f2937&color=daa520&size=128`}
              alt={provider.businessName}
              className="h-32 w-32 rounded-full object-cover border-4 border-[#daa520] -mt-24 sm:-mt-16"
            />
            <div className="flex-grow text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">{provider.businessName}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-gray-300">
                {provider.businessAddress && (
                  <span className="flex items-center gap-2">
                    <MapPin size={16} /> {provider.businessAddress.city}, {provider.businessAddress.state}
                  </span>
                )}
                {provider.businessPhone && (
                  <span className="flex items-center gap-2">
                    <Phone size={16} /> {provider.businessPhone}
                  </span>
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

        <main className="mt-8 space-y-8">
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-3">Serviços Oferecidos</h2>
            <ul className="divide-y divide-gray-700">
                {provider.services?.map(service => (
                    <li key={service.id} className="py-3 flex justify-between">
                        <div>
                            <p className="font-semibold text-white">{service.name}</p>
                            <p className="text-sm text-gray-400">{service.duration} min</p>
                        </div>
                        <p className="font-bold text-lg text-[#daa520]">R$ {service.price.toFixed(2)}</p>
                    </li>
                ))}
            </ul>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PublicBookingPage;
import React, { useState, useMemo, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import type { Service } from '../../types';
import { Tag, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ServiceSelection = ({ onNext }: { onNext: () => void }) => {
  const { serviceProvider, setService, selectedService } = useBookingStore();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(selectedService?.id || null);
  const [showError, setShowError] = useState(false);

  // Efeito que lida com o caso em que os dados do prestador nunca chegam.
  useEffect(() => {
    // Se após 3 segundos o prestador ainda não tiver sido carregado, exibe um erro.
    const timer = setTimeout(() => {
      // Usamos getState() para verificar o valor mais recente no store sem causar re-renderização.
      if (!useBookingStore.getState().serviceProvider) {
        setShowError(true);
      }
    }, 3000);

    // Limpa o temporizador se o componente for desmontado ou se o prestador for carregado.
    return () => clearTimeout(timer);
  }, []); // Executa este efeito apenas uma vez na montagem do componente.

  const services = useMemo(() => serviceProvider?.services || [], [serviceProvider]);

  const handleSelectService = (service: Service) => {
    setService(service);
    setSelectedServiceId(service.id);
  };

  const handleNext = () => {
    if (selectedServiceId) {
      onNext();
    } else {
      alert('Por favor, selecione um serviço para continuar.');
    }
  };

  // Estado 1: Carregamento inicial, antes do timeout
  if (!serviceProvider && !showError) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <Loader2 className="animate-spin text-[#daa520] h-12 w-12 mb-4" />
        <p className="text-white">A carregar serviços disponíveis...</p>
      </div>
    );
  }

  // Estado 2: Erro após o timeout
  if (showError || !serviceProvider) {
    return (
      <div className="text-center text-gray-400 py-16 bg-black/30 rounded-xl border border-dashed border-red-500/50 animate-fade-in-down">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-white">Erro ao Carregar Prestador</h3>
        <p className="text-sm mt-2 mb-6">Não foi possível encontrar as informações do estabelecimento.</p>
        <Link to="/" className="bg-red-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-red-500 transition-colors">
          Voltar e Escolher um Prestador
        </Link>
      </div>
    );
  }
  
  // Estado 3: Sucesso, o prestador foi carregado
  return (
    <div className="animate-fade-in-down">
      <h2 className="text-3xl font-bold text-white text-center mb-2">Selecione um Serviço</h2>
      <p className="text-gray-400 text-center mb-8">Escolha um dos serviços abaixo para iniciar o agendamento.</p>
      
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {services.length === 0 && (
          <div className="text-center text-gray-400 py-16 bg-black/30 rounded-xl border border-dashed border-gray-700">
            <Tag size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white">Nenhum serviço disponível</h3>
            <p className="text-sm mt-2">Este estabelecimento ainda não cadastrou nenhum serviço.</p>
          </div>
        )}

        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => handleSelectService(service)}
            className={`flex justify-between items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
              selectedServiceId === service.id 
                ? 'border-[#daa520] bg-[#daa520]/10 shadow-lg shadow-[#daa520]/10' 
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }`}
          >
            <div>
              <h3 className="font-semibold text-white text-lg">{service.name}</h3>
              <p className="text-gray-400 text-sm">{service.duration} minutos</p>
            </div>
            <div className="font-bold text-white text-lg">
              R$ {service.price.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      {services.length > 0 && (
        <div className="mt-8 text-center">
            <button 
                onClick={handleNext} 
                disabled={!selectedServiceId}
                className="bg-[#daa520] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#c8961e] transition-colors shadow-lg shadow-[#daa520]/20 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
            >
                Próximo
            </button>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;

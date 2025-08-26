import React, { useMemo } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import type { UserProfile, Service, Professional } from '../../types';

// Define as propriedades que o componente vai receber
interface ProfessionalSelectionProps {
  establishment: UserProfile; // O perfil do estabelecimento
}

const ProfessionalSelection = ({ establishment }: ProfessionalSelectionProps) => {
  // Pega o estado e as ações necessárias do nosso store de agendamento
  const {
    selectedServices,
    selectedProfessional,
    selectProfessional,
    totalPrice,
    totalDuration,
  } = useBookingStore();

  // Filtra a lista de profissionais para mostrar apenas aqueles
  // que podem realizar TODOS os serviços selecionados.
  const availableProfessionals = useMemo(() => {
    if (!establishment?.professionals || selectedServices.length === 0) {
      return (establishment.professionals as Professional[]) || [];
    }
    return (establishment.professionals as Professional[]).filter((prof) =>
      selectedServices.every((selService) =>
        (prof.services || []).some(
          (profService) => profService.id === selService.id
        )
      )
    );
  }, [establishment, selectedServices]);

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-white mb-6">
        2. Escolha o Profissional
      </h2>

      {/* Resumo do Pedido */}
      <div className="border-y border-gray-700 py-4 mb-6">
        <h3 className="text-xl font-bold text-white mb-2">
          Resumo dos Serviços
        </h3>
        <div className="flex justify-between items-center text-gray-300">
          <span>Duração total:</span>
          <span className="font-bold text-[#daa520]">
            {totalDuration} minutos
          </span>
        </div>
        <div className="flex justify-between items-center text-gray-300 mt-1">
          <span>Preço total:</span>
          <span className="font-bold text-[#daa520]">
            R$ {totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Lista de Profissionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableProfessionals.length > 0 ? (
          availableProfessionals.map((prof) => (
            <button
              key={prof.id}
              onClick={() => selectProfessional(prof)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 flex items-center gap-4 ${
                selectedProfessional?.id === prof.id
                  ? "bg-[#daa520]/20 border-[#daa520] shadow-lg shadow-[#daa520]/10"
                  : "bg-gray-800 border-gray-700 hover:border-[#daa520]/50"
              }`}
            >
              <img
                src={prof.photoURL || "https://placehold.co/150x150/1F2937/4B5563?text=Prof"}
                alt={prof.name}
                className="h-14 w-14 rounded-full object-cover border-2 border-gray-600"
              />
              <div>
                <p className="font-semibold text-white text-lg">{prof.name}</p>
              </div>
            </button>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-8">
            Nenhum profissional oferece todos os serviços selecionados.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfessionalSelection;

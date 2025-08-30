// src/components/booking/ProfessionalSelection.tsx

import React, { useMemo } from 'react';
import  useBookingStore  from '../../store/bookingStore';
import type { Professional } from '../../types';
import { Users, CheckCircle2, UserCheck } from 'lucide-react';

const ProfessionalSelection = () => {
  // Pegamos as informações necessárias do store
  const { 
    serviceProvider, 
    selectedServices, 
    selectedProfessional, 
    setProfessional 
  } = useBookingStore();

  // A MÁGICA ACONTECE AQUI: Filtramos os profissionais
  const availableProfessionals = useMemo(() => {
    if (!serviceProvider || !selectedServices || selectedServices.length === 0) {
      return [];
    }

    // Cria um conjunto (Set) com os IDs de todos os profissionais que podem realizar os serviços selecionados.
    // Usar um Set é eficiente para evitar duplicados.
    const professionalIds = new Set<string>();
    
    // Itera sobre cada serviço selecionado
    selectedServices.forEach(service => {
      // Itera sobre os IDs dos profissionais associados a esse serviço
      service.assignedProfessionals?.forEach(profId => {
        professionalIds.add(profId);
      });
    });

    // Filtra a lista completa de profissionais do estabelecimento,
    // mantendo apenas aqueles cujos IDs estão no nosso conjunto.
    return serviceProvider.professionals.filter(prof => professionalIds.has(prof.id));

  }, [serviceProvider, selectedServices]);

  const handleSelectProfessional = (professional: Professional | null) => {
    setProfessional(professional);
  };

  return (
    <div className="animate-fade-in-down">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">Escolha o Profissional</h2>
        <p className="text-gray-400 mt-1">Selecione com quem você gostaria de ser atendido.</p>
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {/* Opção "Qualquer Profissional" */}
        <div
          onClick={() => handleSelectProfessional(null)}
          className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
            selectedProfessional === null
              ? 'border-[#daa520] bg-[#daa520]/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }`}
        >
          {selectedProfessional === null && (
            <div className="absolute top-2 right-2 text-[#daa520]">
              <CheckCircle2 size={20} />
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="bg-gray-700 h-12 w-12 rounded-full flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Qualquer Profissional</h3>
              <p className="text-gray-400 text-sm">Deixe-nos escolher o melhor profissional disponível para você.</p>
            </div>
          </div>
        </div>

        {/* Lista de Profissionais Disponíveis */}
        {availableProfessionals.map((prof) => (
          <div
            key={prof.id}
            onClick={() => handleSelectProfessional(prof)}
            className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedProfessional?.id === prof.id
                ? 'border-[#daa520] bg-[#daa520]/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }`}
          >
            {selectedProfessional?.id === prof.id && (
              <div className="absolute top-2 right-2 text-[#daa520]">
                <CheckCircle2 size={20} />
              </div>
            )}
            <div className="flex items-center gap-4">
              <img
                src={prof.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=2d3748&color=ffffff`}
                alt={prof.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-white text-lg">{prof.name}</h3>
                {/* Você pode adicionar uma especialidade aqui se tiver no seu tipo `Professional` */}
                {/* <p className="text-gray-400 text-sm">Especialista em Cabelo</p> */}
              </div>
            </div>
          </div>
        ))}
        
        {/* Mensagem se nenhum profissional puder realizar o serviço */}
        {availableProfessionals.length === 0 && (
            <div className="text-center text-gray-400 py-10 bg-black/20 rounded-lg">
                <UserCheck size={40} className="mx-auto text-gray-600 mb-4"/>
                <p className="font-semibold text-white">Nenhum profissional específico encontrado</p>
                <p className="text-sm">Nenhum profissional está associado a todos os serviços selecionados. A opção "Qualquer Profissional" foi selecionada.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalSelection;
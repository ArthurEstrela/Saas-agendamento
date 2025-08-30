import React, { useMemo, useEffect } from 'react';
import type { Professional } from '../../types';
import { Users, CheckCircle2, UserCheck } from 'lucide-react';
import useBookingProcessStore from '../../store/bookingProcessStore';

const ProfessionalSelection = () => {
  const { 
    serviceProvider, 
    selectedServices, 
    selectedProfessional, 
    setSelectedProfessional 
  } = useBookingProcessStore();

  // LÓGICA CORRETA: Encontra profissionais que podem realizar TODOS os serviços selecionados.
  const availableProfessionals = useMemo(() => {
    if (!serviceProvider || !selectedServices || selectedServices.length === 0) {
      return [];
    }

    // Começa com a lista de profissionais do primeiro serviço
    let professionalIdsWhoCanDoAll = new Set<string>(selectedServices[0].professionalIds || []);

    // Itera sobre os outros serviços para encontrar a intersecção
    for (let i = 1; i < selectedServices.length; i++) {
      const currentServiceProfIds = new Set(selectedServices[i].professionalIds || []);
      professionalIdsWhoCanDoAll.forEach(profId => {
        // Se um profissional da nossa lista não pode fazer o serviço atual, ele é removido
        if (!currentServiceProfIds.has(profId)) {
          professionalIdsWhoCanDoAll.delete(profId);
        }
      });
    }

    // Retorna os objetos completos dos profissionais que sobraram na lista
    return serviceProvider.professionals.filter(prof => professionalIdsWhoCanDoAll.has(prof.id));
  }, [serviceProvider, selectedServices]);
  
  // LÓGICA EXTRA: Se o profissional selecionado não estiver mais disponível, reseta a seleção
  useEffect(() => {
    if (selectedProfessional) {
      const isSelectedProfStillAvailable = availableProfessionals.some(p => p.id === selectedProfessional.id);
      if (!isSelectedProfStillAvailable) {
        setSelectedProfessional(null); // Reseta para "Qualquer profissional"
      }
    }
  }, [availableProfessionals, selectedProfessional, setSelectedProfessional]);

  const handleSelectProfessional = (professional: Professional | null) => {
    setSelectedProfessional(professional);
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
              </div>
            </div>
          </div>
        ))}
        
        {/* Mensagem de feedback melhorada */}
        {selectedServices && selectedServices.length > 0 && availableProfessionals.length === 0 && (
            <div className="text-center text-gray-400 py-10 bg-black/20 rounded-lg">
                <UserCheck size={40} className="mx-auto text-gray-600 mb-4"/>
                <p className="font-semibold text-white">Nenhum profissional específico encontrado</p>
                <p className="text-sm">Nenhum profissional pode realizar todos os serviços selecionados juntos. Tente uma combinação diferente.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalSelection;
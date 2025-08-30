import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import type { Availability } from '../../types';
import { Clock, SlidersHorizontal, Loader2, Save } from 'lucide-react';

const daysOfWeek = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const INITIAL_AVAILABILITY: Availability = {
  slotInterval: 30,
  weekdays: {
    monday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    tuesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    wednesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    thursday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    friday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    saturday: { isOpen: false, startTime: '09:00', endTime: '12:00' },
    sunday: { isOpen: false, startTime: '09:00', endTime: '12:00' },
  },
};

const AvailabilityManagement = () => {
  const { userProfile, manageAvailability } = useAuthStore();
  const { showToast } = useToast();
  const [availability, setAvailability] = useState<Availability>(INITIAL_AVAILABILITY);
  const [isLoading, setIsLoading] = useState(false);

  // Efeito para carregar a disponibilidade salva do perfil do usuário
  useEffect(() => {
    if (userProfile?.availability) {
      // Mescla a disponibilidade salva com a inicial para garantir que todos os dias existam
      const profileAvailability = {
        ...INITIAL_AVAILABILITY,
        ...userProfile.availability,
        weekdays: {
          ...INITIAL_AVAILABILITY.weekdays,
          ...userProfile.availability.weekdays,
        },
      };
      setAvailability(profileAvailability);
    }
  }, [userProfile]);

  const handleToggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      weekdays: {
        ...prev.weekdays,
        [day]: { ...prev.weekdays[day], isOpen: !prev.weekdays[day].isOpen },
      },
    }));
  };

  const handleTimeChange = (day: string, type: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => ({
      ...prev,
      weekdays: {
        ...prev.weekdays,
        [day]: { ...prev.weekdays[day], [type]: value },
      },
    }));
  };
  
  const handleIntervalChange = (value: number) => {
    setAvailability(prev => ({ ...prev, slotInterval: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await manageAvailability(availability);
      showToast('Disponibilidade salva com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar disponibilidade.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-3xl font-bold text-white mb-2">Horários de Atendimento</h2>
      <p className="text-gray-400 mb-8">Defina seus horários de trabalho e a duração de cada encaixe na agenda.</p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Configuração do Intervalo de Encaixe */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                <SlidersHorizontal size={22}/> Intervalo dos Encaixes
            </h3>
            <p className="text-gray-400 mb-4 text-sm">
                Define a duração de cada slot de horário que o cliente pode agendar. (Ex: 30 min, resultará em horários como 09:00, 09:30, 10:00).
            </p>
            <div className="flex gap-2">
                {[15, 30, 45, 60].map(interval => (
                    <button
                        type="button"
                        key={interval}
                        onClick={() => handleIntervalChange(interval)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            availability.slotInterval === interval
                                ? 'bg-[#daa520] text-black'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                        {interval} min
                    </button>
                ))}
            </div>
        </div>

        {/* Configuração dos Dias da Semana */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                <Clock size={22}/> Horários por Dia
            </h3>
            <div className="space-y-4">
            {Object.entries(daysOfWeek).map(([key, name]) => {
                const dayData = availability.weekdays[key];
                return (
                <div key={key} className={`p-4 rounded-lg transition-all ${dayData.isOpen ? 'bg-gray-700/50' : 'bg-gray-800/40 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                    <label htmlFor={`toggle-${key}`} className="flex items-center cursor-pointer">
                        <div className="relative">
                        <input
                            type="checkbox"
                            id={`toggle-${key}`}
                            className="sr-only"
                            checked={dayData.isOpen}
                            onChange={() => handleToggleDay(key)}
                        />
                        <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                        </div>
                        <div className="ml-3 text-white font-bold text-lg">{name}</div>
                    </label>
                    <div className={`flex items-center gap-2 transition-opacity ${dayData.isOpen ? 'opacity-100' : 'opacity-0'}`}>
                        <input
                        type="time"
                        value={dayData.startTime}
                        onChange={(e) => handleTimeChange(key, 'startTime', e.target.value)}
                        disabled={!dayData.isOpen}
                        className="bg-gray-800 p-2 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-600"
                        />
                        <span>até</span>
                        <input
                        type="time"
                        value={dayData.endTime}
                        onChange={(e) => handleTimeChange(key, 'endTime', e.target.value)}
                        disabled={!dayData.isOpen}
                        className="bg-gray-800 p-2 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-600"
                        />
                    </div>
                    </div>
                </div>
                );
            })}
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <button
            type="submit"
            disabled={isLoading}
            className="bg-[#daa520] hover:bg-[#c8961e] text-black font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed text-lg"
            >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={20}/> Salvar Alterações</>}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AvailabilityManagement;
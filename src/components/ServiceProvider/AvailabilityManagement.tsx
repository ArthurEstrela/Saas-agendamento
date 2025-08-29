// src/components/ServiceProvider/AvailabilityManagement.tsx

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import { Loader2, Clock, Copy } from 'lucide-react';
import type { Availability } from '../../types';

// Nomes dos dias em minúsculo e na ordem correta para facilitar a manipulação
const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayTranslations: { [key: string]: string } = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const INITIAL_AVAILABILITY: Availability = {
  slotInterval: 15,
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
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (userProfile?.availability) {
      // Garante que todos os dias da semana existam no estado
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

  const handleDayChange = (day: string, field: string, value: any) => {
    setAvailability(prev => ({
      ...prev,
      weekdays: {
        ...prev.weekdays,
        [day]: {
          ...prev.weekdays[day as keyof typeof prev.weekdays],
          [field]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAvailability(prev => ({ ...prev, slotInterval: Number(e.target.value) }));
    setHasChanges(true);
  };
  
  const copyMondayToAll = () => {
    const mondaySchedule = availability.weekdays.monday;
    const newWeekdays = { ...availability.weekdays };
    dayNames.forEach(day => {
        if(day !== 'monday') {
            newWeekdays[day as keyof typeof newWeekdays] = { ...mondaySchedule };
        }
    });
    setAvailability(prev => ({...prev, weekdays: newWeekdays}));
    setHasChanges(true);
    showToast('Horário de Segunda copiado para os outros dias!', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await manageAvailability(availability);
      showToast('Disponibilidade atualizada com sucesso!', 'success');
      setHasChanges(false);
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar a disponibilidade.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in-down">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white">Gerenciar Disponibilidade</h2>
            <p className="text-gray-400 mt-1">Defina seus horários de trabalho e intervalos de atendimento.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna dos dias da semana */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Horários da Semana</h3>
                {dayNames.map(day => (
                <div key={day} className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 flex items-center justify-between transition-all duration-300">
                    <span className="font-semibold text-white w-28">{dayTranslations[day]}</span>
                    <div className="flex items-center gap-3">
                    <input
                        type="time"
                        value={availability.weekdays[day as keyof typeof availability.weekdays].startTime}
                        onChange={e => handleDayChange(day, 'startTime', e.target.value)}
                        disabled={!availability.weekdays[day as keyof typeof availability.weekdays].isOpen}
                        className="bg-gray-800 border border-gray-600 rounded-md p-2 text-white disabled:opacity-50"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="time"
                        value={availability.weekdays[day as keyof typeof availability.weekdays].endTime}
                        onChange={e => handleDayChange(day, 'endTime', e.target.value)}
                        disabled={!availability.weekdays[day as keyof typeof availability.weekdays].isOpen}
                        className="bg-gray-800 border border-gray-600 rounded-md p-2 text-white disabled:opacity-50"
                    />
                    </div>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" 
                                checked={availability.weekdays[day as keyof typeof availability.weekdays].isOpen}
                                onChange={e => handleDayChange(day, 'isOpen', e.target.checked)}
                            />
                            <div className={`block w-12 h-7 rounded-full transition-colors ${availability.weekdays[day as keyof typeof availability.weekdays].isOpen ? 'bg-[#daa520]' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${availability.weekdays[day as keyof typeof availability.weekdays].isOpen ? 'transform translate-x-full' : ''}`}></div>
                        </div>
                    </label>
                </div>
                ))}
            </div>

            {/* Coluna de configurações e ações */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Configurações Gerais</h3>
                    <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                        <label htmlFor="slotInterval" className="block mb-2 font-semibold text-white">Intervalo entre horários</label>
                        <select
                            id="slotInterval"
                            value={availability.slotInterval}
                            onChange={handleIntervalChange}
                            className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-[#daa520]"
                        >
                            <option value="15">15 minutos</option>
                            <option value="30">30 minutos</option>
                            <option value="45">45 minutos</option>
                            <option value="60">60 minutos</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-2">Define o intervalo em que os horários disponíveis serão mostrados para os clientes.</p>
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-bold text-white mb-2">Ações Rápidas</h3>
                    <button type="button" onClick={copyMondayToAll} className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold p-3 rounded-lg transition-colors">
                        <Copy size={18} />
                        Copiar horário de Segunda para todos
                    </button>
                </div>
            </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 flex justify-end">
            <button
                type="submit"
                disabled={!hasChanges || isLoading}
                className="bg-[#daa520] hover:bg-[#c8961e] text-black font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Alterações'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AvailabilityManagement;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Availability } from '../../types';

const defaultAvailability: Availability = {
  monday: { active: false, startTime: '09:00', endTime: '18:00' },
  tuesday: { active: false, startTime: '09:00', endTime: '18:00' },
  wednesday: { active: false, startTime: '09:00', endTime: '18:00' },
  thursday: { active: false, startTime: '09:00', endTime: '18:00' },
  friday: { active: false, startTime: '09:00', endTime: '18:00' },
  saturday: { active: false, startTime: '09:00', endTime: '18:00' },
  sunday: { active: false, startTime: '09:00', endTime: '18:00' },
};

const AvailabilityManagement = () => {
  const { userProfile, updateUserProfile, loading } = useAuth();
  const [availability, setAvailability] = useState<Availability>(userProfile?.availability || defaultAvailability);

  useEffect(() => {
    if (userProfile?.availability) {
      setAvailability(userProfile.availability);
    }
  }, [userProfile]);

  const handleDayToggle = (day: keyof Availability) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  const handleTimeChange = (day: keyof Availability, field: 'startTime' | 'endTime' | 'breakStartTime' | 'breakEndTime', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({ availability });
    alert("Disponibilidade salva com sucesso!"); // Feedback para o usuário
  };

  const daysOfWeek = [
    { key: 'monday', name: 'Segunda' },
    { key: 'tuesday', name: 'Terça' },
    { key: 'wednesday', name: 'Quarta' },
    { key: 'thursday', name: 'Quinta' },
    { key: 'friday', name: 'Sexta' },
    { key: 'saturday', name: 'Sábado' },
    { key: 'sunday', name: 'Domingo' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Gerenciar Disponibilidade</h2>
      <form onSubmit={handleSave} className="space-y-4">
        {daysOfWeek.map(({ key, name }) => (
          <div key={key} className={`p-4 rounded-lg transition-colors ${availability[key as keyof Availability].active ? 'bg-gray-700' : 'bg-gray-700/50'}`}>
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-white">{name}</label>
              <div 
                onClick={() => handleDayToggle(key as keyof Availability)}
                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${availability[key as keyof Availability].active ? 'bg-yellow-500' : 'bg-gray-600'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${availability[key as keyof Availability].active ? 'translate-x-6' : ''}`}></div>
              </div>
            </div>
            {availability[key as keyof Availability].active && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Início</label>
                  <input type="time" value={availability[key as keyof Availability].startTime} onChange={e => handleTimeChange(key as keyof Availability, 'startTime', e.target.value)} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fim</label>
                  <input type="time" value={availability[key as keyof Availability].endTime} onChange={e => handleTimeChange(key as keyof Availability, 'endTime', e.target.value)} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
                </div>
                
                {/* BLOCO DE CÓDIGO DO INTERVALO */}
                <div className="md:col-span-2 border-t border-gray-600 pt-4 mt-2">
                    <p className="text-sm text-gray-400 mb-2">Horário de Intervalo (opcional)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Início do Intervalo</label>
                            <input type="time" value={availability[key as keyof Availability].breakStartTime || ''} onChange={e => handleTimeChange(key as keyof Availability, 'breakStartTime', e.target.value)} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Fim do Intervalo</label>
                            <input type="time" value={availability[key as keyof Availability].breakEndTime || ''} onChange={e => handleTimeChange(key as keyof Availability, 'breakEndTime', e.target.value)} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
                        </div>
                    </div>
                </div>
                {/* FIM DO BLOCO DO INTERVALO */}
              </div>
            )}
          </div>
        ))}
        <button type="submit" disabled={loading} className="w-full mt-6 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
          {loading ? 'Salvando...' : 'Salvar Disponibilidade'}
        </button>
      </form>
    </div>
  );
};

export default AvailabilityManagement;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface DayAvailability {
  active: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

interface Availability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

const defaultDayAvailability: DayAvailability = {
  active: false,
  startTime: '09:00',
  endTime: '18:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
};

const AvailabilityManagement = () => {
  const { userProfile, updateUserProfile, loading, message, clearMessage } = useAuth();
  const [availability, setAvailability] = useState<Availability>(userProfile?.availability || {
    monday: { ...defaultDayAvailability },
    tuesday: { ...defaultDayAvailability },
    wednesday: { ...defaultDayAvailability },
    thursday: { ...defaultDayAvailability },
    friday: { ...defaultDayAvailability },
    saturday: { ...defaultDayAvailability },
    sunday: { ...defaultDayAvailability },
  });

  useEffect(() => {
    if (userProfile?.availability) {
      setAvailability(userProfile.availability);
    }
  }, [userProfile?.availability]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        clearMessage();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, clearMessage]);

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

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.userType !== 'serviceProvider') {
      console.error("Apenas prestadores de serviço podem gerenciar horários.");
      return;
    }
    await updateUserProfile({ availability });
  };

  if (userProfile?.userType !== 'serviceProvider') {
    return (
      <div className="text-center text-red-400 p-4">
        Você não tem permissão para gerenciar horários.
      </div>
    );
  }

  const daysOfWeek = [
    { key: 'monday', name: 'Segunda-feira' },
    { key: 'tuesday', name: 'Terça-feira' },
    { key: 'wednesday', name: 'Quarta-feira' },
    { key: 'thursday', name: 'Quinta-feira' },
    { key: 'friday', name: 'Sexta-feira' },
    { key: 'saturday', name: 'Sábado' },
    { key: 'sunday', name: 'Domingo' },
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl border border-yellow-600">
      <h3 className="text-2xl font-bold text-yellow-500 mb-6 text-center">Gerenciar Horários</h3>
      {message && (
        <div className="bg-yellow-800 text-yellow-100 p-3 rounded-md mb-4 text-sm text-center">
          {message}
        </div>
      )}

      <form onSubmit={handleSaveAvailability} className="space-y-6">
        {daysOfWeek.map(({ key, name }) => {
          const dayAvailability = availability[key as keyof Availability];
          return (
            <div key={key} className="bg-gray-700 p-4 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <label className="text-lg font-semibold text-gray-200">
                  {name}
                </label>
                <input
                  type="checkbox"
                  checked={dayAvailability.active}
                  onChange={() => handleDayToggle(key as keyof Availability)}
                  className="form-checkbox h-5 w-5 text-yellow-600 rounded border-gray-600 focus:ring-yellow-500"
                />
              </div>
              {dayAvailability.active && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor={`${key}-startTime`} className="block text-gray-400 text-sm mb-1">
                      Início do Expediente
                    </label>
                    <input
                      type="time"
                      id={`${key}-startTime`}
                      className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-600"
                      value={dayAvailability.startTime}
                      onChange={(e) => handleTimeChange(key as keyof Availability, 'startTime', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor={`${key}-endTime`} className="block text-gray-400 text-sm mb-1">
                      Fim do Expediente
                    </label>
                    <input
                      type="time"
                      id={`${key}-endTime`}
                      className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-600"
                      value={dayAvailability.endTime}
                      onChange={(e) => handleTimeChange(key as keyof Availability, 'endTime', e.target.value)}
                      required
                    />
                  </div>
                  {/* Horário de Pausa (opcional, pode ser adicionado mais tarde) */}
                  {/*
                  <div>
                    <label htmlFor={`${key}-breakStartTime`} className="block text-gray-400 text-sm mb-1">
                      Início da Pausa (Opcional)
                    </label>
                    <input
                      type="time"
                      id={`${key}-breakStartTime`}
                      className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-600"
                      value={dayAvailability.breakStartTime || ''}
                      onChange={(e) => handleTimeChange(key as keyof Availability, 'breakStartTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${key}-breakEndTime`} className="block text-gray-400 text-sm mb-1">
                      Fim da Pausa (Opcional)
                    </label>
                    <input
                      type="time"
                      id={`${key}-breakEndTime`}
                      className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-600"
                      value={dayAvailability.breakEndTime || ''}
                      onChange={(e) => handleTimeChange(key as keyof Availability, 'breakEndTime', e.target.value)}
                    />
                  </div>
                  */}
                </div>
              )}
            </div>
          );
        })}
        <button
          type="submit"
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out transform hover:scale-105"
          disabled={loading}
        >
          {loading ? 'Salvando Horários...' : 'Salvar Horários'}
        </button>
      </form>
    </div>
  );
};

export default AvailabilityManagement;

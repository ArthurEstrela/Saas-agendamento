import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Availability, Professional } from '../../types';

const defaultAvailability: Availability = {
  monday: { active: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  tuesday: { active: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  wednesday: { active: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  thursday: { active: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  friday: { active: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  saturday: { active: false, startTime: '09:00', endTime: '18:00' },
  sunday: { active: false, startTime: '09:00', endTime: '18:00' },
};

const daysOfWeek = [
    { key: 'monday', name: 'Segunda' }, { key: 'tuesday', name: 'Terça' },
    { key: 'wednesday', name: 'Quarta' }, { key: 'thursday', name: 'Quinta' },
    { key: 'friday', name: 'Sexta' }, { key: 'saturday', name: 'Sábado' },
    { key: 'sunday', name: 'Domingo' },
];

// Componente para editar a agenda de UM profissional
const AvailabilityEditor = ({ professional, onSave, loading }: { professional: Professional, onSave: (id: string, availability: Availability) => void, loading: boolean }) => {
    const [availability, setAvailability] = useState<Availability>(professional.availability || defaultAvailability);

    useEffect(() => {
        setAvailability(professional.availability || defaultAvailability)
    }, [professional]);

    const handleDayToggle = (day: keyof Availability) => {
        setAvailability(prev => ({ ...prev, [day]: { ...prev[day], active: !prev[day].active } }));
    };

    const handleTimeChange = (day: keyof Availability, field: 'startTime' | 'endTime' | 'breakStartTime' | 'breakEndTime', value: string) => {
        setAvailability(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(professional.id, availability);
    };

    return (
        <div className="mt-6">
            <h3 className="text-xl font-bold text-white mb-4">Editando agenda de <span className="text-yellow-400">{professional.name}</span></h3>
            <form onSubmit={handleSave} className="space-y-4">
                {daysOfWeek.map(({ key, name }) => (
                    <div key={key} className={`p-4 rounded-lg transition-colors ${availability[key as keyof Availability].active ? 'bg-gray-700' : 'bg-gray-700/50'}`}>
                        <div className="flex items-center justify-between">
                            <label className="text-lg font-semibold text-white">{name}</label>
                            <div onClick={() => handleDayToggle(key as keyof Availability)} className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${availability[key as keyof Availability].active ? 'bg-yellow-500' : 'bg-gray-600'}`}>
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
                            </div>
                        )}
                    </div>
                ))}
                <button type="submit" disabled={loading} className="w-full mt-6 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
                    {loading ? 'Salvando...' : `Salvar Agenda de ${professional.name}`}
                </button>
            </form>
        </div>
    );
};

const AvailabilityManagement = () => {
  const { userProfile, updateUserProfile, loading } = useAuth();
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (userProfile?.professionals && userProfile.professionals.length > 0 && !selectedProfessional) {
      setSelectedProfessional(userProfile.professionals[0]);
    }
  }, [userProfile?.professionals, selectedProfessional]);

  const handleSaveAvailability = async (professionalId: string, availability: Availability) => {
    if (!userProfile?.professionals) return;

    const updatedProfessionals = userProfile.professionals.map(p => 
        p.id === professionalId ? { ...p, availability } : p
    );

    await updateUserProfile({ professionals: updatedProfessionals });
    
    setSuccessMessage(`Disponibilidade de ${selectedProfessional?.name} salva com sucesso!`);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  if (!userProfile?.professionals || userProfile.professionals.length === 0) {
      return (
          <div>
              <h2 className="text-2xl font-bold text-white mb-6">Gerenciar Disponibilidade</h2>
              <p className="text-center text-gray-500 py-8">Você precisa cadastrar profissionais na aba "Profissionais" antes de configurar a agenda.</p>
          </div>
      )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Gerenciar Disponibilidade</h2>
      
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Selecione um profissional para editar a agenda:</label>
        <div className="flex flex-wrap gap-2">
            {userProfile.professionals.map(prof => (
                <button 
                    key={prof.id} 
                    onClick={() => setSelectedProfessional(prof)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedProfessional?.id === prof.id ? 'bg-yellow-500 text-black' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                >
                    {prof.name}
                </button>
            ))}
        </div>
      </div>
      
      {selectedProfessional ? (
        <AvailabilityEditor professional={selectedProfessional} onSave={handleSaveAvailability} loading={loading} />
      ) : (
        <p className="text-center text-gray-400 py-8">Selecione um profissional acima.</p>
      )}
    </div>
  );
};

export default AvailabilityManagement;

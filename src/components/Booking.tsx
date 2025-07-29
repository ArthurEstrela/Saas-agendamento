import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import type { ProfessionalProfile, Service, Appointment } from '../types';

interface BookingProps {
  professional: ProfessionalProfile;
  onBack: () => void;
}

const Booking = ({ professional, onBack }: BookingProps) => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Lógica para gerar e buscar horários disponíveis
  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    // Simulação de horários disponíveis. Substituir pela sua lógica real.
    const times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
    setAvailableTimes(times);
  }, [selectedDate, selectedService]);

  const handleBookAppointment = async () => {
    if (!currentUser || !selectedDate || !selectedService || !selectedTime) {
      alert("Por favor, selecione data, serviço e horário.");
      return;
    }
    const newAppointment: Omit<Appointment, 'id'> = {
      clientId: currentUser.uid,
      serviceProviderId: professional.uid,
      serviceId: selectedService.id,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      status: 'pending',
      createdAt: new Date(),
    };
    await addDoc(collection(db, 'appointments'), newAppointment);
    alert('Agendamento realizado com sucesso!');
    onBack();
  };

  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4 text-yellow-500">{"< Voltar"}</button>
      <h2 className="text-2xl font-bold text-yellow-500 mb-4">Agendar com {professional.displayName}</h2>

      {/* Seletor de Data (Calendário) */}
      <div>
        <h3 className="text-xl mb-2">Selecione a data</h3>
        {/* Implementar um componente de calendário aqui */}
        <input type="date" onChange={e => setSelectedDate(new Date(e.target.value))} className="p-2 bg-gray-800 rounded"/>
      </div>

      {/* Seletor de Serviço */}
      {selectedDate && (
        <div className="mt-4">
          <h3 className="text-xl mb-2">Selecione o serviço</h3>
          <div className="space-y-2">
            {professional.services?.map(service => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`w-full p-2 text-left rounded ${selectedService?.id === service.id ? 'bg-yellow-600' : 'bg-gray-700'}`}
              >
                {service.name} ({service.duration} min) - R$ {service.price}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seletor de Horário */}
      {selectedService && (
        <div className="mt-4">
          <h3 className="text-xl mb-2">Selecione o horário</h3>
          <div className="grid grid-cols-4 gap-2">
            {availableTimes.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`p-2 rounded ${selectedTime === time ? 'bg-yellow-600' : 'bg-gray-700'}`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botão de Agendamento */}
      {selectedTime && (
        <button onClick={handleBookAppointment} className="w-full bg-green-600 p-3 rounded mt-6">
          Confirmar Agendamento
        </button>
      )}
    </div>
  );
};

export default Booking;
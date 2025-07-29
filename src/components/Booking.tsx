import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import type { UserProfile, Service, Appointment, Availability } from '../types';

interface BookingProps {
  professional: UserProfile;
  onBack: () => void;
}

const Booking = ({ professional, onBack }: BookingProps) => {
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);

  // Lógica para gerar e buscar horários disponíveis
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!selectedDate || !selectedService || !professional.availability) {
        setAvailableTimes([]);
        return;
      }
      
      setLoadingTimes(true);
      setAvailableTimes([]);
      setSelectedTime('');

      try {
        // Correção: Acessar a chave do dia da semana de forma segura
        const dayKey = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof Availability;
        const dayAvailability = professional.availability[dayKey];

        if (!dayAvailability || !dayAvailability.active) {
            setLoadingTimes(false);
            return;
        }
        
        const serviceDuration = selectedService.duration;
        const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
        const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);

        const slots: string[] = [];
        let currentTime = new Date(selectedDate);
        currentTime.setHours(startHour, startMinute, 0, 0);
        
        let endTime = new Date(selectedDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        // Buscar agendamentos existentes para o dia
        const q = query(
            collection(db, 'appointments'),
            where('serviceProviderId', '==', professional.uid),
            where('date', '==', selectedDate.toISOString().split('T')[0])
        );
        const querySnapshot = await getDocs(q);
        const bookedTimes = new Set(querySnapshot.docs.map(doc => doc.data().time));

        while (currentTime < endTime) {
          const timeString = currentTime.toTimeString().substring(0, 5);
          if (!bookedTimes.has(timeString)) {
              slots.push(timeString);
          }
          currentTime.setMinutes(currentTime.getMinutes() + serviceDuration);
        }
        
        setAvailableTimes(slots);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        setAvailableTimes([]); // Garante que a lista fique vazia em caso de erro
      } finally {
        setLoadingTimes(false);
      }
    };

    fetchAvailableTimes();
  }, [selectedDate, selectedService, professional]);

  const handleBookAppointment = async () => {
    if (!userProfile || !selectedDate || !selectedService || !selectedTime) {
      // Trocar alert por um modal/toast em produção
      alert("Por favor, selecione data, serviço e horário.");
      return;
    }
    setIsBooking(true);
    const newAppointment: Omit<Appointment, 'id'> = {
      clientId: userProfile.uid,
      serviceProviderId: professional.uid,
      serviceId: selectedService.id,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      status: 'pending',
      createdAt: new Date(),
    };
    await addDoc(collection(db, 'appointments'), newAppointment);
    alert('Agendamento realizado com sucesso!');
    setIsBooking(false);
    onBack();
  };
  
  // Define a data mínima para o input de data como hoje
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-8">
      <header className="flex items-center mb-10">
        <button onClick={onBack} className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>Voltar</span>
        </button>
      </header>
      
      <main className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Agendar com</h1>
            <p className="text-2xl text-yellow-400">{professional.establishmentName}</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 space-y-8">
            {/* Passo 1: Selecionar Serviço */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">1. Escolha o Serviço</h2>
                <div className="space-y-3">
                    {professional.services && professional.services.length > 0 ? professional.services.map(service => (
                        <button key={service.id} onClick={() => setSelectedService(service)} className={`w-full text-left p-4 rounded-lg transition-all border-2 ${selectedService?.id === service.id ? 'bg-yellow-500/10 border-yellow-500' : 'bg-gray-700 border-transparent hover:border-yellow-600'}`}>
                            <p className="font-semibold text-white">{service.name}</p>
                            <p className="text-sm text-gray-400">{service.duration} min - R$ {service.price.toFixed(2)}</p>
                        </button>
                    )) : <p className="text-gray-500">Este profissional ainda não cadastrou serviços.</p>}
                </div>
            </div>

            {/* Passo 2: Selecionar Data */}
            {selectedService && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">2. Escolha a Data</h2>
                    <input 
                      type="date" 
                      min={getTodayString()}
                      onChange={e => setSelectedDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)} 
                      className="w-full bg-gray-700 text-white border-gray-600 rounded-lg p-3 focus:ring-yellow-500 focus:border-yellow-500" 
                    />
                </div>
            )}

            {/* Passo 3: Selecionar Horário */}
            {selectedDate && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">3. Escolha o Horário</h2>
                    {loadingTimes ? <p className="text-gray-400">Carregando horários...</p> : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {availableTimes.length > 0 ? availableTimes.map(time => (
                                <button key={time} onClick={() => setSelectedTime(time)} className={`p-3 rounded-lg font-semibold transition-colors ${selectedTime === time ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    {time}
                                </button>
                            )) : <p className="text-gray-500 col-span-full text-center">Nenhum horário disponível para esta data.</p>}
                        </div>
                    )}
                </div>
            )}
        </div>

        {selectedTime && (
            <div className="mt-8">
                <button onClick={handleBookAppointment} disabled={isBooking} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500 text-lg">
                    {isBooking ? 'Agendando...' : `Confirmar Agendamento para ${selectedTime}`}
                </button>
            </div>
        )}
      </main>
    </div>
  );
};

export default Booking;

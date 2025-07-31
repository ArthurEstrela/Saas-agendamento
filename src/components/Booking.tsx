import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Calendar.css';
import type { UserProfile, Service, Appointment, Availability, DayAvailability } from '../types';

// O tipo de valor que o react-calendar usa
type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// Tipo para os horários, agora com mais status
interface TimeSlot {
  time: string;
  status: 'available' | 'booked' | 'break' | 'past';
}

interface BookingProps {
  professional: UserProfile;
  onBack?: () => void; // A função onBack agora é opcional
}

const Booking = ({ professional, onBack }: BookingProps) => {
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState(''); // Novo estado para mensagens

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      // Reseta estados ao iniciar a busca
      setTimeSlots([]);
      setSelectedTime('');
      setAvailabilityMessage('');

      if (!selectedDate || Array.isArray(selectedDate) || !selectedService) {
        if (selectedService) {
          setAvailabilityMessage('Por favor, selecione uma data.');
        }
        return;
      }
      
      setLoadingTimes(true);

      try {
        if (!professional.availability) {
          setAvailabilityMessage('Este profissional ainda não configurou seus horários de atendimento.');
          return;
        }

        const dayKey = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof Availability;
        const dayAvailability = professional.availability[dayKey];

        if (!dayAvailability || !dayAvailability.active) {
            setAvailabilityMessage('O profissional não atende neste dia da semana.');
            return;
        }
        
        const serviceDuration = selectedService.duration;
        if (!serviceDuration || serviceDuration <= 0) {
            setAvailabilityMessage('A duração do serviço selecionado é inválida.');
            return;
        }

        const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
        const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);

        const slots: TimeSlot[] = [];
        let currentTime = new Date(selectedDate);
        currentTime.setHours(startHour, startMinute, 0, 0);
        
        let endTime = new Date(selectedDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        let breakStartTimeObj: Date | null = null;
        let breakEndTimeObj: Date | null = null;
        if (dayAvailability.breakStartTime && dayAvailability.breakEndTime) {
            const [breakStartHour, breakStartMinute] = dayAvailability.breakStartTime.split(':').map(Number);
            breakStartTimeObj = new Date(selectedDate);
            breakStartTimeObj.setHours(breakStartHour, breakStartMinute, 0, 0);

            const [breakEndHour, breakEndMinute] = dayAvailability.breakEndTime.split(':').map(Number);
            breakEndTimeObj = new Date(selectedDate);
            breakEndTimeObj.setHours(breakEndHour, breakEndMinute, 0, 0);
        }

        const q = query(
            collection(db, 'appointments'),
            where('serviceProviderId', '==', professional.uid),
            where('date', '==', selectedDate.toISOString().split('T')[0])
        );
        const querySnapshot = await getDocs(q);
        const bookedTimes = new Set(querySnapshot.docs.map(doc => doc.data().time));

        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();

        while (currentTime < endTime) {
          const timeString = currentTime.toTimeString().substring(0, 5);
          
          const slotEndTime = new Date(currentTime.getTime() + serviceDuration * 60000);
          
          const isInBreak = breakStartTimeObj && breakEndTimeObj && 
                            (currentTime < breakEndTimeObj && slotEndTime > breakStartTimeObj);

          const isBooked = bookedTimes.has(timeString);
          const isPast = isToday && currentTime < now;

          let status: 'available' | 'booked' | 'break' | 'past' = 'available';
          if (isPast) {
            status = 'past';
          } else if (isBooked) {
            status = 'booked';
          } else if (isInBreak) {
            status = 'break';
          }

          slots.push({ time: timeString, status: status });
          
          currentTime.setMinutes(currentTime.getMinutes() + 15); // Gera horários a cada 15 minutos
        }
        
        if (slots.length === 0) {
            setAvailabilityMessage('Não foram encontrados horários disponíveis para este dia.');
        }

        setTimeSlots(slots);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        setAvailabilityMessage('Ocorreu um erro ao carregar os horários.');
      } finally {
        setLoadingTimes(false);
      }
    };

    fetchAvailableTimes();
  }, [selectedDate, selectedService, professional]);

  const handleBookAppointment = async () => {
    if (!userProfile) {
        alert("Você precisa estar logado para fazer um agendamento. Por favor, faça login ou crie uma conta.");
        return;
    }
    if (!selectedDate || Array.isArray(selectedDate) || !selectedService || !selectedTime) {
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
    if (onBack) onBack();
  };

  const getButtonClass = (status: 'available' | 'booked' | 'break' | 'past', time: string) => {
    if (status === 'available') {
      return selectedTime === time 
        ? 'bg-yellow-500 text-black' 
        : 'bg-green-600/50 hover:bg-green-500/80 text-white';
    }
    return 'bg-red-500/40 text-gray-400 cursor-not-allowed';
  };

  const calculateMaxDate = () => {
    const advanceDays = professional.bookingAdvanceDays || 30;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceDays);
    return maxDate;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-8">
      {onBack && (
        <header className="flex items-center mb-10">
          <button onClick={onBack} className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              <span>Voltar</span>
          </button>
        </header>
      )}
      
      <main className="max-w-2xl mx-auto">
        <div className={`text-center mb-8 ${!onBack ? 'pt-8' : ''}`}>
            <img 
              src={professional.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} 
              alt={`Foto de ${professional.establishmentName}`}
              className="h-24 w-24 rounded-full object-cover mx-auto mb-4 border-4 border-gray-700"
            />
            <h1 className="text-3xl font-bold text-white">Agendar com</h1>
            <p className="text-2xl text-yellow-400">{professional.establishmentName}</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 space-y-8">
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

            {selectedService && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">2. Escolha a Data</h2>
                    <Calendar
                      onChange={setSelectedDate}
                      value={selectedDate}
                      minDate={new Date()}
                      maxDate={calculateMaxDate()}
                      className="react-calendar"
                    />
                </div>
            )}

            {selectedDate && !Array.isArray(selectedDate) && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">3. Escolha o Horário</h2>
                    {loadingTimes ? <p className="text-gray-400">Carregando horários...</p> : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {timeSlots.length > 0 ? timeSlots.map(slot => (
                                <button 
                                  key={slot.time} 
                                  onClick={() => slot.status === 'available' && setSelectedTime(slot.time)} 
                                  disabled={slot.status !== 'available'}
                                  className={`p-3 rounded-lg font-semibold transition-colors ${getButtonClass(slot.status, slot.time)}`}
                                >
                                    {slot.time}
                                </button>
                            )) : <p className="text-gray-500 col-span-full text-center">{availabilityMessage}</p>}
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

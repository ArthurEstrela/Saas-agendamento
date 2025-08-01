import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Calendar.css';
import type { UserProfile, Service, Appointment, Professional } from '../types';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface TimeSlot {
  time: string;
  status: 'available' | 'booked' | 'break' | 'past';
}

interface BookingProps {
  professional: UserProfile; // Este é o perfil do estabelecimento
  onBack?: () => void;
}

// Componente de Modal para substituir os alertas
const Modal = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center w-full max-w-sm">
      <p className="text-white text-lg mb-6">{message}</p>
      <button
        onClick={onClose}
        className="bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors w-full"
      >
        OK
      </button>
    </div>
  </div>
);

const Booking = ({ professional: establishment, onBack }: BookingProps) => {
  const { userProfile } = useAuth();
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]); // <-- MUDANÇA: AGORA É UM ARRAY
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [modalInfo, setModalInfo] = useState<{ message: string; onConfirm?: () => void } | null>(null);

  // Calcula a duração total e o preço total dos serviços selecionados
  const { totalDuration, totalPrice } = useMemo(() => {
    return selectedServices.reduce(
      (acc, service) => {
        acc.totalDuration += service.duration;
        acc.totalPrice += service.price;
        return acc;
      },
      { totalDuration: 0, totalPrice: 0 }
    );
  }, [selectedServices]);

  useEffect(() => {
    setSelectedServices([]);
    setSelectedDate(new Date());
    setTimeSlots([]);
    setSelectedTime('');
  }, [selectedProfessional]);
  
  // NOVA FUNÇÃO: Lida com a seleção de múltiplos serviços
  const handleToggleService = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
    setSelectedTime(''); // Reseta a hora ao mudar os serviços
  };

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      setTimeSlots([]);
      setSelectedTime('');
      setAvailabilityMessage('');

      if (!selectedDate || Array.isArray(selectedDate) || selectedServices.length === 0 || !selectedProfessional) {
        if (selectedProfessional) setAvailabilityMessage('Por favor, selecione pelo menos um serviço.');
        return;
      }
      
      setLoadingTimes(true);

      try {
        if (!selectedProfessional.availability) {
          setAvailabilityMessage('Este profissional ainda não configurou seus horários.');
          return;
        }

        const dayKey = (selectedDate as Date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof selectedProfessional.availability;
        const dayAvailability = selectedProfessional.availability[dayKey];

        if (!dayAvailability || !dayAvailability.active) {
            setAvailabilityMessage('O profissional não atende neste dia da semana.');
            return;
        }
        
        const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
        const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);

        const slots: TimeSlot[] = [];
        let currentTime = new Date(selectedDate as Date);
        currentTime.setHours(startHour, startMinute, 0, 0);
        
        let endTime = new Date(selectedDate as Date);
        endTime.setHours(endHour, endMinute, 0, 0);

        let breakStartTimeObj: Date | null = null;
        let breakEndTimeObj: Date | null = null;
        if (dayAvailability.breakStartTime && dayAvailability.breakEndTime) {
            const [breakStartHour, breakStartMinute] = dayAvailability.breakStartTime.split(':').map(Number);
            breakStartTimeObj = new Date(selectedDate as Date);
            breakStartTimeObj.setHours(breakStartHour, breakStartMinute, 0, 0);

            const [breakEndHour, breakEndMinute] = dayAvailability.breakEndTime.split(':').map(Number);
            breakEndTimeObj = new Date(selectedDate as Date);
            breakEndTimeObj.setHours(breakEndHour, breakEndMinute, 0, 0);
        }

        const q = query(
            collection(db, 'appointments'),
            where('serviceProviderId', '==', establishment.uid),
            where('professionalId', '==', selectedProfessional.id),
            where('date', '==', (selectedDate as Date).toISOString().split('T')[0])
        );
        const querySnapshot = await getDocs(q);
        
        const bookedIntervals: { start: Date, end: Date }[] = [];
        querySnapshot.docs.forEach(doc => {
            const appointment = doc.data() as Appointment;
            const professionalForBooking = establishment.professionals?.find(p => p.id === appointment.professionalId);
            
            const durationOfBooking = appointment.serviceIds.reduce((acc, serviceId) => {
                const service = professionalForBooking?.services.find(s => s.id === serviceId);
                return acc + (service?.duration || 0);
            }, 0);

            if (durationOfBooking > 0) {
                const [hour, minute] = appointment.time.split(':').map(Number);
                const startDate = new Date(selectedDate as Date);
                startDate.setHours(hour, minute, 0, 0);
                const endDate = new Date(startDate.getTime() + durationOfBooking * 60000);
                bookedIntervals.push({ start: startDate, end: endDate });
            }
        });

        const now = new Date();
        const isToday = (selectedDate as Date).toDateString() === now.toDateString();

        while (currentTime < endTime) {
          const timeString = currentTime.toTimeString().substring(0, 5);
          const slotEndTime = new Date(currentTime.getTime() + totalDuration * 60000);
          
          const isInBreak = breakStartTimeObj && breakEndTimeObj && (currentTime < breakEndTimeObj && slotEndTime > breakStartTimeObj);
          
          const isOverlapping = bookedIntervals.some(interval => 
              currentTime < interval.end && slotEndTime > interval.start
          );

          const isPast = isToday && currentTime < now;

          let status: 'available' | 'booked' | 'break' | 'past' = 'available';
          if (isPast) status = 'past';
          else if (isOverlapping) status = 'booked';
          else if (isInBreak) status = 'break';

          if (slotEndTime <= endTime) {
            slots.push({ time: timeString, status: status });
          }
          
          currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
        
        if (slots.filter(s => s.status === 'available').length === 0) {
            setAvailabilityMessage('Não foram encontrados horários disponíveis para este dia e duração.');
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
  }, [selectedDate, selectedServices, selectedProfessional, establishment, totalDuration]);

  const handleBookAppointment = async () => {
    if (!userProfile) {
        setModalInfo({ message: "Você precisa estar logado para agendar." });
        return;
    }
    if (selectedServices.length === 0 || !selectedDate || Array.isArray(selectedDate) || !selectedTime || !selectedProfessional) {
      setModalInfo({ message: "Por favor, selecione profissional, serviço(s), data e horário." });
      return;
    }
    setIsBooking(true);
    const newAppointment: Omit<Appointment, 'id'> = {
      clientId: userProfile.uid,
      serviceProviderId: establishment.uid,
      professionalId: selectedProfessional.id,
      serviceIds: selectedServices.map(s => s.id), // <-- SALVA O ARRAY DE IDs
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      status: 'pending',
      createdAt: new Date(),
    };
    await addDoc(collection(db, 'appointments'), newAppointment);
    setIsBooking(false);
    setModalInfo({ message: 'Agendamento realizado com sucesso!', onConfirm: () => { if (onBack) onBack(); } });
  };
  
  const getButtonClass = (status: TimeSlot['status'], time: string) => {
    if (status === 'available') {
      return selectedTime === time 
        ? 'bg-yellow-500 text-black' 
        : 'bg-green-600/50 hover:bg-green-500/80 text-white';
    }
    return 'bg-red-500/40 text-gray-400 cursor-not-allowed';
  };

  const calculateMaxDate = () => {
    const advanceDays = establishment.bookingAdvanceDays || 30;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceDays);
    return maxDate;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-8">
      {modalInfo && (
        <Modal
          message={modalInfo.message}
          onClose={() => {
            const onConfirmAction = modalInfo.onConfirm;
            setModalInfo(null);
            if (onConfirmAction) onConfirmAction();
          }}
        />
      )}
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
              src={establishment.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} 
              alt={`Foto de ${establishment.establishmentName}`}
              className="h-24 w-24 rounded-full object-cover mx-auto mb-4 border-4 border-gray-700"
            />
            <h1 className="text-3xl font-bold text-white">Agendar em</h1>
            <p className="text-2xl text-yellow-400">{establishment.establishmentName}</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 space-y-8">
            <div>
                <h2 className="text-xl font-bold text-white mb-4">1. Escolha o Profissional</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {establishment.professionals && establishment.professionals.length > 0 ? establishment.professionals.map(prof => (
                        <button key={prof.id} onClick={() => setSelectedProfessional(prof)} className={`w-full text-left p-3 rounded-lg transition-all border-2 flex items-center gap-3 ${selectedProfessional?.id === prof.id ? 'bg-yellow-500/10 border-yellow-500' : 'bg-gray-700 border-transparent hover:border-yellow-600'}`}>
                            <img src={prof.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=?'} alt={prof.name} className="h-10 w-10 rounded-full object-cover" />
                            <span className="font-semibold text-white">{prof.name}</span>
                        </button>
                    )) : <p className="text-gray-500 col-span-full">Este estabelecimento ainda não cadastrou profissionais.</p>}
                </div>
            </div>

            {selectedProfessional && (
              <div>
                  <h2 className="text-xl font-bold text-white mb-4">2. Escolha o(s) Serviço(s)</h2>
                  <div className="space-y-3">
                      {selectedProfessional.services && selectedProfessional.services.length > 0 ? selectedProfessional.services.map(service => (
                          <button key={service.id} onClick={() => handleToggleService(service)} className={`w-full text-left p-4 rounded-lg transition-all border-2 flex justify-between items-center ${selectedServices.some(s => s.id === service.id) ? 'bg-yellow-500/10 border-yellow-500' : 'bg-gray-700 border-transparent hover:border-yellow-600'}`}>
                              <div>
                                <p className="font-semibold text-white">{service.name}</p>
                                <p className="text-sm text-gray-400">{service.duration} min - R$ {service.price.toFixed(2)}</p>
                              </div>
                              {selectedServices.some(s => s.id === service.id) && <span className="text-yellow-400">✓</span>}
                          </button>
                      )) : <p className="text-gray-500">Este profissional não possui serviços cadastrados.</p>}
                  </div>
              </div>
            )}

            {selectedServices.length > 0 && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white">Resumo</h3>
                <p className="text-gray-300">Duração total: <span className="font-bold text-yellow-400">{totalDuration} minutos</span></p>
                <p className="text-gray-300">Preço total: <span className="font-bold text-yellow-400">R$ {totalPrice.toFixed(2)}</span></p>
              </div>
            )}

            {selectedServices.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">3. Escolha a Data</h2>
                    <Calendar onChange={setSelectedDate} value={selectedDate} minDate={new Date()} maxDate={calculateMaxDate()} className="react-calendar" />
                </div>
            )}
            
            {selectedDate && !Array.isArray(selectedDate) && selectedServices.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">4. Escolha o Horário de Início</h2>
                    {loadingTimes ? <p className="text-gray-400">Carregando horários...</p> : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {timeSlots.length > 0 ? timeSlots.map(slot => (
                                <button key={slot.time} onClick={() => slot.status === 'available' && setSelectedTime(slot.time)} disabled={slot.status !== 'available'} className={`p-3 rounded-lg font-semibold transition-colors ${getButtonClass(slot.status, slot.time)}`}>
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
                    {isBooking ? 'Agendando...' : `Confirmar Agendamento às ${selectedTime}`}
                </button>
            </div>
        )}
      </main>
    </div>
  );
};

export default Booking;

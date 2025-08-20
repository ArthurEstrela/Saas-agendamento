import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Calendar.css'; // Mantenha seu CSS customizado para o calendário
import { useToast } from '../context/ToastContext';
import type { UserProfile, Service, Appointment, Professional } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowLeft,
  User,
  Scissors,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  XCircle,
  Coffee,
  Check,
  Loader2,
  DollarSign,
  Clock as DurationIcon,
  ChevronRight
} from 'lucide-react';

// Interfaces locais para compatibilidade com a estrutura de dados usada no seu projeto
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

interface ProfessionalWithAvailability extends Professional {
    services: Service[];
    availability?: Availability;
}

// Tipos para o calendário
type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// Interface para um slot de horário
interface TimeSlot {
  time: string;
  status: 'available' | 'booked' | 'break' | 'past';
}

// Propriedades do componente Booking
interface BookingProps {
  professional: UserProfile; // Este é o perfil do estabelecimento (Service Provider)
  onBack?: () => void;
}

// Definição das etapas do agendamento
const bookingSteps = [
  { id: 1, name: 'Serviços', icon: Scissors },
  { id: 2, name: 'Profissional', icon: User },
  { id: 3, name: 'Data & Hora', icon: CalendarIcon },
  { id: 4, name: 'Confirmar', icon: CheckCircle },
];

const Booking = ({ professional: establishment, onBack }: BookingProps) => {
  // CORREÇÃO: Pegando também o userProfile para uma verificação mais segura
  const { currentUser, userProfile } = useAuth(); 
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalWithAvailability | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

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

  const allServices = useMemo(() => {
    if (!establishment?.professionals) return [];
    const serviceMap = new Map<string, Service>();
    (establishment.professionals as ProfessionalWithAvailability[]).forEach(prof => {
      prof.services.forEach(service => {
        if (!serviceMap.has(service.id)) {
          serviceMap.set(service.id, service);
        }
      });
    });
    return Array.from(serviceMap.values());
  }, [establishment]);

  const professionalsForSelectedServices = useMemo(() => {
    if (!establishment?.professionals || selectedServices.length === 0) return (establishment.professionals as ProfessionalWithAvailability[]) || [];
    return (establishment.professionals as ProfessionalWithAvailability[]).filter(prof =>
      selectedServices.every(selService =>
        prof.services.some(profService => profService.id === selService.id)
      )
    );
  }, [establishment, selectedServices]);

  useEffect(() => {
    setSelectedDate(new Date());
    setTimeSlots([]);
    setSelectedTime('');
    setAvailabilityMessage('');
  }, [selectedProfessional]);

  const handleToggleService = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
    setSelectedTime('');
    setSelectedProfessional(null);
  };


  // COPIE E COLE ESTE BLOCO NO LUGAR DO SEU useEffect ATUAL EM Booking.tsx

useEffect(() => {
    // Nova função para gerar os horários, compatível com múltiplos intervalos
    const generateTimeSlots = (
      workIntervals: { start: string; end: string }[],
      breakIntervals: { start: string; end: string }[],
      bookedIntervals: { start: Date; end: Date }[],
      serviceDuration: number,
      date: Date
    ) => {
      const slots: TimeSlot[] = [];
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (!workIntervals || workIntervals.length === 0) {
        return [];
      }

      // 1. Itera sobre cada intervalo de TRABALHO do dia
      workIntervals.forEach(workInterval => {
        if (!workInterval.start || !workInterval.end) return;

        const workStartTime = new Date(date);
        const [startHour, startMinute] = workInterval.start.split(':').map(Number);
        workStartTime.setHours(startHour, startMinute, 0, 0);

        const workEndTime = new Date(date);
        const [endHour, endMinute] = workInterval.end.split(':').map(Number);
        workEndTime.setHours(endHour, endMinute, 0, 0);

        let currentTime = new Date(workStartTime);

        while (currentTime < workEndTime) {
          const slotStartTime = new Date(currentTime);
          const slotEndTime = new Date(slotStartTime.getTime() + serviceDuration * 60000);

          if (slotEndTime > workEndTime) {
            break;
          }

          const timeString = slotStartTime.toTimeString().substring(0, 5);
          let status: TimeSlot['status'] = 'available';

          // 2. Verifica se o horário já passou
          if (isToday && slotStartTime < now) {
            status = 'past';
          } else {
            // 3. Verifica se o horário colide com ALGUM intervalo de PAUSA
            const isInBreak = breakIntervals.some(breakInterval => {
              if (!breakInterval.start || !breakInterval.end) return false;

              const breakStartTimeObj = new Date(date);
              const [breakStartHour, breakStartMinute] = breakInterval.start.split(':').map(Number);
              breakStartTimeObj.setHours(breakStartHour, breakStartMinute, 0, 0);

              const breakEndTimeObj = new Date(date);
              const [breakEndHour, breakEndMinute] = breakInterval.end.split(':').map(Number);
              breakEndTimeObj.setHours(breakEndHour, breakEndMinute, 0, 0);

              return slotStartTime < breakEndTimeObj && slotEndTime > breakStartTimeObj;
            });

            if (isInBreak) status = 'break';
            
            // 4. Verifica se o horário colide com ALGUM agendamento existente
            const isOverlapping = bookedIntervals.some(bookedInterval =>
              slotStartTime < bookedInterval.end && slotEndTime > bookedInterval.start
            );

            if (isOverlapping) status = 'booked';
          }
          
          slots.push({ time: timeString, status });
          currentTime.setMinutes(currentTime.getMinutes() + 15); // Intervalo de verificação de slots
        }
      });

      // Remove horários duplicados caso os intervalos de trabalho sejam sobrepostos
      const uniqueSlots = slots.filter((slot, index, self) =>
          index === self.findIndex((s) => s.time === slot.time)
      );

      return uniqueSlots;
    };

    const fetchAvailableTimes = async () => {
      setTimeSlots([]);
      setSelectedTime('');
      setAvailabilityMessage('');

      if (!selectedDate || Array.isArray(selectedDate) || selectedServices.length === 0 || !selectedProfessional) {
        if (selectedProfessional && selectedServices.length === 0) {
          setAvailabilityMessage('Por favor, selecione pelo menos um serviço.');
        }
        return;
      }

      setLoadingTimes(true);
      try {
        // LÓGICA CORRIGIDA PARA LER A DISPONIBILIDADE EM FORMATO DE ARRAY
        const dayKey = (selectedDate as Date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        // Assegura que estamos tratando a disponibilidade como um array
        const professionalAvailability = selectedProfessional.availability as unknown as DayAvailability[]; // DayAvailability de types.ts
        const dayAvailability = professionalAvailability?.find(d => d.dayOfWeek === dayKey);

        // A propriedade correta é `isDayOff`, não `active`
        if (!dayAvailability || dayAvailability.isDayOff) {
          setAvailabilityMessage('O profissional não atende neste dia da semana.');
          setTimeSlots([]);
          setLoadingTimes(false);
          return;
        }

        // Busca os agendamentos existentes para aquele dia
        const q = query(
          collection(db, 'appointments'),
          where('serviceProviderId', '==', establishment.uid),
          where('professionalId', '==', selectedProfessional.id),
          where('date', '==', (selectedDate as Date).toISOString().split('T')[0])
        );
        const querySnapshot = await getDocs(q);
        const bookedIntervals: { start: Date; end: Date }[] = [];
        querySnapshot.docs.forEach(doc => {
            const appointment = doc.data() as Appointment;
            const durationOfBooking = appointment.serviceIds.reduce((acc, serviceId) => {
                const service = allServices.find(s => s.id === serviceId);
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

        // Chama a nova função para gerar os horários, passando os intervalos corretos
        const finalSlots = generateTimeSlots(
          dayAvailability.workIntervals,
          dayAvailability.breakIntervals,
          bookedIntervals,
          totalDuration,
          selectedDate as Date
        );

        setTimeSlots(finalSlots);

        if (finalSlots.filter(s => s.status === 'available').length === 0) {
          setAvailabilityMessage('Não foram encontrados horários disponíveis para este dia e duração.');
        }

      } catch (error) {
        console.error("Erro ao procurar horários:", error);
        setAvailabilityMessage('Ocorreu um erro ao carregar os horários.');
      } finally {
        setLoadingTimes(false);
      }
    };

    fetchAvailableTimes();
}, [selectedDate, selectedServices, selectedProfessional, establishment, totalDuration, allServices]);

  const handleBookAppointment = useCallback(async () => {
    // CORREÇÃO: Verifica tanto o usuário de autenticação quanto o perfil do app.
    if (!currentUser || !userProfile) {
      showToast("Você precisa estar logado para agendar. Redirecionando...", 'info');
      const pendingBooking = {
        serviceProviderId: establishment.uid,
        professionalId: selectedProfessional?.id,
        serviceIds: selectedServices.map(s => s.id),
        date: (selectedDate as Date).toISOString(),
        time: selectedTime,
      };
      sessionStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
      navigate('/login', { state: { from: location } });
      return;
    }

    if (selectedServices.length === 0 || !selectedDate || Array.isArray(selectedDate) || !selectedTime || !selectedProfessional) {
      showToast("Por favor, preencha todos os campos necessários.", 'error');
      return;
    }
    setIsBooking(true);
    const newAppointmentData = {
      // CORREÇÃO: Usando o UID do perfil do usuário para consistência.
      clientId: userProfile.uid,
      serviceProviderId: establishment.uid,
      professionalId: selectedProfessional.id,
      serviceIds: selectedServices.map(s => s.id),
      date: (selectedDate as Date).toISOString().split('T')[0],
      time: selectedTime,
      status: 'pending',
      // CORREÇÃO: Usando Timestamp do Firebase para consistência de dados
      createdAt: Timestamp.now(), 
      price: totalPrice,
    };
    try {
      await addDoc(collection(db, 'appointments'), newAppointmentData);
      showToast('Agendamento realizado com sucesso!', 'success');
      
      sessionStorage.removeItem('pendingBooking');

      if (onBack) {
        onBack();
      } else {
        navigate('/dashboard/client');
      }
    } catch (error) {
      console.error("Erro ao agendar:", error);
      showToast('Erro ao agendar. Tente novamente.', 'error');
    } finally {
      setIsBooking(false);
    }
  }, [currentUser, userProfile, establishment, location, navigate, onBack, selectedDate, selectedProfessional, selectedServices, selectedTime, showToast]);

  useEffect(() => {
    if (currentUser && userProfile && establishment?.uid) {
      const pendingBookingRaw = sessionStorage.getItem('pendingBooking');

      if (pendingBookingRaw) {
        let pendingBooking;
        try {
          pendingBooking = JSON.parse(pendingBookingRaw);
        } catch (error) {
          console.error("Erro ao processar dados de agendamento pendente:", error);
          sessionStorage.removeItem('pendingBooking');
          return;
        }

        if (pendingBooking && pendingBooking.serviceProviderId === establishment.uid) {
          sessionStorage.removeItem('pendingBooking');

          const professional = (establishment.professionals as ProfessionalWithAvailability[])?.find(p => p.id === pendingBooking.professionalId);
          const services = pendingBooking.serviceIds.map((serviceId: string) =>
            allServices.find(s => s.id === serviceId)
          ).filter((s): s is Service => s !== undefined);

          if (professional && services.length === pendingBooking.serviceIds.length) {
            showToast('Finalizando seu agendamento...', 'info');
            
            setSelectedServices(services);
            setSelectedProfessional(professional);
            setSelectedDate(new Date(pendingBooking.date));
            setSelectedTime(pendingBooking.time);
            setCurrentStep(4);
            
            // Adiciona um pequeno delay para garantir que o estado da UI atualize antes de chamar a função de agendamento
            setTimeout(() => {
                handleBookAppointment();
            }, 200);

          } else {
            showToast('Não foi possível restaurar os detalhes do seu agendamento. Por favor, tente novamente.', 'warning');
          }
        }
      }
    }
  }, [currentUser, userProfile, establishment, allServices, showToast, navigate, handleBookAppointment]);

  const getButtonClass = (status: TimeSlot['status'], time: string) => {
    let baseClasses = 'p-3 rounded-lg font-semibold transition-colors duration-200';
    if (status === 'available') {
      return selectedTime === time
        ? `${baseClasses} bg-[#daa520] text-gray-900 shadow-md shadow-[#daa520]/30`
        : `${baseClasses} bg-gray-700 hover:bg-gray-600 text-white`;
    }
    return `${baseClasses} bg-gray-800 text-gray-500 cursor-not-allowed opacity-60`;
  };

  const calculateMaxDate = () => {
    const advanceDays = establishment.bookingAdvanceDays;
    if (!advanceDays || advanceDays <= 0) {
        return undefined;
    }
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceDays);
    return maxDate;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && selectedServices.length === 0) {
      showToast('Por favor, selecione pelo menos um serviço.', 'warning');
      return;
    }
    if (currentStep === 2 && !selectedProfessional) {
      showToast('Por favor, selecione um profissional.', 'warning');
      return;
    }
    if (currentStep === 3 && (!selectedDate || Array.isArray(selectedDate) || !selectedTime)) {
      showToast('Por favor, selecione uma data e um horário.', 'warning');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, bookingSteps.length));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">1. Escolha o(s) Serviço(s)</h2>
            <div className="space-y-4">
              {allServices.length > 0 ? (
                allServices.map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleToggleService(service)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 flex justify-between items-center
                      ${selectedServices.some(s => s.id === service.id)
                        ? 'bg-[#daa520]/20 border-[#daa520] shadow-lg shadow-[#daa520]/10'
                        : 'bg-gray-800 border-gray-700 hover:border-[#daa520]/50 hover:shadow-md hover:shadow-gray-700/20'
                      }
                    `}
                  >
                    <div>
                      <p className="font-semibold text-white text-lg">{service.name}</p>
                      <div className="flex items-center text-sm text-gray-400 gap-2 mt-1">
                        <DurationIcon size={16} /><span>{service.duration} min</span>
                        <DollarSign size={16} /><span>R$ {service.price.toFixed(2)}</span>
                      </div>
                    </div>
                    {selectedServices.some(s => s.id === service.id) && <Check className="text-[#daa520] h-6 w-6" />}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Este estabelecimento ainda não registou serviços.</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">2. Escolha o Profissional</h2>
            
            {selectedServices.length > 0 && (
              <div className="border-y border-gray-700 py-4 mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Resumo dos Serviços</h3>
                <div className="flex justify-between items-center text-gray-300">
                  <span>Duração total:</span>
                  <span className="font-bold text-[#daa520]">{totalDuration} minutos</span>
                </div>
                <div className="flex justify-between items-center text-gray-300 mt-1">
                  <span>Preço total:</span>
                  <span className="font-bold text-[#daa520]">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {professionalsForSelectedServices.length > 0 ? (
                professionalsForSelectedServices.map(prof => (
                  <button
                    key={prof.id}
                    onClick={() => setSelectedProfessional(prof)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 flex items-center gap-4
                      ${selectedProfessional?.id === prof.id
                        ? 'bg-[#daa520]/20 border-[#daa520] shadow-lg shadow-[#daa520]/10'
                        : 'bg-gray-800 border-gray-700 hover:border-[#daa520]/50 hover:shadow-md hover:shadow-gray-700/20'
                      }
                    `}
                  >
                    <img src={prof.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Prof'} alt={prof.name} className="h-14 w-14 rounded-full object-cover border-2 border-gray-600" />
                    <div>
                      <p className="font-semibold text-white text-lg">{prof.name}</p>
                      <p className="text-sm text-gray-400">Especialista</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-gray-500 col-span-full text-center py-8">Nenhum profissional oferece todos os serviços selecionados.</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">3. Escolha a Data e Hora</h2>
            {selectedProfessional ? (
              <>
                <div className="flex justify-center mb-6">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    minDate={new Date()}
                    maxDate={calculateMaxDate()}
                    className="react-calendar border-2 border-gray-700 rounded-xl shadow-lg"
                  />
                </div>

                <h3 className="text-xl font-bold text-white mb-4">Horários Disponíveis</h3>
                {loadingTimes ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 text-[#daa520]" />
                    <p className="text-gray-400 ml-3">A carregar horários...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {timeSlots.length > 0 && timeSlots.some(s => s.status === 'available') ? (
                      timeSlots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => slot.status === 'available' && setSelectedTime(slot.time)}
                          disabled={slot.status !== 'available'}
                          className={getButtonClass(slot.status, slot.time)}
                        >
                          {slot.time}
                          {slot.status === 'booked' && <XCircle size={16} className="ml-1 inline" />}
                          {slot.status === 'break' && <Coffee size={16} className="ml-1 inline" />}
                          {slot.status === 'past' && <Clock size={16} className="ml-1 inline" />}
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 col-span-full text-center py-8">{availabilityMessage || 'Não há horários disponíveis para este dia.'}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">Por favor, selecione um profissional primeiro.</p>
            )}
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">4. Confirmar Agendamento</h2>
            {selectedProfessional && selectedServices.length > 0 && selectedDate && !Array.isArray(selectedDate) && selectedTime ? (
              <div className="bg-gray-800 p-6 rounded-xl border border-[#daa520] animate-fade-in-down">
                <h3 className="text-xl font-bold text-white mb-4">Detalhes do Agendamento</h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between items-center">
                    <span>Estabelecimento:</span>
                    <span className="font-semibold text-white">{establishment.companyName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Profissional:</span>
                    <div className="flex items-center gap-2">
                      <img src={selectedProfessional?.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Prof'} alt={selectedProfessional?.name} className="h-8 w-8 rounded-full object-cover border-2 border-gray-600" />
                      <span className="font-semibold text-white">{selectedProfessional?.name}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Data:</span>
                    <span className="font-semibold text-white">{(selectedDate as Date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Horário:</span>
                    <span className="font-semibold text-white">{selectedTime}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <span className="font-semibold text-white">Serviços Selecionados:</span>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      {selectedServices.map(s => <li key={s.id}>{s.name} ({s.duration} min - R$ {s.price.toFixed(2)})</li>)}
                    </ul>
                  </div>
                  <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-xl">
                    <span className="text-[#daa520]">Total:</span>
                    <span className="text-[#daa520]">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Por favor, complete as etapas anteriores para confirmar seu agendamento.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep - 1) / (bookingSteps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans p-4 md:p-8">
      {onBack && (
        <header className="flex items-center mb-10">
          <button onClick={onBack} className="flex items-center space-x-2 text-[#daa520] hover:text-yellow-300 font-semibold transition-colors duration-200">
            <ArrowLeft className="h-6 w-6" />
            <span>Voltar para a Busca</span>
          </button>
        </header>
      )}

      <main className="max-w-3xl mx-auto bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-800 animate-fade-in-down">
        <div className="text-center mb-8">
          <img
            src={establishment.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'}
            alt={`Foto de ${establishment.companyName}`}
            className="h-28 w-28 rounded-full object-cover mx-auto mb-4 border-4 border-[#daa520] shadow-lg shadow-[#daa520]/20"
          />
          <h1 className="text-3xl font-bold text-white">Agendar em</h1>
          <p className="text-2xl text-[#daa520] font-semibold">{establishment.companyName}</p>
        </div>

        <div className="mb-10 relative flex justify-between items-center after:absolute after:inset-x-0 after:top-1/2 after:-translate-y-1/2 after:h-1 after:bg-gray-700 after:z-0">
          <div className="absolute top-1/2 left-0 h-1 bg-[#daa520] z-10 transition-all duration-500 ease-in-out rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          {bookingSteps.map(step => {
            const isActive = currentStep >= step.id;
            return (
              <div key={step.id} className="flex flex-col items-center z-20">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ease-in-out transform ${isActive ? 'bg-[#daa520] scale-110 shadow-md shadow-[#daa520]/30' : 'bg-gray-700 scale-100 border-2 border-gray-600'}`}>
                  <step.icon className={`h-5 w-5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                </div>
                <p className={`text-xs mt-2 font-semibold transition-colors duration-300 ${isActive ? 'text-[#daa520]' : 'text-gray-400'}`}>{step.name}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-800 p-6 md:p-8 rounded-xl border border-gray-700 shadow-xl min-h-[400px] flex flex-col justify-between">
          {renderStepContent()}
        </div>

        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              onClick={handlePreviousStep}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <ArrowLeft size={20} /> Anterior
            </button>
          )}
          {currentStep < bookingSteps.length && (
            <button
              onClick={handleNextStep}
              className={`ml-auto bg-[#daa520] hover:bg-[#c8961e] text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md shadow-[#daa520]/20 transform hover:scale-105`}
            >
              Próximo <ChevronRight size={20} />
            </button>
          )}
          {currentStep === bookingSteps.length && (
            <button
              onClick={handleBookAppointment}
              disabled={isBooking}
              className="ml-auto bg-[#daa520] hover:bg-[#c8961e] text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md shadow-[#daa520]/20 transform hover:scale-105 disabled:bg-gray-500 disabled:text-gray-300"
            >
              {isBooking ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              {isBooking ? 'Agendando...' : 'Confirmar e Agendar'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Booking;

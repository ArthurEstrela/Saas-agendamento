import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Calendar.css'; // Mantenha seu CSS customizado para o calendário
import { useToast } from '../context/ToastContext';
import type { UserProfile, Service, Appointment, Professional } from '../types';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

import {
  ArrowLeft, // Ícone de voltar
  User, // Profissional
  Scissors, // Serviços
  Calendar as CalendarIcon, // Data e Hora
  CheckCircle, // Confirmar
  Clock, // Horário disponível
  XCircle, // Horário indisponível
  Coffee, // Horário de almoço/pausa
  Check, // Serviço selecionado
  Loader2, // Carregamento
  DollarSign, // Preço
  Clock as DurationIcon, // Duração
  TrendingUp, // Ícone de gráfico subindo para Gestão Financeira
} from 'lucide-react'; // Importa os ícones do Lucide React

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
  { id: 1, name: 'Profissional', icon: User },
  { id: 2, name: 'Serviços', icon: Scissors },
  { id: 3, name: 'Data & Hora', icon: CalendarIcon },
  { id: 4, name: 'Confirmar', icon: CheckCircle },
];

const Booking = ({ professional: establishment, onBack }: BookingProps) => {
  const { currentUser, userProfile } = useAuth(); // Obtém o perfil do usuário logado
  const { showToast } = useToast(); // Função para exibir toasts
  const navigate = useNavigate(); // Hook para navegação

  // Estados para o processo de agendamento
  const [currentStep, setCurrentStep] = useState(1); // Passo atual
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

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

  // Efeito para inicializar o profissional e o passo se o prop 'professional' for fornecido
  useEffect(() => {
    if (establishment && establishment.professionals && establishment.professionals.length > 0) {
      // Se o estabelecimento tem apenas um profissional, já o pré-seleciona e vai para o passo 2
      if (establishment.professionals.length === 1) {
        setSelectedProfessional(establishment.professionals[0]);
        setCurrentStep(2); // Vai direto para a seleção de serviços
      } else {
        // Se há múltiplos profissionais, o usuário ainda precisa selecionar um no passo 1
        setCurrentStep(1);
      }
    }
  }, [establishment]);


  // Reseta os estados quando o profissional selecionado muda
  useEffect(() => {
    setSelectedServices([]);
    setSelectedDate(new Date());
    setTimeSlots([]);
    setSelectedTime('');
    setAvailabilityMessage('');
  }, [selectedProfessional]);

  // Lida com a seleção/desseleção de serviços
  const handleToggleService = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
    setSelectedTime(''); // Limpa o horário selecionado ao mudar os serviços
  };

  // Efeito para buscar os horários disponíveis quando a data, serviços ou profissional mudam
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      setTimeSlots([]); // Limpa os slots anteriores
      setSelectedTime(''); // Limpa o horário selecionado
      setAvailabilityMessage(''); // Limpa a mensagem de disponibilidade

      // Verifica se todos os pré-requisitos para buscar horários estão preenchidos
      if (!selectedDate || Array.isArray(selectedDate) || selectedServices.length === 0 || !selectedProfessional) {
        if (selectedProfessional && selectedServices.length === 0) {
          setAvailabilityMessage('Por favor, selecione pelo menos um serviço.');
        }
        return;
      }

      setLoadingTimes(true); // Inicia o estado de carregamento

      try {
        // Obtém o nome do dia da semana em inglês para corresponder às chaves de disponibilidade
        const dayKey = (selectedDate as Date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof selectedProfessional.availability;
        const dayAvailability = selectedProfessional.availability?.[dayKey];

        // Verifica se o profissional tem disponibilidade configurada para o dia
        if (!dayAvailability || !dayAvailability.active) {
          setAvailabilityMessage('O profissional não atende neste dia da semana ou não configurou a disponibilidade.');
          return;
        }

        // Extrai as horas e minutos do início e fim do expediente
        const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
        const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);

        const slots: TimeSlot[] = []; // Array para armazenar os slots gerados
        let currentTime = new Date(selectedDate as Date);
        currentTime.setHours(startHour, startMinute, 0, 0); // Define o horário de início do expediente

        let endTime = new Date(selectedDate as Date);
        endTime.setHours(endHour, endMinute, 0, 0); // Define o horário de fim do expediente

        let breakStartTimeObj: Date | null = null;
        let breakEndTimeObj: Date | null = null;
        // Se houver horários de intervalo configurados, cria objetos Date para eles
        if (dayAvailability.breakStartTime && dayAvailability.breakEndTime) {
          const [breakStartHour, breakStartMinute] = dayAvailability.breakStartTime.split(':').map(Number);
          breakStartTimeObj = new Date(selectedDate as Date);
          breakStartTimeObj.setHours(breakStartHour, breakStartMinute, 0, 0);

          const [breakEndHour, breakEndMinute] = dayAvailability.breakEndTime.split(':').map(Number);
          breakEndTimeObj = new Date(selectedDate as Date);
          breakEndTimeObj.setHours(breakEndHour, breakEndMinute, 0, 0);
        }

        // Consulta agendamentos existentes para o profissional na data selecionada
        const q = query(
          collection(db, 'appointments'),
          where('serviceProviderId', '==', establishment.uid),
          where('professionalId', '==', selectedProfessional.id),
          where('date', '==', (selectedDate as Date).toISOString().split('T')[0]) // Formato 'YYYY-MM-DD'
        );
        const querySnapshot = await getDocs(q);

        const bookedIntervals: { start: Date, end: Date }[] = [];
        // Mapeia os agendamentos existentes para intervalos de tempo ocupados
        querySnapshot.docs.forEach(doc => {
          const appointment = doc.data() as Appointment;
          // Encontra o profissional dentro do estabelecimento para obter a duração do serviço
          const professionalForBooking = establishment.professionals?.find(p => p.id === appointment.professionalId);

          const durationOfBooking = appointment.serviceIds.reduce((acc, serviceId) => {
            const service = professionalForBooking?.services.find(s => s.id === serviceId);
            return acc + (service?.duration || 0);
          }, 0);

          if (durationOfBooking > 0) {
            const [hour, minute] = appointment.time.split(':').map(Number);
            const startDate = new Date(selectedDate as Date);
            startDate.setHours(hour, minute, 0, 0);
            const endDate = new Date(startDate.getTime() + durationOfBooking * 60000); // Adiciona a duração em milissegundos
            bookedIntervals.push({ start: startDate, end: endDate });
          }
        });

        const now = new Date();
        const isToday = (selectedDate as Date).toDateString() === now.toDateString();

        // Loop para gerar os slots de tempo
        while (currentTime.getTime() < endTime.getTime()) {
          const timeString = currentTime.toTimeString().substring(0, 5); // Formata para HH:MM
          const slotEndTime = new Date(currentTime.getTime() + totalDuration * 60000); // Calcula o fim do slot com base na duração dos serviços

          // Verifica se o slot se sobrepõe ao horário de almoço/pausa
          const isInBreak = breakStartTimeObj && breakEndTimeObj && (
            (currentTime.getTime() < breakEndTimeObj.getTime() && slotEndTime.getTime() > breakStartTimeObj.getTime())
          );

          // Verifica se o slot se sobrepõe a agendamentos existentes
          const isOverlapping = bookedIntervals.some(interval =>
            currentTime.getTime() < interval.end.getTime() && slotEndTime.getTime() > interval.start.getTime()
          );

          // Verifica se o slot já passou (se for hoje)
          const isPast = isToday && currentTime.getTime() < now.getTime();

          let status: 'available' | 'booked' | 'break' | 'past' = 'available';
          if (isPast) status = 'past';
          else if (isOverlapping) status = 'booked';
          else if (isInBreak) status = 'break';

          // Adiciona o slot se ele não exceder o horário de expediente
          if (slotEndTime.getTime() <= endTime.getTime()) {
            slots.push({ time: timeString, status: status });
          }

          currentTime.setMinutes(currentTime.getMinutes() + 15); // Incrementa em 15 minutos
        }

        // Se não houver slots disponíveis, exibe uma mensagem
        if (slots.filter(s => s.status === 'available').length === 0) {
          setAvailabilityMessage('Não foram encontrados horários disponíveis para este dia e duração.');
        }

        setTimeSlots(slots); // Atualiza os slots de horário
      } catch (error) {
        console.error("Erro ao procurar horários:", error);
        setAvailabilityMessage('Ocorreu um erro ao carregar os horários.');
      } finally {
        setLoadingTimes(false); // Finaliza o estado de carregamento
      }
    };

    fetchAvailableTimes(); // Chama a função para buscar os horários
  }, [selectedDate, selectedServices, selectedProfessional, establishment, totalDuration]); // Dependências do useEffect

  // Lida com o agendamento de um novo compromisso
  const handleBookAppointment = async () => {
    if (!currentUser) {
      showToast("Você precisa estar logado para agendar. Redirecionando para o login...", 'info');
      navigate('/login'); // Redireciona para a página de login
      return;
    }
    if (selectedServices.length === 0 || !selectedDate || Array.isArray(selectedDate) || !selectedTime || !selectedProfessional) {
      showToast("Por favor, preencha todos os campos necessários para o agendamento.", 'error');
      return;
    }
    setIsBooking(true); // Inicia o estado de agendamento
    const newAppointment: Omit<Appointment, 'id'> = {
      clientId: currentUser.uid, // Usar currentUser.uid
      serviceProviderId: establishment.uid,
      professionalId: selectedProfessional.id,
      serviceIds: selectedServices.map(s => s.id),
      date: (selectedDate as Date).toISOString().split('T')[0], // Formato 'YYYY-MM-DD'
      time: selectedTime,
      status: 'pending', // Status inicial do agendamento
      createdAt: new Date(),
    };
    try {
      await addDoc(collection(db, 'appointments'), newAppointment); // Adiciona o agendamento ao Firestore
      showToast('Agendamento realizado com sucesso!', 'success');
      if (onBack) onBack(); // Volta para a página anterior se a função for fornecida
    } catch (error) {
      console.error("Erro ao agendar:", error);
      showToast('Erro ao agendar. Tente novamente.', 'error');
    } finally {
      setIsBooking(false); // Finaliza o estado de agendamento
    }
  };

  // Retorna a classe CSS para o botão do slot de horário com base no status
  const getButtonClass = (status: TimeSlot['status'], time: string) => {
    let baseClasses = 'p-3 rounded-lg font-semibold transition-colors duration-200';
    if (status === 'available') {
      return selectedTime === time
        ? `${baseClasses} bg-[#daa520] text-gray-900 shadow-md shadow-[#daa520]/30`
        : `${baseClasses} bg-gray-700 hover:bg-gray-600 text-white`;
    }
    return `${baseClasses} bg-gray-800 text-gray-500 cursor-not-allowed opacity-60`;
  };

  // Calcula a data máxima permitida para agendamento
  const calculateMaxDate = () => {
    const advanceDays = establishment.bookingAdvanceDays || 30; // Padrão de 30 dias se não definido
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceDays);
    return maxDate;
  };

  // Funções para navegação entre etapas
  const handleNextStep = () => {
    // Validação antes de avançar
    if (currentStep === 1 && !selectedProfessional) {
      showToast('Por favor, selecione um profissional.', 'warning');
      return;
    }
    if (currentStep === 2 && selectedServices.length === 0) {
      showToast('Por favor, selecione pelo menos um serviço.', 'warning');
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

  // Renderiza o conteúdo de cada etapa
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Escolha do Profissional
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">1. Escolha o Profissional</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {establishment.professionals && establishment.professionals.length > 0 ? (
                establishment.professionals.map(prof => (
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
                <p className="text-gray-500 col-span-full text-center py-8">Este estabelecimento ainda não registou profissionais.</p>
              )}
            </div>
          </div>
        );
      case 2: // Escolha do(s) Serviço(s)
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">2. Escolha o(s) Serviço(s)</h2>
            {selectedProfessional ? (
              <div className="space-y-4">
                {selectedProfessional.services && selectedProfessional.services.length > 0 ? (
                  selectedProfessional.services.map(service => (
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
                  <p className="text-gray-500 text-center py-8">Este profissional não possui serviços registados.</p>
                )}
                {selectedServices.length > 0 && (
                  <div className="border-t border-gray-700 pt-6 mt-6">
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
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Por favor, selecione um profissional primeiro.</p>
            )}
          </div>
        );
      case 3: // Escolha da Data e Hora
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">3. Escolha a Data e Hora</h2>
            {selectedServices.length > 0 ? (
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
                    {timeSlots.length > 0 ? (
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
                      <p className="text-gray-500 col-span-full text-center py-8">{availabilityMessage || 'Não foram encontrados horários disponíveis para este dia e duração.'}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">Por favor, selecione os serviços primeiro.</p>
            )}
          </div>
        );
      case 4: // Confirmar Agendamento
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">4. Confirmar Agendamento</h2>
            {selectedProfessional && selectedServices.length > 0 && selectedDate && !Array.isArray(selectedDate) && selectedTime ? (
              <div className="bg-gray-800 p-6 rounded-xl border border-[#daa520] animate-fade-in-down">
                <h3 className="text-xl font-bold text-white mb-4">Detalhes do Agendamento</h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between items-center">
                    <span>Estabelecimento:</span>
                    <span className="font-semibold text-white">{establishment.establishmentName}</span>
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
                {/* O botão de "Confirmar e Agendar" final é renderizado apenas uma vez no final do componente */}
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
            alt={`Foto de ${establishment.establishmentName}`}
            className="h-28 w-28 rounded-full object-cover mx-auto mb-4 border-4 border-[#daa520] shadow-lg shadow-[#daa520]/20"
          />
          <h1 className="text-3xl font-bold text-white">Agendar em</h1>
          <p className="text-2xl text-[#daa520] font-semibold">{establishment.establishmentName}</p>
        </div>

        {/* Barra de Progresso Estilizada */}
        <div className="mb-10 relative flex justify-between items-center after:absolute after:inset-x-0 after:top-1/2 after:-translate-y-1/2 after:h-1 after:bg-gray-700 after:z-0">
          <div className="absolute top-1/2 left-0 h-1 bg-[#daa520] z-10 transition-all duration-500 ease-in-out rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          {bookingSteps.map(step => {
            const isActive = currentStep >= step.id;
            const isCurrent = currentStep === step.id;
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

        {/* Conteúdo da Etapa Atual */}
        <div className="bg-gray-800 p-6 md:p-8 rounded-xl border border-gray-700 shadow-xl min-h-[400px] flex flex-col justify-between">
          {renderStepContent()}
        </div>

        {/* Botões de Navegação */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              onClick={handlePreviousStep}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <ArrowLeft size={20} /> Anterior
            </button>
          )}
          {/* O botão "Próximo" só aparece se não for a última etapa */}
          {currentStep < bookingSteps.length && (
            <button
              onClick={handleNextStep}
              className={`ml-auto bg-[#daa520] hover:bg-[#c8961e] text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md shadow-[#daa520]/20 transform hover:scale-105`}
            >
              Próximo <ArrowLeft size={20} className="rotate-180" />
            </button>
          )}
          {/* O botão "Finalizar Agendamento" só aparece na última etapa */}
          {currentStep === bookingSteps.length && (
            <button
              onClick={handleBookAppointment}
              disabled={isBooking}
              className="ml-auto bg-[#daa520] hover:bg-[#c8961e] text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md shadow-[#daa520]/20 transform hover:scale-105 disabled:bg-gray-500 disabled:text-gray-300"
            >
              {isBooking ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              {isBooking ? 'A agendar...' : 'Finalizar Agendamento'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Booking;

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config'; 
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Calendar.css';
import { useToast } from '../context/ToastContext';
import type { UserProfile, Service, Appointment, Professional } from '../types';

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

const Booking = ({ professional: establishment, onBack }: BookingProps) => {
  const { userProfile } = useAuth(); // Obtém o perfil do usuário logado
  const { showToast } = useToast(); // Função para exibir toasts
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null); // Profissional selecionado
  const [selectedServices, setSelectedServices] = useState<Service[]>([]); // Serviços selecionados
  const [selectedDate, setSelectedDate] = useState<Value>(new Date()); // Data selecionada no calendário
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]); // Slots de horários disponíveis
  const [loadingTimes, setLoadingTimes] = useState(false); // Estado de carregamento dos horários
  const [selectedTime, setSelectedTime] = useState<string>(''); // Horário de início selecionado
  const [isBooking, setIsBooking] = useState(false); // Estado de agendamento em progresso
  const [availabilityMessage, setAvailabilityMessage] = useState(''); // Mensagem de disponibilidade

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

  // Reseta os estados quando o profissional selecionado muda
  useEffect(() => {
    setSelectedServices([]);
    setSelectedDate(new Date());
    setTimeSlots([]);
    setSelectedTime('');
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
        if (selectedProfessional) {
          // Se um profissional foi selecionado, mas serviços não, exibe esta mensagem
          setAvailabilityMessage('Por favor, selecione pelo menos um serviço.');
        } else {
          // Se nenhum profissional foi selecionado, não exibe mensagem de disponibilidade ainda
          setAvailabilityMessage('');
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
    if (!userProfile) {
        showToast("Precisa de estar autenticado para agendar.", 'error');
        return;
    }
    if (selectedServices.length === 0 || !selectedDate || Array.isArray(selectedDate) || !selectedTime || !selectedProfessional) {
      showToast("Por favor, preencha todos os campos.", 'error');
      return;
    }
    setIsBooking(true); // Inicia o estado de agendamento
    const newAppointment: Omit<Appointment, 'id'> = {
      clientId: userProfile.uid,
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
    if (status === 'available') {
      return selectedTime === time 
        ? 'bg-yellow-500 text-black' 
        : 'bg-green-600/50 hover:bg-green-500/80 text-white';
    }
    return 'bg-red-500/40 text-gray-400 cursor-not-allowed';
  };

  // Calcula a data máxima permitida para agendamento
  const calculateMaxDate = () => {
    const advanceDays = establishment.bookingAdvanceDays || 30; // Padrão de 30 dias se não definido
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
                    )) : <p className="text-gray-500 col-span-full">Este estabelecimento ainda não registou profissionais.</p>}
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
                      )) : <p className="text-gray-500">Este profissional não possui serviços registados.</p>}
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
                    {loadingTimes ? <p className="text-gray-400">A carregar horários...</p> : (
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
            <div className="mt-8 bg-gray-700 p-6 rounded-xl border border-yellow-500 animate-fade-in-down">
                <h3 className="text-xl font-bold text-white mb-4">Confirmar Agendamento</h3>
                <div className="space-y-3 text-gray-300">
                    <div className="flex justify-between items-center">
                        <span>Profissional:</span>
                        <div className="flex items-center gap-2">
                            <img src={selectedProfessional?.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=?'} alt={selectedProfessional?.name} className="h-6 w-6 rounded-full object-cover" />
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
                    <div className="border-t border-gray-600 pt-3">
                        <span className="font-semibold text-white">Serviços:</span>
                        <ul className="list-disc list-inside mt-2 text-sm">
                            {selectedServices.map(s => <li key={s.id}>{s.name}</li>)}
                        </ul>
                    </div>
                    <div className="border-t border-gray-600 pt-3 flex justify-between font-bold text-lg">
                        <span className="text-yellow-400">Total:</span>
                        <span className="text-yellow-400">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                </div>
                <button
                    onClick={handleBookAppointment}
                    disabled={isBooking}
                    className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500 text-lg"
                >
                    {isBooking ? 'A agendar...' : 'Confirmar e Agendar'}
                </button>
            </div>
        )}
      </main>
    </div>
  );
};

export default Booking;

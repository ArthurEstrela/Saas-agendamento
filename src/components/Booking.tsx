import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { doc, getDoc, collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import type { UserProfile, Service, Professional, Appointment } from '../types';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Calendar.css'; // Seu CSS customizado para o calendário
import { Loader2, ArrowLeft, Scissors, Users, Calendar as CalendarIcon, Clock, CheckCircle, Info, LogIn } from 'lucide-react';
import Login from './Login'; // Importando o componente de Login
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Tipos e Interfaces ---
interface BookingProps {
  professional: UserProfile; // Alterado para receber o objeto completo
  onBack: () => void;
}

// --- Componentes de UI ---

const BookingHeader: React.FC<{ provider: UserProfile; onBack: () => void }> = ({ provider, onBack }) => (
  <div className="flex items-center mb-8">
    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800 mr-4 transition-colors">
      <ArrowLeft className="w-6 h-6 text-gray-300" />
    </button>
    <img
      src={provider.photoURL || `https://placehold.co/150x150/111827/daa520?text=${(provider.establishmentName || 'S').charAt(0)}`}
      alt={provider.establishmentName}
      className="w-16 h-16 rounded-full object-cover border-2 border-gray-700 shadow-md"
    />
    <div className="ml-4">
      <p className="text-sm text-gray-400">A agendar em</p>
      <h2 className="text-2xl font-bold text-white">{provider.establishmentName}</h2>
    </div>
  </div>
);

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = ['Serviços', 'Profissional', 'Data e Hora', 'Confirmar'];
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((label, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center text-center w-20">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentStep > index + 1 ? 'bg-green-500 text-white' : currentStep === index + 1 ? 'bg-[#daa520] text-black ring-4 ring-[#daa520]/20' : 'bg-gray-800 text-gray-500'
              }`}
            >
              {currentStep > index + 1 ? <CheckCircle size={20} /> : index + 1}
            </div>
            <p className={`mt-2 text-xs font-medium ${currentStep >= index + 1 ? 'text-white' : 'text-gray-500'}`}>{label}</p>
          </div>
          {index < steps.length - 1 && <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-800'}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

// --- Componente Principal ---
const Booking: React.FC<BookingProps> = ({ professional: serviceProvider, onBack }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [loginVisible, setLoginVisible] = useState(false);
  
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // Se o usuário faz login com sucesso, esconde o modal e tenta confirmar o agendamento de novo
  useEffect(() => {
    if (currentUser && loginVisible) {
      setLoginVisible(false);
      showToast("Login efetuado com sucesso! Agora pode confirmar o seu agendamento.", { type: 'success' });
      // Não chama handleConfirmBooking aqui para evitar loop, o usuário deve clicar novamente.
    }
  }, [currentUser, loginVisible]);

  // Lógica para buscar horários disponíveis
  useEffect(() => {
    const fetchAvailableTimes = async () => {
        if (!selectedDate || !selectedProfessional || selectedServices.length === 0) {
            setAvailableTimes([]);
            return;
        }
        setLoadingTimes(true);

        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const availability = selectedProfessional.availability?.[dayOfWeek];

        if (!availability || !availability.active) {
            setAvailableTimes([]);
            setLoadingTimes(false);
            return;
        }

        const totalDuration = selectedServices.reduce((acc, service) => acc + service.duration, 0);
        const slots = [];
        let currentTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${availability.startTime}`);
        const endTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${availability.endTime}`);
        const breakStartTime = availability.breakStartTime ? new Date(`${selectedDate.toISOString().split('T')[0]}T${availability.breakStartTime}`) : null;
        const breakEndTime = availability.breakEndTime ? new Date(`${selectedDate.toISOString().split('T')[0]}T${availability.breakEndTime}`) : null;
        
        const q = query(collection(db, 'appointments'), 
            where('professionalId', '==', selectedProfessional.id),
            where('date', '==', format(selectedDate, 'yyyy-MM-dd'))
        );
        const querySnapshot = await getDocs(q);
        const bookedTimes = querySnapshot.docs.map(doc => doc.data().time);

        while (currentTime < endTime) {
            const slotTime = format(currentTime, 'HH:mm');
            const slotEndTime = new Date(currentTime.getTime() + totalDuration * 60000);

            let isAvailable = true;
            if (slotEndTime > endTime) isAvailable = false;
            if (breakStartTime && breakEndTime && (currentTime < breakEndTime && slotEndTime > breakStartTime)) isAvailable = false;
            if (bookedTimes.includes(slotTime)) isAvailable = false;
            
            if (isAvailable) {
                slots.push(slotTime);
            }
            currentTime.setMinutes(currentTime.getMinutes() + 15); // Intervalo de 15 min para novos agendamentos
        }

        setAvailableTimes(slots);
        setLoadingTimes(false);
    };

    fetchAvailableTimes();
  }, [selectedDate, selectedProfessional, selectedServices]);

  const handleSelectService = (service: Service) => {
    setSelectedServices(prev =>
      prev.some(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const handleConfirmServices = () => {
    if (selectedServices.length === 0) {
      showToast("Selecione pelo menos um serviço.", { type: 'warning' });
      return;
    }
    setStep(2);
  };
  
  const handleSelectProfessional = (professional: Professional) => {
    setSelectedProfessional(professional);
    setStep(3);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  }

  const handleConfirmBooking = async () => {
    if (!currentUser) {
      showToast("Você precisa fazer login para confirmar o agendamento.", { type: 'info' });
      setLoginVisible(true);
      return;
    }
    
    if (!serviceProvider || !selectedProfessional || !selectedDate || !selectedTime || selectedServices.length === 0) {
        showToast("Todos os campos são obrigatórios para o agendamento.", { type: 'error' });
        return;
    }

    const newAppointment = {
        serviceProviderId: serviceProvider.uid,
        professionalId: selectedProfessional.id,
        clientId: currentUser.uid,
        serviceIds: selectedServices.map(s => s.id),
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'pending', // Começa como pendente para o profissional confirmar
        createdAt: Timestamp.now(),
        // Estes campos são para denormalização e facilitar a exibição
        establishmentName: serviceProvider.establishmentName,
        serviceName: selectedServices.map(s => s.name).join(', '),
        professionalName: selectedProfessional.name,
        clientName: currentUser.displayName,
        totalPrice: selectedServices.reduce((total, s) => total + s.price, 0),
    };

    try {
        await addDoc(collection(db, 'appointments'), newAppointment);
        showToast("Agendamento solicitado com sucesso! Aguarde a confirmação.", { type: 'success' });
        onBack();
    } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        showToast("Falha ao criar agendamento. Tente novamente.", { type: 'error' });
    }
  };

  if (!serviceProvider) {
    return <div className="text-center p-16"><Info size={48} className="mx-auto text-red-500" /><h3 className="mt-4 text-xl font-semibold text-gray-800">Estabelecimento não encontrado</h3><p className="mt-2 text-gray-500">Não foi possível carregar as informações.</p><button onClick={onBack} className="mt-6 px-6 py-2 bg-[#daa520] text-black rounded-lg">Voltar</button></div>;
  }

  return (
    <div className="relative bg-black text-white p-8 rounded-lg shadow-2xl border border-gray-800">
      {loginVisible && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 rounded-lg animate-fade-in-down">
          <div className="w-full max-w-md">
            <Login />
            <button onClick={() => setLoginVisible(false)} className="mt-4 w-full text-center text-sm text-gray-500 hover:text-[#daa520]">
              Voltar ao agendamento
            </button>
          </div>
        </div>
      )}

      <BookingHeader provider={serviceProvider} onBack={onBack} />
      <Stepper currentStep={step} />
      
      <div className="mt-8 min-h-[300px]">
        {step === 1 && (
          <div className="animate-fade-in-down">
            <h3 className="text-xl font-bold text-white mb-4">Selecione os serviços</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(serviceProvider.professionals?.flatMap(p => p.services.map(s => ({...s, professionalName: p.name}))) || []).map(service => (
                <button key={service.id} onClick={() => handleSelectService(service)} className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${selectedServices.some(s => s.id === service.id) ? 'border-[#daa520] bg-gray-800/50 shadow-md' : 'border-gray-700 bg-gray-800/20 hover:border-gray-600'}`}>
                  <p className="font-semibold text-white">{service.name}</p>
                  <p className="text-sm text-gray-400">{service.duration} min - R$ {service.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">com {service.professionalName}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-8">
                <button onClick={handleConfirmServices} className="px-6 py-3 bg-[#daa520] text-black font-semibold rounded-lg shadow-md hover:bg-[#c8961e] disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={selectedServices.length === 0}>Avançar</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="animate-fade-in-down">
            <h3 className="text-xl font-bold text-white mb-4">Escolha um profissional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceProvider.professionals?.map(prof => (
                <button key={prof.id} onClick={() => handleSelectProfessional(prof)} className="p-4 rounded-lg border-2 border-gray-700 text-center hover:border-[#daa520] hover:shadow-lg transition-all transform hover:-translate-y-1">
                  <img src={prof.photoURL || `https://placehold.co/150x150/111827/daa520?text=${prof.name.charAt(0)}`} alt={prof.name} className="w-24 h-24 rounded-full mx-auto object-cover mb-4 border-4 border-gray-800" />
                  <p className="font-bold text-white">{prof.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
            <div className="animate-fade-in-down">
                <h3 className="text-xl font-bold text-white mb-4">Selecione a data e o horário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Calendar onChange={(date) => setSelectedDate(date as Date)} value={selectedDate} minDate={new Date()}/>
                    <div className="max-h-80 overflow-y-auto pr-2">
                        <h4 className="font-semibold mb-3 text-gray-300">Horários disponíveis para <span className="text-[#daa520]">{format(selectedDate, "dd/MM")}</span>:</h4>
                        {loadingTimes ? <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-[#daa520]" /></div> : (
                            availableTimes.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {availableTimes.map(time => (<button key={time} onClick={() => handleSelectTime(time)} className="p-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-[#daa520] hover:text-black transition-colors">{time}</button>))}
                                </div>
                            ) : <p className="text-gray-500 text-center mt-10">Nenhum horário disponível para esta data.</p>
                        )}
                    </div>
                </div>
            </div>
        )}
        {step === 4 && (
            <div className="animate-fade-in-down">
                <h3 className="text-xl font-bold text-white mb-6">Confirme seu agendamento</h3>
                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
                    <div className="flex justify-between items-center"><p className="text-gray-400 font-medium flex items-center gap-2"><Scissors size={16}/> Serviços:</p><p className="font-bold text-white text-right">{selectedServices.map(s => s.name).join(', ')}</p></div>
                    <div className="flex justify-between items-center"><p className="text-gray-400 font-medium flex items-center gap-2"><Users size={16}/> Profissional:</p><p className="font-bold text-white">{selectedProfessional?.name}</p></div>
                    <div className="flex justify-between items-center"><p className="text-gray-400 font-medium flex items-center gap-2"><CalendarIcon size={16}/> Data:</p><p className="font-bold text-white">{format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</p></div>
                    <div className="flex justify-between items-center"><p className="text-gray-400 font-medium flex items-center gap-2"><Clock size={16}/> Horário:</p><p className="font-bold text-white">{selectedTime}</p></div>
                    <div className="border-t border-gray-700 pt-4 mt-4 flex justify-between items-center"><p className="text-lg text-gray-300 font-medium">Total:</p><p className="text-2xl font-bold text-[#daa520]">R$ {selectedServices.reduce((total, s) => total + s.price, 0).toFixed(2)}</p></div>
                </div>
                <div className="flex justify-end mt-8">
                    <button onClick={handleConfirmBooking} className="px-8 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors flex items-center gap-2">
                        <CheckCircle size={20}/>
                        Solicitar Agendamento
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Booking;

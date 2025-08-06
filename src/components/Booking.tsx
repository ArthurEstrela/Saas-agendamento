import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { doc, getDoc, collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import type { UserProfile, Service, Professional, Appointment } from '../types';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Calendar.css';
import { Loader2, ArrowLeft, Scissors, Users, Calendar as CalendarIcon, Clock, CheckCircle, Info, LogIn } from 'lucide-react';
import Login from './Login';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente de cabeçalho do agendamento
const BookingHeader = ({ provider, onBack }) => (
    <div className="flex items-center mb-6 pb-4 border-b border-gray-700">
        <button onClick={onBack} className="p-2 mr-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors text-white">
            <ArrowLeft size={24} />
        </button>
        <div>
            <h1 className="text-3xl font-bold text-white">{provider.establishmentName}</h1>
            <p className="text-gray-400">{provider.segment} em {provider.address?.city}</p>
        </div>
    </div>
);

// Componente do Stepper (indicador de progresso)
const Stepper = ({ currentStep }) => (
    <div className="flex justify-between items-center mb-8">
        {[
            { step: 1, name: 'Serviços', icon: <Scissors size={20} /> },
            { step: 2, name: 'Profissional', icon: <Users size={20} /> },
            { step: 3, name: 'Data & Hora', icon: <CalendarIcon size={20} /> },
            { step: 4, name: 'Confirmação', icon: <CheckCircle size={20} /> },
        ].map((item) => (
            <div key={item.step} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${currentStep >= item.step ? 'bg-[#daa520]' : 'bg-gray-700'}`}>
                    {item.icon}
                </div>
                <span className={`mt-2 text-sm text-center ${currentStep >= item.step ? 'text-white' : 'text-gray-400'}`}>{item.name}</span>
            </div>
        ))}
    </div>
);

// Interface para as props do componente Booking
interface BookingProps {
  professional: UserProfile;
  onBack: () => void;
}

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
  
  // Efeito para buscar horários disponíveis quando a data ou profissional selecionado muda
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!selectedProfessional || !selectedDate) {
        setAvailableTimes([]);
        return;
      }

      setLoadingTimes(true);
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const professionalDocRef = doc(db, 'users', serviceProvider.uid);
        const professionalSnap = await getDoc(professionalDocRef);
        
        if (professionalSnap.exists()) {
          const providerData = professionalSnap.data() as UserProfile;
          const currentProfessional = providerData.professionals?.find(p => p.id === selectedProfessional.id);
          
          if (currentProfessional) {
            // Garante que 'availability' é um array antes de chamar .find()
            const professionalAvailability = Array.isArray(currentProfessional.availability) ? currentProfessional.availability : [];
            const availabilityForDate = professionalAvailability.find(a => a.date === dateString);
            if (availabilityForDate) {
              // Filtrar horários já agendados
              const appointmentsQuery = query(
                collection(db, 'appointments'),
                where('serviceProviderId', '==', serviceProvider.uid),
                where('professionalId', '==', selectedProfessional.id),
                where('date', '==', dateString),
                where('status', 'in', ['pending', 'confirmed']) // Apenas agendamentos pendentes ou confirmados
              );
              const appointmentsSnapshot = await getDocs(appointmentsQuery);
              const bookedTimes = appointmentsSnapshot.docs.map(doc => doc.data().time);
              
              const filteredTimes = availabilityForDate.availableTimes.filter(time => !bookedTimes.includes(time));
              setAvailableTimes(filteredTimes.sort()); // Garante que os horários estejam em ordem
            } else {
              setAvailableTimes([]);
            }
          } else {
            setAvailableTimes([]);
          }
        } else {
          setAvailableTimes([]);
        }
      } catch (error) {
        console.error("Erro ao buscar horários disponíveis:", error);
        showToast("Erro ao carregar horários disponíveis.", { type: 'error' });
        setAvailableTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    };

    fetchAvailableTimes();
  }, [selectedDate, selectedProfessional, serviceProvider.uid, showToast]);

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
        establishmentName: serviceProvider.establishmentName,
        serviceName: selectedServices.map(s => s.name).join(', '),
        professionalName: selectedProfessional.name,
        clientName: currentUser.displayName,
        totalPrice: selectedServices.reduce((total, s) => total + s.price, 0),
    };

    try {
        await addDoc(collection(db, 'appointments'), newAppointment);
        showToast("Agendamento solicitado com sucesso! Aguarde a confirmação.", { type: 'success' });
        onBack(); // Usa a prop onBack para fechar a vista
    } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        showToast("Falha ao criar agendamento. Tente novamente.", { type: 'error' });
    }
  };

  // Renderiza um estado de carregamento ou erro se o provedor não for encontrado
  if (!serviceProvider) {
    return (
      <div className="text-center p-16">
        <Info size={48} className="mx-auto text-red-500" />
        <h3 className="mt-4 text-xl font-semibold text-gray-800">Estabelecimento não encontrado</h3>
        <p className="mt-2 text-gray-500">Não foi possível carregar as informações.</p>
        <button onClick={onBack} className="mt-6 px-6 py-2 bg-[#daa520] text-black rounded-lg">Voltar</button>
      </div>
    );
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
      <BookingHeader provider={serviceProvider} onBack={() => setStep(step > 1 ? step - 1 : onBack())} />
      <Stepper currentStep={step} />
      
      <div className="mt-8 min-h-[300px]">
        {step === 1 && (
          <div className="animate-fade-in-down">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Selecione os Serviços</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceProvider.professionals?.flatMap(p => p.services).filter((service, index, self) => 
                  index === self.findIndex((s) => s.id === service.id) // Filtra serviços únicos
              ).map(service => (
                <button
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-start text-left transition-all duration-200 ${selectedServices.some(s => s.id === service.id) ? 'border-[#daa520] bg-[#daa520]/20' : 'border-gray-700 bg-gray-800 hover:border-[#daa520]/50 hover:bg-gray-700/50'}`}
                >
                  <span className="font-semibold text-lg text-white">{service.name}</span>
                  <span className="text-gray-300 text-sm">{service.description}</span>
                  <span className="text-[#daa520] font-bold mt-2">R$ {service.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-8">
              <button onClick={handleConfirmServices} className="bg-[#daa520] text-gray-900 font-semibold px-8 py-3 rounded-lg hover:bg-[#c8961e] transition-colors">
                Próximo
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-down">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Selecione o Profissional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceProvider.professionals?.map(professional => (
                <button
                  key={professional.id}
                  onClick={() => handleSelectProfessional(professional)}
                  className={`p-4 rounded-lg border-2 flex items-center text-left transition-all duration-200 ${selectedProfessional?.id === professional.id ? 'border-[#daa520] bg-[#daa520]/20' : 'border-gray-700 bg-gray-800 hover:border-[#daa520]/50 hover:bg-gray-700/50'}`}
                >
                  <img src={professional.photoURL || 'https://placehold.co/80x80/111827/4B5563?text=Prof'} alt={`Foto de ${professional.name}`} className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-gray-600" />
                  <div>
                    <span className="font-semibold text-lg text-white">{professional.name}</span>
                    <p className="text-gray-300 text-sm">{professional.specialty}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in-down">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Selecione a Data e Hora</h3>
            <div className="flex flex-col md:flex-row gap-8 justify-center">
              <div className="flex-shrink-0">
                <Calendar
                  onChange={(date) => setSelectedDate(date as Date)}
                  value={selectedDate}
                  minDate={new Date()}
                  className="react-calendar"
                />
              </div>
              <div className="flex-grow bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h4 className="text-xl font-bold text-white mb-4">Horários Disponíveis para {format(selectedDate, 'dd/MM', { locale: ptBR })}</h4>
                {loadingTimes ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="animate-spin text-[#daa520] w-8 h-8" />
                    <span className="ml-3 text-gray-400">Carregando horários...</span>
                  </div>
                ) : availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {availableTimes.map(time => (
                      <button
                        key={time}
                        onClick={() => handleSelectTime(time)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${selectedTime === time ? 'bg-[#daa520] text-gray-900 border-[#daa520]' : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-10">
                    <Clock size={32} className="mx-auto text-gray-600 mb-3" />
                    <p>Nenhum horário disponível para esta data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in-down">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Confirme Seu Agendamento</h3>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
              <p className="text-lg font-semibold text-white mb-4">Detalhes do Agendamento:</p>
              <ul className="space-y-3 text-gray-300">
                <li><span className="font-medium text-white">Estabelecimento:</span> {serviceProvider.establishmentName}</li>
                <li><span className="font-medium text-white">Profissional:</span> {selectedProfessional?.name}</li>
                <li><span className="font-medium text-white">Serviços:</span> {selectedServices.map(s => s.name).join(', ')}</li>
                <li><span className="font-medium text-white">Data:</span> {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</li>
                <li><span className="font-medium text-white">Hora:</span> {selectedTime}</li>
                <li><span className="font-medium text-white">Preço Total:</span> R$ {selectedServices.reduce((total, s) => total + s.price, 0).toFixed(2)}</li>
              </ul>
            </div>
            <div className="flex justify-end mt-8">
              <button onClick={handleConfirmBooking} className="bg-[#daa520] text-gray-900 font-semibold px-8 py-3 rounded-lg hover:bg-[#c8961e] transition-colors">
                Confirmar Agendamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;

import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import { format, parse, add } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, Tag, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { createAppointment } from '../../firebase/bookingService';
import useBookingProcessStore from '../../store/bookingProcessStore';

const Confirmation = ({ onBookingConfirmed }: { onBookingConfirmed: () => void }) => {
  const {
    serviceProvider,
    selectedServices,
    selectedProfessional,
    selectedDate,
    selectedTime,
  } = useBookingProcessStore();
  const { userProfile } = useAuthStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { totalPrice, totalDuration } = useMemo(() => {
    const price = selectedServices.reduce((acc, service) => acc + service.price, 0);
    const duration = selectedServices.reduce((acc, service) => acc + service.duration, 0);
    return { totalPrice: price, totalDuration: duration };
  }, [selectedServices]);

  const handleConfirmBooking = async () => {
    if (!userProfile || !serviceProvider || !selectedDate || !selectedTime) {
      showToast('Faltam informações para completar o agendamento.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const startTimeObject = parse(selectedTime, 'HH:mm', selectedDate);
      const endTimeObject = add(startTimeObject, { minutes: totalDuration });

      // --- CORREÇÃO AQUI ---
      // Lógica robusta para garantir que o nome do estabelecimento seja salvo.
      // Prioridade: 1º companyName, 2º displayName, 3º "Estabelecimento"
      const providerName = serviceProvider.companyName || serviceProvider.displayName || "Estabelecimento";

      const appointmentData = {
        clientId: userProfile.uid,
        clientName: userProfile.name || userProfile.email || "Cliente",
        serviceProviderId: serviceProvider.uid,
        serviceProviderName: providerName, // <-- Usando a variável segura
        serviceProviderPhotoURL: serviceProvider.photoURL || null,
        
        professionalId: selectedProfessional?.id || 'any',
        professionalName: selectedProfessional?.name || 'Qualquer Profissional',
        
        serviceId: selectedServices[0]?.id || '',
        serviceName: selectedServices.map(s => s.name).join(', '),

        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        endTime: format(endTimeObject, 'HH:mm'),

        price: totalPrice,
        duration: totalDuration,
      };

      await createAppointment(appointmentData);

      showToast('Agendamento confirmado com sucesso!', 'success');
      onBookingConfirmed();
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      showToast('Não foi possível confirmar o agendamento.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!selectedDate || !selectedTime) {
      return <div>Carregando informações...</div>
  }

  return (
    <div className="animate-fade-in-down">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">Confirme seu Agendamento</h2>
        <p className="text-gray-400 mt-1">Revise os detalhes abaixo antes de confirmar.</p>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 space-y-4">
        <div className="flex justify-between items-center">
            <span className="flex items-center gap-3 text-gray-300"><Calendar size={18}/> Data</span>
            <span className="font-bold text-white">{format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="flex items-center gap-3 text-gray-300"><Clock size={18}/> Horário</span>
            <span className="font-bold text-white">{selectedTime}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="flex items-center gap-3 text-gray-300"><User size={18}/> Profissional</span>
            <span className="font-bold text-white">{selectedProfessional?.name || 'Qualquer Profissional'}</span>
        </div>

        <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
             <h3 className="text-lg font-semibold text-white flex items-center gap-3"><Tag size={18}/> Serviços Selecionados</h3>
             {selectedServices.map(service => (
                 <div key={service.id} className="flex justify-between items-center text-gray-300">
                     <span>{service.name}</span>
                     <span className="font-semibold text-white">R$ {service.price.toFixed(2)}</span>
                 </div>
             ))}
        </div>

        <div className="border-t border-gray-600 pt-4 mt-4">
            <div className="flex justify-between items-center text-xl">
                <span className="flex items-center gap-3 font-bold text-white"><DollarSign size={20}/> Valor Total</span>
                <span className="font-bold text-2xl text-[#daa520]">R$ {totalPrice.toFixed(2)}</span>
            </div>
        </div>
      </div>
      
       <div className="mt-8">
        <button
          onClick={handleConfirmBooking}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="animate-spin" size={24} /> : <><CheckCircle size={22}/>Confirmar Agendamento</>}
        </button>
      </div>
    </div>
  );
};

export default Confirmation;
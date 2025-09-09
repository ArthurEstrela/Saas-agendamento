import React, { useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../context/ToastContext";
import { format, parse, add } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  Tag,
  DollarSign,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { createAppointment } from "../../firebase/bookingService";
import { useNavigate, useLocation } from 'react-router-dom'; // Importe o useNavigate
import useBookingProcessStore from "../../store/bookingProcessStore"; // Adicione esta linha


const Confirmation = ({ onBookingConfirmed }: { onBookingConfirmed: () => void; }) => {
  const {
    serviceProvider,
    selectedServices,
    selectedProfessional,
    selectedDate,
    selectedTime,
  } = useBookingProcessStore();
  const { userProfile } = useAuthStore();
  const navigate = useNavigate(); // Hook para navegação
  const location = useLocation();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { totalPrice, totalDuration } = useMemo(() => {
      if (!selectedServices) return { totalPrice: 0, totalDuration: 0 };
    const price = selectedServices.reduce(
      (acc, service) => acc + service.price,
      0
    );
    const duration = selectedServices.reduce(
      (acc, service) => acc + service.duration,
      0
    );
    return { totalPrice: price, totalDuration: duration };
  }, [selectedServices]);

   const handleConfirmBooking = async () => {
    // Se não tiver usuário, redireciona para o login
    if (!userProfile) {
      // 1. Verifica se temos todas as informações necessárias
      if (serviceProvider && selectedServices && selectedServices.length > 0 && selectedProfessional && selectedDate && selectedTime) {
        
        // 2. Cria o objeto de agendamento pendente com os dados da tela
        const pendingBooking = {
          serviceProviderId: serviceProvider.uid,
          serviceProviderName: serviceProvider.companyName || serviceProvider.displayName,
          serviceProviderPhotoURL: serviceProvider.photoURL || null,
          
          professionalId: selectedProfessional.id,
          professionalName: selectedProfessional.name,

          // Salva a lista completa de serviços
          services: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),

          date: selectedDate,
          startTime: selectedTime,
          duration: totalDuration,
          price: totalPrice,
        };

        // 3. Salva o objeto no localStorage para recuperar depois do login
        localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
        
        // 4. Redireciona o usuário para a tela de login
        showToast("Faça login para continuar", "info");
        navigate('/login', { state: { from: location.pathname } });

      } else {
        showToast("Faltam informações para completar o agendamento.", "error");
      }
      return; // Impede a continuação da função
    }
     if (!serviceProvider || !selectedDate || !selectedTime) {
      showToast("Faltam informações para completar o agendamento.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const providerName =
        serviceProvider.companyName ||
        serviceProvider.displayName ||
        "Estabelecimento";

      // ✅ CORREÇÃO AQUI: Renomeie 'userId' para 'clientId'
      const appointmentData = {
        clientId: userProfile.uid, // Alterado de userId para clientId
        clientName: userProfile.name || userProfile.email || "Cliente",
        clientPhotoURL: userProfile.photoURL || null,

        serviceProviderId: serviceProvider.uid,
        serviceProviderName: providerName,
        serviceProviderPhotoURL: serviceProvider.photoURL || null,

        professionalId: selectedProfessional?.id || "any",
        professionalName: selectedProfessional?.name || "Qualquer Profissional",

        serviceId: selectedServices[0]?.id || "",
        serviceName: selectedServices.map((s) => s.name).join(", "),

        date: selectedDate,
        startTime: selectedTime,
        duration: totalDuration,
        price: totalPrice,
      };

      await createAppointment(appointmentData as any);

      showToast("Agendamento confirmado com sucesso!", "success");

      queryClient.invalidateQueries({
        queryKey: ["appointments", userProfile.uid],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", serviceProvider.uid],
      });

      onBookingConfirmed();
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      // O erro exibido aqui vem da exceção lançada em bookingService.ts
      showToast(
        "Não foi possível confirmar o agendamento. Verifique o console para detalhes.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDate || !selectedTime) {
    return <div>Carregando informações...</div>;
  }

  return (
    <div className="animate-fade-in-down">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">
          Confirme seu Agendamento
        </h2>
        <p className="text-gray-400 mt-1">
          Revise os detalhes abaixo antes de confirmar.
        </p>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 space-y-4">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-3 text-gray-300">
            <Calendar size={18} /> Data
          </span>
          <span className="font-bold text-white">
            {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-3 text-gray-300">
            <Clock size={18} /> Horário
          </span>
          <span className="font-bold text-white">{selectedTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-3 text-gray-300">
            <User size={18} /> Profissional
          </span>
          <span className="font-bold text-white">
            {selectedProfessional?.name || "Qualquer Profissional"}
          </span>
        </div>

        <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-3">
            <Tag size={18} /> Serviços Selecionados
          </h3>
          {selectedServices.map((service) => (
            <div
              key={service.id}
              className="flex justify-between items-center text-gray-300"
            >
              <span>{service.name}</span>
              <span className="font-semibold text-white">
                R$ {service.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-600 pt-4 mt-4">
          <div className="flex justify-between items-center text-xl">
            <span className="flex items-center gap-3 font-bold text-white">
              <DollarSign size={20} /> Valor Total
            </span>
            <span className="font-bold text-2xl text-[#daa520]">
              R$ {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleConfirmBooking}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <CheckCircle size={22} />
              Confirmar Agendamento
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Confirmation;

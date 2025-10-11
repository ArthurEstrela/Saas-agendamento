// src/components/booking/Confirmation.tsx
import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { useAuthStore } from "../../store/authStore"; // Auth store continua o mesmo
import { useProfileStore } from "../../store/profileStore"; // Usamos para pegar o perfil do cliente
import { Loader2, Calendar, User, Scissors, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { ClientProfile } from "../../types";

export const Confirmation = () => {
    // ✅ Pega os dados e o novo objeto `status`
  const {
    selectedServices,
    provider,
    selectedProfessional,
    selectedDate,
    selectedTimeSlot,
    status,
    confirmBooking,
    goToPreviousStep,
    setRedirectUrlAfterLogin,
  } = useBookingProcessStore();

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { userProfile } = useProfileStore(); // Pega o perfil do cliente logado

  const { totalDuration, totalPrice } = useMemo(() => {
    // ... (sua lógica de cálculo está perfeita)
    return selectedServices.reduce(
      (acc, service) => {
        acc.totalDuration += service.duration;
        acc.totalPrice += service.price;
        return acc;
      },
      { totalDuration: 0, totalPrice: 0 }
    );
  }, [selectedServices]);

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      if (provider?.id) {
        // ✅ Lógica de redirect para login já estava ótima, mantida
        const redirectPath = `/book/${provider.id}`;
        setRedirectUrlAfterLogin(redirectPath);
        navigate(`/login`);
      }
      return;
    }

    // ✅ Validação robusta
    if (!userProfile || userProfile.role !== 'client') {
        // Idealmente, usar um toast aqui
        console.error("Usuário logado não é um cliente ou perfil não carregado.");
        return;
    }

    // ✅ Chama a nova função `confirmBooking` passando o perfil do cliente
    await confirmBooking(userProfile as ClientProfile);
  };
  
    // Seu JSX de resumo está impecável. A única mudança é conectar o estado de loading
    // e o botão de confirmação à nova lógica.
  const formattedDate = selectedDate
    ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
    : "Data não selecionada";

  return (
    <div className="max-w-2xl mx-auto bg-black/30 p-8 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Confirme os Detalhes
      </h2>
      {/* ... (todo o seu JSX de resumo dos detalhes aqui) ... */}
        <div className="space-y-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#daa520] mb-3 flex items-center gap-2">
                    <Scissors size={18} /> Serviços Selecionados
                </h3>
                <ul className="space-y-2">
                    {selectedServices.map((service) => (
                        <li key={service.id} className="flex justify-between items-center text-gray-300">
                            <span>{service.name}</span>
                            <span className="font-mono">R$ {service.price.toFixed(2)}</span>
                        </li>
                    ))}
                    <li className="flex justify-between items-center text-white font-bold border-t border-gray-700 pt-3 mt-3">
                        <span>Total</span>
                        <span className="font-mono">R$ {totalPrice.toFixed(2)}</span>
                    </li>
                </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-[#daa520] mb-2 flex items-center gap-2">
                        <Calendar size={18} /> Início do Atendimento
                    </h3>
                    <p className="text-white">{formattedDate}</p>
                    <p className="text-white font-bold text-lg">{selectedTimeSlot}</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-[#daa520] mb-2 flex items-center gap-2">
                        <User size={18} /> Profissional
                    </h3>
                    <p className="text-white">
                        {selectedProfessional?.name || "Não selecionado"}
                    </p>
                </div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                <h3 className="font-semibold text-[#daa520] mb-2 flex items-center justify-center gap-2">
                    <Clock size={18} /> Duração Total Estimada
                </h3>
                <p className="text-white text-lg font-bold">
                    {totalDuration} minutos
                </p>
            </div>
        </div>
      
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <button onClick={goToPreviousStep} className="secondary-button w-full">
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          // ✅ Conectado ao novo estado de confirmação
          disabled={status.isConfirming}
          className="primary-button w-full"
        >
          {status.isConfirming ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Confirmar Agendamento"
          )}
        </button>
      </div>
    </div>
  );
};
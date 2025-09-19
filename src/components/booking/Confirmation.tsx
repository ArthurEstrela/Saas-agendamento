import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { useAuthStore } from "../../store/authStore";
import {
  Loader2,
  Calendar,
  User,
  Scissors,
  DollarSign,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import type { Appointment } from "../../types";
import { Link, useNavigate } from "react-router-dom";
import { useProfileStore } from "../../store/profileStore";

export const Confirmation = () => {
  const {
    selectedServices,
    provider,
    professional,
    date,
    timeSlot,
    isBooking,
    bookingSuccess,
    bookingError,
    confirmBooking,
    goToPreviousStep,
    resetBooking,
    setPendingProviderId,
  } = useBookingProcessStore();

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { userProfile } = useProfileStore();

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

 const handleConfirm = async () => {
    if (!isAuthenticated) {
      if (provider?.id) {
        // A gente ainda salva na store, como um fallback. Está correto.
        setPendingProviderId(provider.id);

        // ALTERAÇÃO: Passamos o caminho de volta como um parâmetro na URL
        const redirectPath = `/book/${provider.id}`;
        // O encodeURIComponent garante que a URL seja formatada corretamente
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
      return; // Para a execução da função aqui.
    }
    // 1. Verificamos se 'user' existe antes de continuar
    if (
      !user ||
      !userProfile ||
      !provider ||
      !professional ||
      !date ||
      !timeSlot ||
      selectedServices.length === 0
    ) {
      // Idealmente, você teria uma mensagem de erro mais específica aqui
      console.error("Dados do agendamento incompletos ou usuário não logado.");
      return;
    }

    const startTime = new Date(date);
    const [hours, minutes] = timeSlot.split(":").map(Number);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    const serviceName = selectedServices
      .map((service) => service.name)
      .join(", ");

    const appointmentData: Omit<Appointment, "id"> = {
      clientId: user.uid,
      providerId: provider.id,
      clientName: userProfile.name || "Cliente sem nome",
      professionalId: professional.id,
      professionalName: professional.name,
      services: selectedServices,
      serviceName: serviceName, 
      startTime,
      endTime,
      status: "pending",
      totalPrice,
      totalDuration,
    };

    await confirmBooking(appointmentData);
  };

  const formattedDate = date
    ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
    : "Data não selecionada";

  if (bookingSuccess) {
    return (
      <div className="text-center max-w-lg mx-auto">
        <h2 className="text-3xl font-bold text-green-400 mb-4">
          Agendamento Solicitado!
        </h2>
        <p className="text-gray-300 mb-6">
          Sua solicitação foi enviada com sucesso. Você pode acompanhar o status
          na sua área de agendamentos.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button onClick={resetBooking} className="secondary-button">
            Fazer Novo Agendamento
          </button>
          <Link to="/dashboard" className="primary-button">
            Ver Meus Agendamentos
          </Link>
        </div>
      </div>
    );
  }

  // O JSX não precisa de mudanças, pois já estava pronto para isso.
  return (
    <div className="max-w-2xl mx-auto bg-black/30 p-8 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Confirme os Detalhes
      </h2>
      <div className="space-y-4">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h3 className="font-semibold text-[#daa520] mb-3 flex items-center gap-2">
            <Scissors size={18} /> Serviços Selecionados
          </h3>
          <ul className="space-y-2">
            {selectedServices.map((service) => (
              <li
                key={service.id}
                className="flex justify-between items-center text-gray-300"
              >
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
            <p className="text-white font-bold text-lg">{timeSlot}</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-[#daa520] mb-2 flex items-center gap-2">
              <User size={18} /> Profissional
            </h3>
            <p className="text-white">
              {professional?.name || "Não selecionado"}
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
      {bookingError && (
        <p className="text-red-400 text-center mt-4">{bookingError}</p>
      )}
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <button onClick={goToPreviousStep} className="secondary-button w-full">
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={isBooking}
          className="primary-button w-full"
        >
          {isBooking ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Confirmar Agendamento"
          )}
        </button>
      </div>
    </div>
  );
};

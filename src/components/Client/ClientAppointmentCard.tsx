// src/components/Client/ClientAppointmentCard.tsx
import type { EnrichedAppointment } from "../../store/userAppointmentsStore";
import { format, isBefore, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  Calendar,
  Clock,
  MapPin,
  Scissors,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { CancelAppointmentModal } from "../Common/CancelAppointmentModal";
import { useUserAppointmentsStore } from "../../store/userAppointmentsStore";
import ReviewModal from "../Common/ReviewModal";
import { useReviewStore } from "../../store/reviewStore";

// StatusBadge (código inalterado)
const StatusBadge = ({ status }: { status: EnrichedAppointment["status"] }) => {
  const statusInfo = {
    scheduled: {
      text: "Confirmado",
      color: "bg-green-500/20 text-green-400",
      icon: <CheckCircle size={14} />,
    },
    pending: {
      text: "Pendente",
      color: "bg-yellow-500/20 text-yellow-400",
      icon: <MoreHorizontal size={14} />,
    },
    completed: {
      text: "Concluído",
      color: "bg-blue-500/20 text-blue-400",
      icon: <CheckCircle size={14} />,
    },
    cancelled: {
      text: "Cancelado",
      color: "bg-red-500/20 text-red-400",
      icon: <XCircle size={14} />,
    },
  };

  const currentStatus = statusInfo[status] || {
    text: "Desconhecido",
    color: "bg-gray-500/20 text-gray-400",
    icon: <AlertCircle size={14} />,
  };

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${currentStatus.color}`}
    >
      {currentStatus.icon} <span>{currentStatus.text}</span>
    </div>
  );
};

export const ClientAppointmentCard = ({
  appointment,
}: {
  appointment: EnrichedAppointment;
}) => {
  const {
    professionalName,
    startTime,
    services,
    provider,
    // professionalPhotoUrl, // <-- REMOVIDO (Nome antigo)
    professionalAvatarUrl, // <-- ADICIONADO: Foto salva no snapshot
    providerAvatarUrl, // <-- ADICIONADO: Logo salvo no snapshot
    status,
  } = appointment;

  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const { submitReview, isSubmitting } = useReviewStore();
  const { cancelAppointment, isLoading: isCancelling } =
    useUserAppointmentsStore();

  const formattedDate = format(startTime, "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });
  const formattedTime = format(startTime, "HH:mm");

  // ✅ CORREÇÃO BÔNUS: Link do Google Maps corrigido
  const handleNavigation = () => {
    if (provider?.businessAddress) {
      const { street, city, state } = provider.businessAddress;
      const address = encodeURIComponent(`${street}, ${city}, ${state}`);
      // Abre a busca do Google Maps corretamente
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${address}`,
        "_blank"
      );
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    const reviewData = {
      rating,
      comment,
      clientId: appointment.clientId,
      clientName: appointment.clientName,
      serviceProviderId: appointment.providerId,
      professionalId: appointment.professionalId,
      professionalName: appointment.professionalName,
      appointmentId: appointment.id,
    };

    await submitReview(appointment.id, reviewData);
    setReviewModalOpen(false);
  };

  const handleCancelConfirm = async (reason: string) => {
    await cancelAppointment(appointment.id, reason);
    setCancelModalOpen(false);
  };

  const cancellationDeadline = subHours(appointment.startTime, 2);
  const now = new Date();

  const canCancel =
    (appointment.status === "scheduled" || appointment.status === "pending") &&
    isBefore(now, cancellationDeadline);

  const hasCancellationTimeExpired =
    (appointment.status === "scheduled" || appointment.status === "pending") &&
    !isBefore(now, cancellationDeadline) &&
    isBefore(now, appointment.startTime);

  // ✅ LÓGICA DA IMAGEM: Prioridade = Profissional > Logo do Prestador Salvo > Logo Atual > Ícone
  const displayImage =
    professionalAvatarUrl || providerAvatarUrl || provider?.logoUrl;

  return (
    <>
      <motion.div
        className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-gray-600 hover:shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Cabeçalho do Card */}
        <div className="p-5 flex items-start gap-4 bg-gray-800/60">
          <div className="w-16 h-16 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600 flex items-center justify-center">
            {displayImage ? (
              <img
                src={displayImage}
                alt={professionalName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={32} className="text-gray-500" />
            )}
          </div>

          <div className="flex-grow">
            <h3 className="text-lg font-bold text-white">{professionalName}</h3>

            <p className="text-sm text-gray-400">
              em{" "}
              <span className="font-semibold text-gray-300">
                {provider?.businessName || "Local não informado"}
              </span>
            </p>
            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Corpo do Card com Detalhes */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 text-gray-300">
            <Calendar size={18} className="text-amber-500" />
            <span className="capitalize">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-3 text-gray-300">
            <Clock size={18} className="text-amber-500" />
            <span>{formattedTime}</span>
          </div>

          {provider?.businessAddress && (
            <div className="flex items-start gap-3 text-gray-300">
              <MapPin size={18} className="text-amber-500 mt-0.5" />
              <span>{`${provider.businessAddress.street}, ${provider.businessAddress.city}`}</span>
              <button
                onClick={handleNavigation}
                className="ml-auto text-amber-400 hover:text-amber-300 text-sm font-semibold hover:underline"
              >
                Ver no mapa
              </button>
            </div>
          )}

          {/* Lista de Serviços */}
          <div className="pt-4 border-t border-gray-700">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Scissors size={18} className="text-amber-500" />
              Serviços
            </h4>

            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-gray-700/50 text-xs text-gray-300 px-2 py-1 rounded-md"
                >
                  {service.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="bg-gray-900/50 px-5 py-3 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-400">
            Valor Total
          </span>
          <span className="text-lg font-bold text-white">
            R$ {appointment.totalPrice.toFixed(2)}
          </span>
        </div>

        {/* Botões de Ação */}
        {(status === "completed" && !appointment.review) || canCancel ? (
          <div className="p-4 bg-gray-900/80 flex gap-2">
            {status === "completed" && !appointment.review && (
              <button
                onClick={() => setReviewModalOpen(true)}
                className="w-full bg-amber-500 text-black font-bold py-2 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <Star size={16} /> Avaliar
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="w-full danger-button flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> Cancelar Agendamento
              </button>
            )}

            {hasCancellationTimeExpired && (
              <div className="flex items-center justify-center gap-2 text-sm text-yellow-400 p-2 bg-yellow-900/50 rounded-lg w-full">
                <Clock size={16} />
                <span>Prazo para cancelamento online expirado.</span>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        appointment={appointment}
        onSubmit={handleReviewSubmit}
        isLoading={isSubmitting}
      />
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
        userType="client"
        appointmentId={appointment.id}
      />
    </>
  );
};

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Appointment } from "../../types";
import {
  Calendar,
  Clock,
  Store,
  Tag,
  User,
  MoreVertical,
  XCircle,
  MessageSquare,
  Star,
} from "lucide-react";
import ConfirmationModal from "../Common/ConfirmationModal";
import ReviewModal from "../Common/ReviewModal";

interface ClientAppointmentCardProps {
  appointment: Appointment;
  onCancel: (bookingId: string) => void;
}

const ClientAppointmentCard = ({
  appointment,
  onCancel,
}: ClientAppointmentCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // --- CLÁUSULA DE GUARDA ---
  // Se o agendamento for inválido por qualquer motivo, não renderiza o card.
  // Isso previne o erro "Cannot read properties of undefined".
  if (!appointment || !appointment.date || !appointment.startTime) {
    console.warn(
      "Tentativa de renderizar um Card de Agendamento inválido:",
      appointment
    );
    return null;
  }

  const appointmentDate = parseISO(
    `${appointment.date}T${appointment.startTime}`
  );
  const isPast = appointmentDate < new Date();

  const getStatusChip = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-500/20 text-blue-400";
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const handleCancelConfirm = () => {
    onCancel(appointment.id);
    setIsCancelModalOpen(false);
  };

  return (
    <div className="group relative bg-gray-800/80 p-5 rounded-xl border border-gray-700 hover:border-[#daa520]/50 transition-all duration-300">
      {/* Menu Dropdown */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          <MoreVertical size={20} className="text-gray-300" />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10">
            {appointment.status === "confirmed" && !isPast && (
              <button
                onClick={() => {
                  setIsCancelModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
              >
                <XCircle size={16} /> Cancelar
              </button>
            )}
            {appointment.status === "completed" &&
              !appointment.hasBeenReviewed && (
                <button
                  onClick={() => {
                    setIsReviewModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 flex items-center gap-2"
                >
                  <Star size={16} /> Avaliar
                </button>
              )}
            {/* A propriedade serviceProviderPhone não existe no Appointment, vamos usar um placeholder */}
            <a
              href={`#`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2"
            >
              <MessageSquare size={16} /> Contato
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-shrink-0">
          <img
            src={
              appointment.serviceProviderPhotoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                appointment.serviceProviderName
              )}&background=2d3748&color=ffffff`
            }
            alt={appointment.serviceProviderName}
            className="h-20 w-20 rounded-lg object-cover"
          />
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Store size={20} />
              {appointment.serviceProviderName}
            </h3>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusChip(
                typeof appointment.status === "object"
                  ? String(appointment.status)
                  : appointment.status
              )}`}
            >
              {typeof appointment.status === "object"
                ? String(appointment.status)
                : appointment.status}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-lg text-gray-200 font-medium flex items-center gap-2">
              <Tag size={18} className="text-[#daa520]" />
              {appointment.serviceName}
            </p>
          </div>

          <div className="border-t border-gray-700 pt-3 space-y-2 text-sm text-gray-400">
            <p className="flex items-center gap-2">
              <Calendar size={16} />
              {format(appointmentDate, "eeee, dd 'de' MMMM, yyyy", {
                locale: ptBR,
              })}
            </p>
            <p className="flex items-center gap-2">
              <Clock size={16} />
              {appointment.startTime} - {appointment.endTime}
            </p>
            <p className="flex items-center gap-2">
              <User size={16} />
              {appointment.professionalName}
            </p>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Confirmar Cancelamento"
        message="Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
      />

      {isReviewModalOpen && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          appointment={appointment}
        />
      )}
    </div>
  );
};

export default ClientAppointmentCard;

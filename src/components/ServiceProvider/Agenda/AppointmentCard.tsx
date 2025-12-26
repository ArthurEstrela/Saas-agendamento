import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import { format, isPast } from "date-fns";
import { motion } from "framer-motion";
import { Clock, User, Scissors, DollarSign, MessageCircle } from "lucide-react";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";

// UI Primitivos
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";

export const AppointmentCard = ({
  appointment,
}: {
  appointment: EnrichedProviderAppointment;
}) => {
  const { setSelectedAppointment } = useProviderAppointmentsStore();
  const { client, startTime, services } = appointment;

  const handleCardClick = () => setSelectedAppointment(appointment);

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client?.phoneNumber) return;
    const cleanPhone = client.phoneNumber.replace(/\D/g, "");
    const serviceName = services[0]?.name || "serviço";

    let message = "";
    if (isPast(startTime)) {
      message = `Olá ${client.name}, faz tempo que não te vejo! Bora marcar aquele ${serviceName}?`;
    } else {
      const timeString = format(startTime, "HH:mm");
      message = `Olá ${client.name}, passando para confirmar nosso agendamento de ${serviceName} às ${timeString}.`;
    }
    window.open(
      `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  // Motion Wrapper
  const MotionCard = motion(Card);

  return (
    <MotionCard
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="p-3 bg-gray-900 border-gray-800 cursor-pointer hover:border-primary/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-primary/5 transition-all h-full flex flex-col justify-between group"
    >
      <div>
        {/* Header: Hora e Duração */}
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800 group-hover:border-gray-700">
          <Badge
            variant="outline"
            className="text-sm font-bold border-primary/20 text-primary bg-primary/5 px-2"
          >
            {format(startTime, "HH:mm")}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Clock size={10} />
            <span>{appointment.totalDuration} min</span>
          </div>
        </div>

        {/* Info Principal */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User size={12} className="text-gray-400 shrink-0" />
            <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
              {client?.name || "Cliente"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Scissors size={12} className="text-gray-500 shrink-0" />
            <p className="text-xs text-gray-400 truncate">
              {services.map((s) => s.name).join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer: Preço e Ação */}
      <div className="flex justify-between items-end mt-3 pt-2 border-t border-gray-800 group-hover:border-gray-700">
        {client?.phoneNumber ? (
          <button
            onClick={handleWhatsAppClick}
            className="text-gray-500 hover:text-green-500 transition-colors p-1 -ml-1 rounded-md hover:bg-green-500/10"
            title="Enviar WhatsApp"
          >
            <MessageCircle size={16} />
          </button>
        ) : (
          <div />
        )}

        <span className="text-sm font-bold text-gray-100 flex items-center">
          <span className="text-xs text-gray-500 mr-0.5">R$</span>
          {appointment.totalPrice.toFixed(2)}
        </span>
      </div>
    </MotionCard>
  );
};

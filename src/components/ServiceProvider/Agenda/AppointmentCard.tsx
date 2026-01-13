import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import { format, isPast } from "date-fns";
import { motion } from "framer-motion";
import { Clock, User, Scissors, MessageCircle } from "lucide-react";
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

  const { client, startTime, services, clientPhone } = appointment;

  const handleCardClick = () => setSelectedAppointment(appointment);

  const phoneToUse = clientPhone || client?.phoneNumber;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!phoneToUse) return;

    const cleanPhone = phoneToUse.replace(/\D/g, "");
    const serviceName = services[0]?.name || "serviço";

    let message = "";
    if (isPast(startTime)) {
      message = `Olá ${client?.name || "cliente"}, faz tempo que não te vejo! Bora marcar aquele ${serviceName}?`;
    } else {
      const timeString = format(startTime, "HH:mm");
      message = `Olá ${client?.name || "cliente"}, passando para confirmar nosso agendamento de ${serviceName} às ${timeString}.`;
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleCardClick}
      className="relative p-4 bg-gray-900/60 border-gray-800/60 backdrop-blur-sm cursor-pointer hover:border-primary/30 hover:bg-gray-800/80 transition-all h-full flex flex-col justify-between group rounded-xl overflow-hidden"
    >
      {/* Efeito de borda lateral colorida baseada no status */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header: Hora e Duração */}
        <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-800/50">
          <Badge
            variant="outline"
            className="text-base font-bold border-primary/20 text-primary bg-primary/5 px-2.5 py-0.5 rounded-md font-mono"
          >
            {format(startTime, "HH:mm")}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-950/30 px-2 py-1 rounded-full">
            <Clock size={12} />
            <span>{appointment.totalDuration} min</span>
          </div>
        </div>

        {/* Info Principal */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-gray-800 p-1.5 rounded-full shrink-0">
              <User size={14} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
              {client?.name || "Cliente sem nome"}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-gray-800/50 p-1.5 rounded-full shrink-0">
              <Scissors size={14} className="text-gray-500" />
            </div>
            <p className="text-xs text-gray-400 truncate leading-relaxed">
              {services.map((s) => s.name).join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer: Preço e Ação */}
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-800/50">
        {/* ✅ LÓGICA CORRIGIDA: Usa phoneToUse para decidir se exibe o botão */}
        {phoneToUse ? (
          <button
            onClick={handleWhatsAppClick}
            className="text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all p-2 -ml-2 rounded-full flex items-center gap-2 active:scale-95"
            title="Enviar WhatsApp"
          >
            <MessageCircle size={18} />
            <span className="text-xs font-medium hidden sm:inline">
              WhatsApp
            </span>
          </button>
        ) : (
          <div />
        )}

        <span className="font-bold text-gray-100 flex items-baseline bg-gray-950/50 px-3 py-1 rounded-lg border border-gray-800/50">
          <span className="text-[10px] text-gray-500 mr-1 font-normal uppercase">
            R$
          </span>
          {appointment.totalPrice.toFixed(0)}
        </span>
      </div>
    </MotionCard>
  );
};

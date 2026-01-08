import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { motion } from "framer-motion";

// Componentes Primitivos
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

interface ScheduledAppointmentCardProps {
  appointment: EnrichedProviderAppointment;
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const ScheduledAppointmentCard = ({
  appointment,
  onAppointmentSelect,
}: ScheduledAppointmentCardProps) => {
  const { client } = appointment;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = client?.phoneNumber || appointment.clientPhone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) return;

    const time = format(new Date(appointment.startTime), "HH:mm");
    const date = format(new Date(appointment.startTime), "dd/MM");
    const message = `Olá ${appointment.clientName}, confirmando seu horário dia ${date} às ${time}. Tudo certo?`;
    window.open(
      `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const hasPhone = !!(client?.phoneNumber || appointment.clientPhone);
  const initials = appointment.clientName.substring(0, 2).toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onAppointmentSelect(appointment)}
      className="relative bg-gray-900/40 backdrop-blur-sm border border-gray-800/60 rounded-xl p-3 sm:p-4 transition-all cursor-pointer overflow-hidden group active:bg-gray-800/60"
    >
      {/* Indicador de Status lateral com degradê suave */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-primary/20" />

      <div className="flex gap-3 pl-2">
        {/* Bloco de Horário (Foco visual) */}
        <div className="flex flex-col items-center justify-center bg-gray-950/50 rounded-lg p-2 min-w-[3.5rem] w-16 border border-gray-800 shrink-0 h-fit">
          <span className="text-lg font-bold text-white leading-none tracking-tight font-mono">
            {format(new Date(appointment.startTime), "HH:mm")}
          </span>
          <div className="w-full h-px bg-gray-800 my-1" />
          <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
            {format(new Date(appointment.startTime), "EEE", {
              locale: ptBR,
            }).slice(0, 3)}
          </span>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Header: Cliente e Ações */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-9 w-9 border-2 border-gray-800 shadow-sm">
                <AvatarImage
                  src={client?.profilePictureUrl}
                  className="object-cover"
                />
                <AvatarFallback className="text-[10px] bg-gray-800 text-gray-400 font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm font-bold text-gray-100 truncate leading-tight">
                  {appointment.clientName}
                </h3>
                <span className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                  <User size={10} />
                  {appointment.professionalName}
                </span>
              </div>
            </div>

            {/* Botão WhatsApp - Área de toque otimizada */}
            {hasPhone && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleWhatsAppClick}
                className="h-10 w-10 rounded-full text-green-500 hover:text-white hover:bg-green-600 transition-colors shrink-0 -mt-1 -mr-1"
              >
                <FaWhatsapp size={20} />
              </Button>
            )}
          </div>

          {/* Footer: Serviço */}
          <div className="flex items-center">
            <Badge
              variant="secondary"
              className="px-2 py-0.5 h-auto min-h-[24px] text-[11px] font-medium bg-gray-800/80 text-gray-300 border-transparent truncate max-w-full"
            >
              {appointment.serviceName}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

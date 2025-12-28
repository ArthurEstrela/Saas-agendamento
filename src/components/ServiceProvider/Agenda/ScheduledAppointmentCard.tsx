import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, MessageCircle } from "lucide-react"; // Usei MessageCircle como ícone genérico ou FaWhatsapp se preferir
import { FaWhatsapp } from "react-icons/fa";
import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { cn } from "../../../lib/utils/cn";
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
      whileTap={{ scale: 0.98 }}
      onClick={() => onAppointmentSelect(appointment)}
      className="group relative bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 hover:border-primary/40 rounded-xl p-3 sm:p-4 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
    >
      {/* Indicador de Status lateral (Glow effect) */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50" />
      
      <div className="flex gap-3 sm:gap-4 pl-2">
        {/* Bloco de Horário (Destacado) */}
        <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg p-2 min-w-[3.5rem] sm:min-w-[4rem] border border-gray-800/50 h-fit self-start">
          <span className="text-lg sm:text-xl font-bold text-gray-100 leading-none font-mono tracking-tight">
            {format(new Date(appointment.startTime), "HH:mm")}
          </span>
          <div className="w-full h-px bg-gray-700/50 my-1" />
          <span className="text-[10px] sm:text-xs text-primary uppercase font-bold">
            {format(new Date(appointment.startTime), "EEE", { locale: ptBR }).replace('.', '')}
          </span>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          
          {/* Header: Cliente e Avatar */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-gray-700/50">
                <AvatarImage src={client?.profilePictureUrl} className="object-cover"/>
                <AvatarFallback className="text-[10px] bg-gray-800 text-gray-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm font-bold text-gray-200 truncate group-hover:text-primary transition-colors leading-tight">
                  {appointment.clientName}
                </h3>
                <span className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                  <User size={10} />
                  {appointment.professionalName}
                </span>
              </div>
            </div>
            
            {/* Botão WhatsApp (Maior para toque) */}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleWhatsAppClick}
              disabled={!hasPhone}
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all shrink-0 -mt-1 -mr-1",
                hasPhone
                  ? "text-green-500 hover:text-white hover:bg-green-500"
                  : "text-gray-700 opacity-50 cursor-not-allowed"
              )}
              title="Confirmar no WhatsApp"
            >
              <FaWhatsapp size={18} />
            </Button>
          </div>

          {/* Footer: Serviço e Badge */}
          <div className="mt-3 flex items-center justify-between">
            <Badge
              variant="outline"
              className="px-2 py-0.5 h-6 text-[10px] sm:text-xs font-normal truncate max-w-[80%] border-gray-700 bg-gray-800/50 text-gray-300 group-hover:border-primary/30 group-hover:text-primary transition-colors"
            >
              {appointment.serviceName}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
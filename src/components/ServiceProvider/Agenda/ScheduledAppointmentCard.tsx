import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { cn } from "../../../lib/utils/cn";

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
    <div
      onClick={() => onAppointmentSelect(appointment)}
      className="group relative bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-primary/30 rounded-xl p-3 transition-all cursor-pointer overflow-hidden mb-3"
    >
      {/* Indicador de Status lateral */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 transition-colors",
          appointment.status === "scheduled" ? "bg-primary" : "bg-gray-600"
        )}
      />

      <div className="flex gap-3 pl-2">
        {/* Bloco de Horário */}
        <div className="flex flex-col items-center justify-center bg-gray-800 rounded-lg p-2 min-w-[3.5rem] border border-gray-700 h-fit">
          <span className="text-lg font-bold text-gray-100 leading-none">
            {format(new Date(appointment.startTime), "HH:mm")}
          </span>
          <span className="text-[10px] text-primary uppercase font-bold mt-1">
            {format(new Date(appointment.startTime), "EEE", { locale: ptBR })}
          </span>
        </div>

        {/* Info do Cliente */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={client?.profilePictureUrl} />
                <AvatarFallback className="text-[10px] bg-gray-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-sm font-bold text-gray-200 truncate group-hover:text-primary transition-colors">
                {appointment.clientName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className="px-1.5 py-0 h-5 text-[10px] font-normal truncate max-w-full"
            >
              {appointment.serviceName}
            </Badge>
          </div>

          <div className="flex justify-between items-end mt-2">
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <User size={10} />
              <span className="truncate max-w-[100px]">
                {appointment.professionalName}
              </span>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleWhatsAppClick}
              disabled={!hasPhone}
              className={cn(
                "h-7 w-7 rounded-full",
                hasPhone
                  ? "text-green-500 hover:text-green-400 hover:bg-green-500/10"
                  : "text-gray-600 cursor-not-allowed"
              )}
            >
              <FaWhatsapp size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

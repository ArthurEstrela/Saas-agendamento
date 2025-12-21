// src/components/ServiceProvider/Agenda/ScheduledAppointmentCard.tsx
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock, 
  User, 
  MoreVertical, 
  Calendar as CalendarIcon,
  CheckCircle2
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { Appointment } from "../../../types";
import { cn } from "../../../lib/utils/cn";

interface ScheduledAppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export const ScheduledAppointmentCard = ({ 
  appointment, 
  onClick 
}: ScheduledAppointmentCardProps) => {
  
  // --- Lógica do WhatsApp ---
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que abra o modal de detalhes ao clicar no Zap

    const phone = appointment.clientPhone || "";
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone) return;

    const time = format(new Date(appointment.startTime), "HH:mm");
    const date = format(new Date(appointment.startTime), "dd/MM");
    
    // Mensagem inteligente: "Olá [Nome], confirmando seu horário dia [Data] às [Hora]..."
    const message = `Olá ${appointment.clientName}, passando para confirmar seu horário dia ${date} às ${time}. Tudo certo?`;
    
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const hasPhone = !!appointment.clientPhone;

  return (
    <div 
      onClick={onClick}
      className="group bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Indicador lateral de status */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        appointment.status === 'scheduled' ? "bg-blue-500" : "bg-gray-500"
      )} />

      <div className="flex justify-between items-start pl-3">
        {/* Informações Principais */}
        <div className="flex flex-col gap-1">
          <h3 className="text-white font-bold text-lg leading-tight group-hover:text-blue-400 transition-colors">
            {appointment.clientName}
          </h3>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
            {appointment.serviceName}
          </p>
        </div>

        {/* Horário (Destaque) */}
        <div className="bg-gray-800 p-2 rounded-lg text-center min-w-[60px] border border-gray-700">
          <span className="block text-xl font-bold text-white">
            {format(new Date(appointment.startTime), "HH:mm")}
          </span>
          <span className="block text-[10px] text-gray-400 uppercase font-bold">
            {format(new Date(appointment.startTime), "EEE", { locale: ptBR })}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800/50 flex items-center justify-between pl-3">
        {/* Info do Profissional (se houver múltiplos) */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
           <User size={14} />
           <span className="truncate max-w-[120px]">
             {appointment.professionalName}
           </span>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
            {/* Botão WhatsApp */}
            <button
                onClick={handleWhatsAppClick}
                disabled={!hasPhone}
                className={cn(
                    "p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold",
                    hasPhone 
                        ? "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/20" 
                        : "bg-gray-800 text-gray-600 cursor-not-allowed"
                )}
                title={hasPhone ? "Confirmar no WhatsApp" : "Telefone não cadastrado"}
            >
                <FaWhatsapp size={16} />
                <span className="hidden sm:inline">Confirmar</span>
            </button>
        </div>
      </div>
    </div>
  );
};
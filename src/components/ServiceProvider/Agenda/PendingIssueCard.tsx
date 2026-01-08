import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  User,
  Scissors,
  MessageCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

// Primitivos
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";

interface CardProps {
  appointment: EnrichedProviderAppointment;
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const PendingIssueCard = ({
  appointment,
  onAppointmentSelect,
}: CardProps) => {
  const { client, startTime, services } = appointment;

  const timeAgo = formatDistanceToNow(appointment.endTime, {
    addSuffix: true,
    locale: ptBR,
  });

  const handleCardClick = () => {
    onAppointmentSelect(appointment);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client?.phoneNumber) return;

    const cleanPhone = client.phoneNumber.replace(/\D/g, "");
    const dateString = format(startTime, "dd/MM", { locale: ptBR });
    const timeString = format(startTime, "HH:mm");
    const message = `Olá ${client.name}, sobre nosso agendamento de ${dateString} às ${timeString}. Tudo certo por aí?`;

    window.open(
      `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const MotionCard = motion(Card);

  return (
    <MotionCard
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="bg-gray-900/40 border-yellow-600/20 active:border-yellow-500/50 backdrop-blur-sm cursor-pointer group transition-all duration-300 relative overflow-hidden rounded-xl"
    >
      {/* Indicador lateral pulsante */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500/80" />

      <CardContent className="p-4">
        {/* Header Compacto */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/10 p-2 rounded-full animate-pulse">
              <AlertTriangle className="text-yellow-500" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-yellow-100">Pendente</h3>
              <p className="text-[10px] text-yellow-500/80 font-mono flex items-center gap-1">
                <Clock size={10} />
                {timeAgo}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="font-bold text-lg text-primary block leading-none">
              R$ {appointment.totalPrice.toFixed(0)}
            </span>
            <span className="text-[10px] text-gray-500 uppercase">Total</span>
          </div>
        </div>

        {/* Info Grid - Mais espaçado no mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/20 p-3 rounded-lg border border-gray-800/50 mb-4">
          {/* Cliente */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="bg-gray-800 p-1.5 rounded-full shrink-0">
              <User size={14} className="text-gray-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 font-bold uppercase">
                Cliente
              </span>
              <span className="text-sm font-medium text-gray-200 truncate">
                {client?.name || "Cliente"}
              </span>
            </div>
          </div>

          {/* Data */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="bg-gray-800 p-1.5 rounded-full shrink-0">
              <Calendar size={14} className="text-gray-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 font-bold uppercase">
                Data
              </span>
              <span className="text-sm font-medium text-gray-200 truncate">
                {format(startTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Serviço (Full width no mobile) */}
          <div className="col-span-1 sm:col-span-2 flex items-center gap-2.5 overflow-hidden border-t border-gray-800/50 pt-2 sm:border-0 sm:pt-0">
            <div className="bg-gray-800 p-1.5 rounded-full shrink-0">
              <Scissors size={14} className="text-gray-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 font-bold uppercase">
                Serviços
              </span>
              <span className="text-xs text-gray-300 truncate leading-tight">
                {services.map((s) => s.name).join(", ")}
              </span>
            </div>
          </div>
        </div>

        {/* Ações - Botões Grandes para Mobile */}
        <div className="flex gap-3">
          {client?.phoneNumber && (
            <Button
              variant="outline"
              className="flex-1 border-green-900/40 text-green-500 hover:bg-green-900/20 hover:text-green-400 h-10"
              onClick={handleWhatsAppClick}
            >
              <MessageCircle size={18} />
            </Button>
          )}

          <Button
            className="flex-[3] bg-yellow-600 hover:bg-yellow-500 text-white font-bold h-10 shadow-lg shadow-yellow-900/20"
            onClick={(e) => {
              e.stopPropagation();
              onAppointmentSelect(appointment);
            }}
          >
            Resolver Pendência <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </MotionCard>
  );
};

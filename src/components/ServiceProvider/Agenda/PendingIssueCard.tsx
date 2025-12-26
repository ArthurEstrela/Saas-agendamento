import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  User,
  Scissors,
  DollarSign,
  MessageCircle,
  CheckCircle,
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 border-yellow-600/50 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)] transition-all duration-300"
    >
      <CardContent className="p-4 sm:p-5">
        {/* Header com Alerta */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-yellow-600/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-full">
              <AlertTriangle className="text-yellow-500" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-yellow-500 leading-none mb-1">
                Pendente de Conclusão
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Finalizado {timeAgo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {client?.phoneNumber && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none border-green-600/30 text-green-500 hover:bg-green-500/10 hover:border-green-500"
                onClick={handleWhatsAppClick}
                title="Entrar em contato"
              >
                <MessageCircle size={18} className="mr-2" />
                <span className="sm:hidden lg:inline">WhatsApp</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => onAppointmentSelect(appointment)}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg shadow-green-900/20"
            >
              <CheckCircle size={18} className="mr-2" />
              Concluir
            </Button>
          </div>
        </div>

        {/* Grid de Detalhes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-gray-800/50">
            <Calendar size={18} className="text-gray-500" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-bold">
                Data e Hora
              </span>
              <span className="text-sm text-gray-200 font-medium">
                {format(startTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-gray-800/50">
            <User size={18} className="text-gray-500" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-bold">
                Cliente
              </span>
              <span className="text-sm text-gray-200 font-medium truncate">
                {client?.name || "Não identificado"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-gray-800/50">
            <Scissors size={18} className="text-gray-500" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-gray-500 uppercase font-bold">
                Serviço
              </span>
              <span className="text-sm text-gray-200 font-medium truncate">
                {services.map((s) => s.name).join(", ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-gray-800/50">
            <DollarSign size={18} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-bold">
                Valor Total
              </span>
              <span className="text-sm font-bold text-primary">
                R$ {appointment.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </MotionCard>
  );
};

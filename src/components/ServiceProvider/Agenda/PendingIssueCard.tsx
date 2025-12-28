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
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils/cn";

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
    e.stopPropagation(); // Evita abrir o modal ao clicar no WhatsApp
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
      whileTap={{ scale: 0.99 }}
      onClick={handleCardClick}
      className="bg-gray-900/50 border-yellow-600/30 hover:border-yellow-500/50 hover:bg-gray-900/80 cursor-pointer group transition-all duration-300 relative overflow-hidden"
    >
      {/* Efeito de brilho lateral no hover */}
      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-600/50 group-hover:bg-yellow-500 transition-colors" />

      <CardContent className="p-4 sm:p-5">
        {/* Header com Alerta e Ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 rounded-full shrink-0">
              <AlertTriangle
                className="text-yellow-500 animate-pulse"
                size={20}
              />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-yellow-500 leading-tight">
                Pendente de Conclusão
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                Finalizado <span className="text-gray-300">{timeAgo}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
            {client?.phoneNumber && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none border-green-600/30 text-green-500 hover:bg-green-500/10 hover:border-green-500 hover:text-green-400 h-9"
                onClick={handleWhatsAppClick}
                title="Contato via WhatsApp"
              >
                <MessageCircle size={16} className="mr-2" />
                <span className="text-xs font-bold">WhatsApp</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="flex-1 sm:flex-none bg-yellow-600/10 text-yellow-500 hover:bg-yellow-600 hover:text-white h-9 transition-colors"
            >
              <span className="text-xs font-bold mr-2">Resolver</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        {/* Grid de Detalhes - Otimizado para Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {/* Data */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-gray-800/30">
            <Calendar size={16} className="text-gray-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                Data
              </span>
              <span className="text-xs sm:text-sm text-gray-200 font-medium truncate">
                {format(startTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Cliente */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-gray-800/30">
            <User size={16} className="text-gray-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                Cliente
              </span>
              <span className="text-xs sm:text-sm text-gray-200 font-medium truncate">
                {client?.name || "Anônimo"}
              </span>
            </div>
          </div>

          {/* Serviço */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-gray-800/30 col-span-2 sm:col-span-1">
            <Scissors size={16} className="text-gray-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                Serviço
              </span>
              <span className="text-xs sm:text-sm text-gray-200 font-medium truncate">
                {services.map((s) => s.name).join(", ")}
              </span>
            </div>
          </div>

          {/* Valor */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-gray-800/30 col-span-2 sm:col-span-1">
            <DollarSign size={16} className="text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                Valor Total
              </span>
              <span className="text-xs sm:text-sm font-bold text-primary truncate">
                R$ {appointment.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </MotionCard>
  );
};

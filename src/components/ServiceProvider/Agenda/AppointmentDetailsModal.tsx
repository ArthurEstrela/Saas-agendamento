// src/components/ServiceProvider/Agenda/AppointmentDetailsModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  XCircle,
  Phone,
  Copy,
  Lock,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "react-hot-toast";
import type { Appointment, ClientProfile } from "../../../types";
import { cn } from "../../../lib/utils/cn";

// UI Components
import { Button } from "../../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Card } from "../../ui/card";

interface EnrichedAppointment extends Appointment {
  client?: ClientProfile;
}

interface AppointmentDetailsModalProps {
  appointment: EnrichedAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: Appointment["status"]) => void;
  onComplete: (appointment: Appointment) => void;
}

export const AppointmentDetailsModal = ({
  appointment,
  isOpen,
  onClose,
  onStatusChange,
  onComplete,
}: AppointmentDetailsModalProps) => {
  if (!appointment) return null;

  const statusVariantMap = {
    pending: "warning",
    scheduled: "default",
    completed: "success",
    cancelled: "destructive",
  } as const;

  const statusLabels = {
    pending: "Pendente",
    scheduled: "Agendado",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  const rawPhone =
    appointment.clientPhone || appointment.client?.phoneNumber || "";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const hasPhone = !!cleanPhone;
  const clientPhotoUrl = appointment.client?.profilePictureUrl;

  const now = new Date();
  const endTime = new Date(appointment.endTime);
  const isTooEarlyToComplete = now < endTime;

  const handleWhatsApp = () => {
    if (!hasPhone) return toast.error("Telefone indisponível");
    const time = format(new Date(appointment.startTime), "HH:mm");
    const date = format(new Date(appointment.startTime), "dd/MM");
    const message = `Olá ${appointment.clientName}, gostaria de confirmar nosso agendamento para ${date} às ${time}.`;
    window.open(
      `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleCopyPhone = () => {
    if (hasPhone) {
      navigator.clipboard.writeText(rawPhone);
      toast.success("Copiado!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95%] sm:max-w-md bg-gray-950 border-gray-800 p-0 overflow-hidden gap-0 rounded-xl">
        {/* Header Fixo */}
        <DialogHeader className="p-5 pb-4 bg-gray-900 border-b border-gray-800">
          <div className="flex justify-between items-start">
            <div className="space-y-1 text-left">
              <DialogTitle className="text-lg font-bold text-white">
                Detalhes do Agendamento
              </DialogTitle>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                ID: {appointment.id.slice(-6)}
              </p>
            </div>
            <Badge
              variant={statusVariantMap[appointment.status]}
              className="uppercase text-[10px] tracking-wide px-2 h-6"
            >
              {statusLabels[appointment.status]}
            </Badge>
          </div>
        </DialogHeader>

        {/* Conteúdo com Scroll para telas pequenas */}
        <div className="p-5 space-y-5 max-h-[60vh] sm:max-h-none overflow-y-auto custom-scrollbar">
          {/* Card do Cliente */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-900/50 border-gray-800 p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border border-gray-700 shadow-md">
                <AvatarImage src={clientPhotoUrl} className="object-cover" />
                <AvatarFallback className="bg-gray-800 text-primary font-bold">
                  {appointment.clientName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-white truncate">
                  {appointment.clientName}
                </p>
                {hasPhone ? (
                  <button
                    onClick={handleCopyPhone}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors group mt-0.5"
                  >
                    <Phone size={12} />
                    {rawPhone}
                    <Copy
                      size={10}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                ) : (
                  <span className="text-xs text-gray-600 italic">
                    Sem contato
                  </span>
                )}
              </div>
            </div>

            {hasPhone && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-green-900/30 bg-green-900/10 text-green-500 hover:bg-green-900/20 hover:text-green-400 hover:border-green-800 gap-2 h-9 text-xs uppercase tracking-wide font-bold"
                onClick={handleWhatsApp}
              >
                <FaWhatsapp size={16} /> Enviar mensagem
              </Button>
            )}
          </Card>

          {/* Info Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/50 space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5">
                  <Calendar size={10} /> Data
                </span>
                <p className="text-sm font-medium text-gray-200">
                  {format(new Date(appointment.startTime), "dd/MM")}
                </p>
              </div>
              <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/50 space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5">
                  <Clock size={10} /> Horário
                </span>
                <p className="text-sm font-medium text-gray-200">
                  {format(new Date(appointment.startTime), "HH:mm")}
                </p>
              </div>
            </div>

            <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/50 space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5">
                  <Scissors size={10} /> Serviço
                </span>
                <p className="text-sm font-medium text-gray-200 leading-tight">
                  {appointment.serviceName}
                </p>
              </div>

              <div className="h-px bg-gray-800/50" />

              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5">
                    <User size={10} /> Profissional
                  </span>
                  <p className="text-xs text-gray-300">
                    {appointment.professionalName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary flex items-baseline">
                    <span className="text-xs text-gray-500 font-normal mr-1">
                      R$
                    </span>
                    {appointment.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Garantindo visibilidade no mobile */}
        <DialogFooter className="p-4 bg-gray-900 border-t border-gray-800 flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-2">
          {appointment.status === "scheduled" ? (
            <div className="flex flex-col-reverse w-full sm:flex-row gap-3">
              <Button
                variant="destructive"
                onClick={() => onStatusChange(appointment.id, "cancelled")}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 h-10"
              >
                <XCircle size={18} className="mr-2" /> Cancelar
              </Button>
              <Button
                onClick={() => onComplete(appointment)}
                disabled={isTooEarlyToComplete}
                className={cn(
                  "flex-1 font-bold h-10",
                  isTooEarlyToComplete
                    ? "opacity-50 cursor-not-allowed bg-gray-800 text-gray-400"
                    : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
                )}
              >
                {isTooEarlyToComplete ? (
                  <Lock size={18} className="mr-2" />
                ) : (
                  <CheckCircle2 size={18} className="mr-2" />
                )}
                Concluir
              </Button>
            </div>
          ) : appointment.status === "pending" ? (
            <div className="flex w-full gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1 h-10">
                Fechar
              </Button>
              <Button
                onClick={() => onStatusChange(appointment.id, "scheduled")}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white h-10 shadow-lg shadow-blue-900/20"
              >
                Aprovar Agendamento
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={onClose}
              className="w-full h-10"
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
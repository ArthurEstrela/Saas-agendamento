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
  DollarSign,
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
    scheduled: "default", // ou primary
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
      <DialogContent className="sm:max-w-md bg-gray-950 border-gray-800 p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 bg-gray-900 border-b border-gray-800">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-white">
                Detalhes
              </DialogTitle>
              <p className="text-xs text-gray-500 font-mono">
                #{appointment.id.slice(-6).toUpperCase()}
              </p>
            </div>
            <Badge
              variant={statusVariantMap[appointment.status] as any}
              className="uppercase tracking-wide"
            >
              {statusLabels[appointment.status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Card do Cliente */}
          <Card className="bg-gray-900/50 border-gray-800 p-4 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-gray-700">
                <AvatarImage src={clientPhotoUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">
                  {appointment.clientName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-white truncate">
                  {appointment.clientName}
                </p>
                {hasPhone ? (
                  <button
                    onClick={handleCopyPhone}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors group"
                  >
                    <Phone size={14} />
                    {rawPhone}
                    <Copy
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 italic">
                    Sem contato
                  </span>
                )}
              </div>
            </div>

            {hasPhone && (
              <Button
                variant="outline"
                className="w-full border-green-600/30 text-green-500 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500 gap-2 h-10"
                onClick={handleWhatsApp}
              >
                <FaWhatsapp size={18} /> Chamar no WhatsApp
              </Button>
            )}
          </Card>

          {/* Detalhes do Serviço */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                  <Calendar size={12} /> Data
                </span>
                <p className="text-sm font-medium text-gray-200">
                  {format(new Date(appointment.startTime), "dd 'de' MMMM")}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                  <Clock size={12} /> Horário
                </span>
                <p className="text-sm font-medium text-gray-200">
                  {format(new Date(appointment.startTime), "HH:mm")} -{" "}
                  {format(new Date(appointment.endTime), "HH:mm")}
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-800" />

            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                  <Scissors size={12} /> Serviço
                </span>
                <p className="text-sm font-medium text-gray-200">
                  {appointment.serviceName}
                </p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-xs text-gray-500 uppercase font-bold flex items-center justify-end gap-1">
                  <User size={12} /> Profissional
                </span>
                <p className="text-sm font-medium text-gray-200">
                  {appointment.professionalName}
                </p>
              </div>
            </div>

            <div className="bg-black/40 p-3 rounded-lg flex justify-between items-center border border-gray-800 mt-2">
              <span className="text-gray-400 text-sm font-medium flex items-center gap-2">
                <DollarSign size={16} /> Total
              </span>
              <span className="text-lg font-bold text-primary">
                R$ {appointment.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-gray-900 border-t border-gray-800 sm:justify-between gap-3">
          {appointment.status === "scheduled" ? (
            <>
              <Button
                variant="destructive"
                onClick={() => onStatusChange(appointment.id, "cancelled")}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
              >
                <XCircle size={18} className="mr-2" /> Cancelar
              </Button>
              <Button
                onClick={() => onComplete(appointment)}
                disabled={isTooEarlyToComplete}
                className={cn(
                  "flex-1 font-bold",
                  isTooEarlyToComplete
                    ? "opacity-70 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 text-white"
                )}
              >
                {isTooEarlyToComplete ? (
                  <Lock size={18} className="mr-2" />
                ) : (
                  <CheckCircle2 size={18} className="mr-2" />
                )}
                Concluir
              </Button>
            </>
          ) : appointment.status === "pending" ? (
            <div className="flex w-full gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Fechar
              </Button>
              <Button
                onClick={() => onStatusChange(appointment.id, "scheduled")}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white"
              >
                Confirmar
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={onClose} className="w-full">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

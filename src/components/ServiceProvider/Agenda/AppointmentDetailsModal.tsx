// src/components/ServiceProvider/Agenda/AppointmentDetailsModal.tsx

import React from "react";
import type { Appointment } from "../../../types";
import {
  X,
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle, // ****** ADICIONADO ******
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button"; // ****** ADICIONADO ******

// ****** INTERFACE DE PROPS ATUALIZADA ******
interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onOpenCompletion: () => void;
  onOpenCancel: () => void;
  onAccept: () => void; // <-- NOVO
  onDecline: () => void; // <-- NOVO
}
// *******************************************

export const AppointmentDetailsModal: React.FC<
  AppointmentDetailsModalProps
> = ({
  isOpen,
  onClose,
  appointment,
  onOpenCompletion,
  onOpenCancel,
  onAccept, // <-- NOVO
  onDecline, // <-- NOVO
}) => {
  if (!appointment) {
    return null;
  }

  const {
    client,
    services,
    startTime,
    endTime,
    professionalName,
    totalPrice,
    status,
  } = appointment; // Lógica de UI

  const hasEnded = new Date(endTime) < new Date();
  const isScheduled = status === "scheduled";
  const isPending = status === "pending"; // <-- NOVO // ****** FUNÇÃO PARA RENDERIZAR O BADGE DE STATUS (UX) ******

  const renderStatusBadge = () => {
    switch (status) {
      case "pending":
        return (
          <div className="flex items-center gap-2 text-amber-400">
            <Clock size={16} />
            <span className="font-semibold">Aguardando Confirmação</span>
          </div>
        );
      case "scheduled":
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={16} />
            <span className="font-semibold">Confirmado</span>
          </div>
        );
      case "cancelled":
        return (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle size={16} />
            <span className="font-semibold">Cancelado</span>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <CheckCircle size={16} />
            <span className="font-semibold">Concluído</span>
          </div>
        );
      default:
        return null;
    }
  }; // *************************************************************
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg text-white shadow-xl p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-800 space-y-0">
          <DialogTitle className="text-xl font-bold text-white">
            Detalhes do Agendamento
          </DialogTitle>
          <DialogClose asChild>
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
              <X size={20} />
            </button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* ****** BADGE DE STATUS ADICIONADO ****** */}
          <div className="pb-4 mb-4 border-b border-gray-800">
            {renderStatusBadge()}
          </div>
          {/* **************************************** */}
          <div className="flex items-center gap-3">
            <Calendar className="text-amber-500" />
            <span className="font-semibold">
              {format(startTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="text-amber-500" />
            <span className="font-semibold">{`${format(
              startTime,
              "HH:mm"
            )} - ${format(endTime, "HH:mm")}`}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="text-amber-500" />
            <span className="font-semibold">{client?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Scissors className="text-amber-500" />
            <span className="font-semibold">{professionalName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="text-amber-500" />
            <a href={`tel:${client?.phone}`} className="hover:underline">
              {client?.phone}
            </a>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-800">
            <p className="font-bold mb-2">Serviços:</p>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-gray-400">R$ {s.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-800">
            <p className="text-lg font-bold">Total:</p>
            <p className="text-2xl font-bold text-amber-500">
              R$ {totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
        {/* ****** FOOTER COM LÓGICA CONDICIONAL ATUALIZADA ****** */}
        <DialogFooter className="p-4 bg-gray-800/50 flex flex-row sm:justify-between gap-3">
          <DialogClose asChild>
            <Button variant="outline" className="order-last sm:order-first">
              Fechar
            </Button>
          </DialogClose>
          <div className="flex-1 flex sm:flex-none gap-3">
            {/* 1. Ações para PENDENTES */}
            {isPending && (
              <>
                <Button
                  variant="destructive"
                  onClick={onDecline}
                  className="flex-1"
                >
                  <XCircle size={18} className="mr-2" />
                  Recusar
                </Button>
                <Button
                  onClick={onAccept}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Aceitar{" "}
                </Button>
              </>
            )}
            {/* 2. Ações para AGENDADOS (scheduled) */}
            {isScheduled && (
              <>
                <Button
                  variant="outline"
                  onClick={onOpenCancel}
                  className="flex-1"
                >
                  <XCircle size={18} className="mr-2" />
                  Cancelar
                </Button>
                {hasEnded && (
                  <Button
                    onClick={onOpenCompletion}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle size={18} className="mr-2" />
                    Concluir
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
        {/* ******************************************************* */}
      </DialogContent>
    </Dialog>
  );
};

import React from "react";
import type { Appointment } from "../../../types"; // Importando o tipo

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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";

// 1. A interface de Props foi TOTALMENTE MUDADA
// Agora ela recebe os handlers e o estado do componente PAI (AgendaView)
interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onOpenCompletion: () => void; // Handler para abrir o modal de conclusão
  onOpenCancel: () => void; // Handler para abrir o modal de cancelamento
}

// 2. Removemos (quase) toda a lógica interna
export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onOpenCompletion,
  onOpenCancel,
}) => {
  // 3. Removemos o 'useProviderAppointmentsStore' e 'useState'
  // O componente agora depende 100% das props

  if (!appointment) {
    return null;
  }

  // 4. Desestruturamos o agendamento recebido via prop
  const {
    client,
    services,
    startTime,
    endTime,
    professionalName,
    totalPrice,
    status,
  } = appointment;

  // 5. Lógica de UI: Verificamos o estado para exibir os botões corretos
  const hasEnded = new Date(endTime) < new Date();
  const isScheduled = status === "scheduled";
  // Agendamentos 'pending', 'completed' ou 'cancelled' não são 'scheduled',
  // então os botões de ação não aparecerão para eles (o que está correto).

  return (
    // 6. Usamos o Dialog do shadcn que o AgendaView está controlando
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg text-white shadow-xl p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Mantendo seu design) */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-800 space-y-0">
          <DialogTitle className="text-xl font-bold text-white">
            Detalhes do Agendamento
          </DialogTitle>
          <DialogClose asChild>
            <button
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Body (Seu JSX de detalhes, 100% mantido) */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
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
                  <span className="text-gray-400">
                    R$ {s.price.toFixed(2)}
                  </span>
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

        {/* Footer - Ações (Lógica 100% atualizada) */}
        <DialogFooter className="p-4 bg-gray-800/50 flex flex-row sm:justify-between gap-3">
          {/* Botão de Fechar padrão */}
          <DialogClose asChild>
            <button className="flex-1 sm:flex-none order-last sm:order-first bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
              Fechar
            </button>
          </DialogClose>

          {/* Botões de Ação Condicionais */}
          <div className="flex-1 flex sm:flex-none gap-3">
            {/* 7. Botão Cancelar (SÓ se estiver 'scheduled') */}
            {isScheduled && (
              <button
                onClick={onOpenCancel} // <--- CHAMA O HANDLER DO PAI
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                Cancelar
              </button>
            )}

            {/* 8. Botão Concluir (SÓ se 'scheduled' E já passou da hora) */}
            {isScheduled && hasEnded && (
              <button
                onClick={onOpenCompletion} // <--- CHAMA O HANDLER DO PAI
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Concluir Serviço
              </button>
            )}
          </div>
        </DialogFooter>
        
        {/* 9. Removemos o <CancelAppointmentModal> de dentro deste arquivo */}
      </DialogContent>
    </Dialog>
  );
};
// src/components/ServiceProvider/Agenda/AppointmentDetailsModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
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
  Copy
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "react-hot-toast";
import type { Appointment } from "../../../types";
import { cn } from "../../../lib/utils/cn";

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: Appointment['status']) => void;
  onComplete: (appointment: Appointment) => void;
}

export const AppointmentDetailsModal = ({
  appointment,
  isOpen,
  onClose,
  onStatusChange,
  onComplete
}: AppointmentDetailsModalProps) => {
  if (!appointment) return null;

  const statusColors = {
    pending: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    scheduled: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    completed: "text-green-500 bg-green-500/10 border-green-500/20",
    cancelled: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  const statusLabels = {
    pending: "Pendente",
    scheduled: "Agendado",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  // --- Lógica do WhatsApp e Telefone ---
  const phone = appointment.clientPhone || "";
  const cleanPhone = phone.replace(/\D/g, "");
  const hasPhone = !!cleanPhone;

  const handleWhatsApp = () => {
    if (!hasPhone) {
        toast.error("Telefone do cliente não disponível");
        return;
    }

    const time = format(new Date(appointment.startTime), "HH:mm");
    const date = format(new Date(appointment.startTime), "dd/MM");
    
    const message = `Olá ${appointment.clientName}, tudo bem? Gostaria de confirmar nosso agendamento para ${date} às ${time}.`;
    
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleCopyPhone = () => {
    if (hasPhone) {
        navigator.clipboard.writeText(phone);
        toast.success("Telefone copiado!");
    }
  };
  // -------------------------------------

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md w-full p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-gray-800/50 border-b border-gray-800">
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl font-bold text-white">
              Detalhes do Agendamento
            </DialogTitle>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide",
              statusColors[appointment.status]
            )}>
              {statusLabels[appointment.status]}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">ID: #{appointment.id.slice(-6)}</p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          
          {/* Cliente & Contato (NOVO) */}
          <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cliente</h3>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {appointment.clientName.charAt(0)}
                </div>
                <div>
                    <p className="font-bold text-white text-lg">{appointment.clientName}</p>
                    <div className="flex items-center gap-2 mt-1">
                        {hasPhone ? (
                            <button 
                                onClick={handleCopyPhone}
                                className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors group"
                                title="Copiar telefone"
                            >
                                <Phone size={14} />
                                {phone}
                                <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ) : (
                            <span className="text-sm text-gray-500 italic">Sem telefone cadastrado</span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Botão de Ação WhatsApp (Grande) */}
            {hasPhone && (
                <button
                    onClick={handleWhatsApp}
                    className="w-full mt-4 bg-[#25D366] hover:bg-[#128C7E] text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20 active:scale-95"
                >
                    <FaWhatsapp size={20} />
                    Chamar no WhatsApp
                </button>
            )}
          </div>

          {/* Detalhes do Serviço */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-[#daa520]">
                <Scissors size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Serviço</p>
                <p className="font-medium">{appointment.serviceName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-blue-400">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Profissional</p>
                <p className="font-medium">{appointment.professionalName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-purple-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Data</p>
                  <p className="font-medium">
                    {format(new Date(appointment.startTime), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-pink-400">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Horário</p>
                  <p className="font-medium">
                    {format(new Date(appointment.startTime), "HH:mm")} - {format(new Date(appointment.endTime), "HH:mm")}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-xl flex justify-between items-center border border-gray-800">
                <span className="text-gray-400 font-medium flex items-center gap-2">
                    <DollarSign size={18} /> Valor Total
                </span>
                <span className="text-xl font-bold text-[#daa520]">
                    R$ {appointment.totalPrice.toFixed(2)}
                </span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-gray-800/50 border-t border-gray-800 flex flex-col sm:flex-row gap-3">
          {appointment.status === 'scheduled' && (
            <>
              <button
                onClick={() => onStatusChange(appointment.id, 'cancelled')}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                Cancelar
              </button>
              
              <button
                onClick={() => onComplete(appointment)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                Concluir Atendimento
              </button>
            </>
          )}

          {appointment.status === 'pending' && (
             <button
                onClick={() => onStatusChange(appointment.id, 'scheduled')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition-colors"
             >
                Confirmar Agendamento
             </button>
          )}
          
          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
            <button
                onClick={onClose}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-medium"
            >
                Fechar
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
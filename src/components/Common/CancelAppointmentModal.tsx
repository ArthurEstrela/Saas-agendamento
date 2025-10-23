// src/components/Common/CancelAppointmentModal.tsx

import { useState, useEffect } from "react"; // ****** useEffect ADICIONADO ******
import { motion } from "framer-motion";
import { X, AlertTriangle, Send, Loader2 } from "lucide-react";
// ****** Importações de UI (opcional, mas recomendado) ******
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

// ****** INTERFACE ATUALIZADA ******
interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  userType: "client" | "serviceProvider"; // 'provider' -> 'serviceProvider' para consistência
  intent?: "cancel" | "decline"; // <-- NOVA PROP
  appointmentId: string; // <-- Adicionado para garantir reset do estado
}
// **********************************

export const CancelAppointmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  userType,
  intent = "cancel", // <-- Valor padrão
  appointmentId,
}: CancelAppointmentModalProps) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(""); // ****** LÓGICA DE TEXTO DINÂMICO ******

  const isProvider = userType === "serviceProvider";
  const isDecline = intent === "decline";

  const title = isDecline ? "Confirmar Recusa" : "Confirmar Cancelamento";
  const confirmButtonText = isDecline ? "Recusar" : "Cancelar";

  const description = isProvider
    ? `Por favor, informe ao cliente o motivo da ${
        isDecline ? "recusa" : "cancelamento"
      } (obrigatório).`
    : "Você tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.";

  const placeholder = isProvider
    ? `Motivo da ${isDecline ? "recusa" : "cancelamento"} (obrigatório)`
    : "Motivo do cancelamento (opcional)"; // **************************************** // ****** RESETAR O ESTADO ****** // Reseta o formulário sempre que o modal for aberto para um novo agendamento
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen, appointmentId]); // ******************************
  const handleConfirm = () => {
    // A validação de motivo é mais forte para o provider
    if (isProvider && reason.trim().length < 10) {
      setError("Por favor, forneça um motivo de pelo menos 10 caracteres.");
      return;
    }
    setError("");
    onConfirm(reason);
  }; // Usando o componente Dialog de shadcn para consistência com os outros modais

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md text-white shadow-xl p-0">
        <DialogHeader className="p-4 border-b border-gray-800">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-red-400" />
            {title} {/* <-- Texto dinâmico */}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <p className="text-gray-400 mb-4 text-sm">
            {description} {/* <-- Texto dinâmico */}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder} /* <-- Texto dinâmico */
            className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-none"
          />
          
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
        
        <DialogFooter className="p-4 bg-gray-800/50 flex flex-row sm:justify-end gap-3">
          
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Voltar 
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center justify-center gap-2"
          >
            
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                 <Send size={16} />
                {confirmButtonText} {/* <-- Texto dinâmico */}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

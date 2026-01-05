import { useState, useEffect } from "react";
import { AlertTriangle, Send, Loader2 } from "lucide-react";

// UI Components
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  userType: "client" | "serviceProvider";
  intent?: "cancel" | "decline";
  appointmentId: string;
}

export const CancelAppointmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  userType,
  intent = "cancel",
  appointmentId,
}: CancelAppointmentModalProps) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const isProvider = userType === "serviceProvider";
  const isDecline = intent === "decline";

  const title = isDecline ? "Confirmar Recusa" : "Confirmar Cancelamento";
  const confirmButtonText = isDecline
    ? "Recusar Agendamento"
    : "Confirmar Cancelamento";

  const description = isProvider
    ? `Informe ao cliente o motivo da ${
        isDecline ? "recusa" : "cancelamento"
      } (obrigatório).`
    : "Você tem certeza que deseja cancelar? Essa ação não pode ser desfeita.";

  const placeholder = isProvider
    ? `Descreva o motivo... (Mínimo 10 caracteres)`
    : "Gostaria de nos dizer o motivo? (Opcional)";

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen, appointmentId]);

  const handleConfirm = () => {
    const trimmedReason = reason.trim();

    // Validação apenas para prestadores
    if (isProvider && trimmedReason.length < 10) {
      setError(
        "Por favor, detalhe um pouco mais o motivo (mín. 10 caracteres)."
      );
      return;
    }

    setError("");
    // Envia o texto "limpo" (sem espaços extras nas pontas) ou undefined se vazio
    onConfirm(trimmedReason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle size={20} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Textarea
            autoFocus // [!code highlight] UX: Foco automático ao abrir
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            placeholder={placeholder}
            className="min-h-[120px] bg-gray-800 border-gray-700 focus-visible:ring-red-500 resize-none"
          />

          {/* [!code highlight] UX: Contador de caracteres apenas para quem tem obrigação */}
          {isProvider && (
            <div
              className={`text-xs text-right ${
                reason.trim().length < 10 ? "text-gray-500" : "text-green-500"
              }`}
            >
              {reason.trim().length}/10 caracteres
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 font-medium bg-red-500/10 p-2 rounded border border-red-500/20 animate-fade-in-down">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Voltar
          </Button>

          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

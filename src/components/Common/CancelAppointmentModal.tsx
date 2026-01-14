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
import { cn } from "../../lib/utils/cn"; // Certifique-se de importar o cn

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
    onConfirm(trimmedReason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* OTIMIZAÇÃO MOBILE:
          - w-[95%]: Ocupa quase toda a largura em telas pequenas
          - rounded-2xl: Visual mais moderno e amigável
          - bg-[#18181b]: Fundo sólido para performance e contraste com teclado
          - top-[20%]: Posiciona o modal mais acima para o teclado não cobrir o input
      */}
      <DialogContent className="w-[95%] max-w-md rounded-2xl bg-[#18181b] border-gray-800 shadow-2xl p-5 md:p-6 top-[30%] md:top-[50%] translate-y-[-30%] md:translate-y-[-50%]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-red-500 text-lg md:text-xl">
            <AlertTriangle size={22} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm md:text-base leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <Textarea
            // autoFocus removido no mobile pode ser melhor para UX (não abrir teclado na cara), 
            // mas mantive pois é padrão de modal de ação rápida.
            autoFocus 
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            placeholder={placeholder}
            // text-base impede zoom no iOS
            className="min-h-[120px] bg-[#09090b] border-gray-700 text-gray-100 focus-visible:ring-red-500 resize-none text-base rounded-xl p-3"
          />

          <div className="flex justify-between items-start">
             {/* Espaço para erro */}
             <div className="flex-1 mr-2">
                {error && (
                  <p className="text-xs text-red-400 font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                    {error}
                  </p>
                )}
             </div>

             {/* Contador */}
             {isProvider && (
              <div
                className={cn(
                  "text-xs text-right mt-1 shrink-0 font-medium",
                  reason.trim().length < 10 ? "text-gray-500" : "text-green-500"
                )}
              >
                {reason.trim().length}/10
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={isLoading}
            className="w-full sm:w-auto h-12 sm:h-10 text-gray-400 hover:text-white rounded-xl touch-manipulation"
          >
            Voltar
          </Button>

          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 h-12 sm:h-10 rounded-xl font-bold shadow-lg shadow-red-900/20 touch-manipulation active:scale-[0.98] transition-transform"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : (
              <Send size={18} className="mr-2" />
            )}
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
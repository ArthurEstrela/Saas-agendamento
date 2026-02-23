import { useState, useEffect } from 'react';
import type { Appointment } from '../../types'; 
import { Star, Loader2, Calendar, Scissors } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes Primitivos
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// --- Função Utilitária para Datas Seguras ---
const normalizeDate = (dateValue: unknown): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  // Fallback para Firestore (se ainda houver cache suja)
  if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
    return (dateValue as { toDate: () => Date }).toDate();
  }
  return new Date(dateValue as string | number);
};

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment; 
  onSubmit: (rating: number, comment: string) => void;
  isLoading?: boolean;
}

// Mapa de labels para as estrelas
const RATING_LABELS: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Razoável",
  4: "Muito bom",
  5: "Excelente!"
};

const ReviewModal = ({ isOpen, onClose, appointment, onSubmit, isLoading = false }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment("");
      setHoverRating(0);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma classificação de estrelas.");
      return;
    }
    onSubmit(rating, comment);
  };

  // Nomes de variáveis flexíveis baseados na estrutura real da API Java
  const profName = (appointment as any).professionalName || appointment.professionalId || "Profissional";
  const profAvatar = (appointment as any).professionalAvatarUrl || "";
  
  // ✨ CORREÇÃO AQUI: A propriedade no tipo AppointmentItem (em types.ts) se chama apenas 'name'
  const servName = appointment.items && appointment.items.length > 0 
    ? appointment.items[0].name 
    : "Atendimento";

  // Pega a inicial para o Avatar Fallback
  const professionalInitials = profName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const startDate = normalizeDate(appointment.startTime);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader className="items-center space-y-4 pt-4">
          {/* --- Avatar e Dados do Profissional --- */}
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-lg">
              <AvatarImage src={profAvatar} alt={profName} />
              <AvatarFallback className="bg-gray-800 text-gray-400">{professionalInitials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <DialogTitle className="text-xl text-white">Avaliar Experiência</DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                com <span className="text-primary font-medium">{profName}</span>
              </p>
            </div>
          </div>

          {/* --- Contexto do Serviço (Cardzinho informativo) --- */}
          <div className="flex items-center gap-3 bg-gray-800/50 px-3 py-2 rounded-lg border border-white/5 text-xs text-gray-400 w-full justify-center">
            <span className="flex items-center gap-1.5 truncate max-w-[150px]" title={servName}>
              <Scissors size={12} className="text-primary shrink-0" />
              <span className="truncate">{servName}</span>
            </span>
            <span className="h-3 w-[1px] bg-gray-600 shrink-0" /> {/* Divisor */}
            <span className="flex items-center gap-1.5 shrink-0">
              <Calendar size={12} className="text-primary" />
              {format(startDate, "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4 space-y-6">
          {/* Estrelas */}
          <div className="flex flex-col items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                >
                  <Star
                    size={36}
                    className={`transition-colors duration-200 ${
                      (hoverRating || rating) >= star
                        ? "text-primary fill-primary drop-shadow-[0_0_8px_rgba(218,165,32,0.4)]" // Glow effect
                        : "text-gray-700 fill-gray-800"
                    }`}
                  />
                </button>
              ))}
            </div>
            {/* Feedback Dinâmico em Texto */}
            <span className="text-sm font-medium text-primary h-5 animate-in fade-in slide-in-from-bottom-1">
              {RATING_LABELS[hoverRating || rating] || "Toque para avaliar"}
            </span>
          </div>

          <div className="w-full space-y-3">
             <div className="flex justify-between items-end">
               <Label htmlFor="comment" className="text-gray-200">Deixe um comentário</Label>
               <span className="text-[10px] text-gray-500 italic">Opcional</span>
             </div>
             <Textarea
                id="comment"
                placeholder="O que você mais gostou? O atendimento foi pontual?"
                className="bg-gray-800 border-gray-700 min-h-[100px] resize-none focus-visible:ring-primary text-gray-200 placeholder:text-gray-600"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
             />
             <p className="text-[10px] text-gray-500 text-center">
               Sua avaliação ajuda outros clientes e o profissional.
             </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-3 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto hover:bg-white/5">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || rating === 0} className="w-full sm:w-auto font-bold bg-primary hover:bg-primary/90 text-black">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
import { useState, useEffect } from 'react';
import type { EnrichedAppointment } from '../../store/userAppointmentsStore';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Componentes Primitivos
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: EnrichedAppointment; 
  onSubmit: (rating: number, comment: string) => void;
  isLoading?: boolean;
}

const ReviewModal = ({ isOpen, onClose, appointment, onSubmit, isLoading = false }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0); // Novo estado para efeito visual ao passar o mouse

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-white">Avaliar Agendamento</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Como foi sua experiência com <span className="text-primary font-medium">{appointment.professionalName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {/* Estrelas */}
          <div className="flex justify-center gap-2" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
              >
                <Star
                  size={32}
                  className={`transition-colors duration-200 ${
                    (hoverRating || rating) >= star
                      ? "text-primary fill-primary"
                      : "text-gray-700 fill-gray-800"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="w-full space-y-3">
             <Label htmlFor="comment" className="text-gray-200">Comentário (Opcional)</Label>
             <Textarea
                id="comment"
                placeholder="Conte-nos o que achou do serviço..."
                className="bg-gray-800 border-gray-700 min-h-[100px] resize-none focus-visible:ring-primary"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
             />
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-3 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto font-bold">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
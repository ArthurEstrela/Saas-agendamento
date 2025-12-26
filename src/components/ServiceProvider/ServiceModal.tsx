import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Service } from "../../types";
import { Loader2, Scissors, AlignLeft, Clock, DollarSign } from "lucide-react";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

const serviceSchema = z.object({
  name: z.string().min(3, "Nome do serviço é obrigatório"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
  duration: z.number().min(5, "A duração mínima é de 5 minutos"),
  price: z.number().min(0, "O preço não pode ser negativo"),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceFormData) => void;
  service?: Service | null;
  isLoading: boolean;
}

export const ServiceModal = ({
  isOpen,
  onClose,
  onSave,
  service,
  isLoading,
}: ServiceModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (service) {
        reset(service);
      } else {
        reset({ name: "", description: "", duration: 30, price: 0 });
      }
    }
  }, [service, reset, isOpen]);

  const handleSave = (data: ServiceFormData) => onSave(data);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            {service ? (
              <Scissors className="text-primary" />
            ) : (
              <Scissors className="text-gray-400" />
            )}
            {service ? "Editar Serviço" : "Novo Serviço"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="service-form"
          onSubmit={handleSubmit(handleSave)}
          className="space-y-5 py-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Serviço</Label>
            <div className="relative">
              <Scissors className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="name"
                {...register("name")}
                className="pl-9"
                placeholder="Ex: Corte Degrade"
                error={errors.name?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Textarea
                id="description"
                {...register("description")}
                className="pl-9 min-h-[80px] resize-none bg-gray-800 border-gray-700"
                placeholder="O que está incluso?"
              />
            </div>
            {errors.description && (
              <p className="text-xs text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (min)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="duration"
                  type="number"
                  {...register("duration", { valueAsNumber: true })}
                  className="pl-9"
                  error={errors.duration?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                  className="pl-9"
                  error={errors.price?.message}
                />
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="service-form"
            disabled={isLoading}
            className="min-w-[120px] font-bold"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : null}
            {service ? "Salvar" : "Criar Serviço"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

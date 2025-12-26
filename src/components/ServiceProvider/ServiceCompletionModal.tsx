import { useState, useMemo, useEffect } from "react";
import { CheckCircle, Info, DollarSign, Loader2 } from "lucide-react";
import type { Appointment } from "../../types";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";

interface ServiceCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalPrice: number) => void;
  appointment: Appointment | null;
  isLoading: boolean;
}

export const ServiceCompletionModal = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  isLoading,
}: ServiceCompletionModalProps) => {
  const [priceString, setPriceString] = useState("");
  const initialPrice = useMemo(
    () => appointment?.totalPrice ?? 0,
    [appointment]
  );

  useEffect(() => {
    if (isOpen) setPriceString(initialPrice.toFixed(2));
  }, [isOpen, initialPrice]);

  const finalPriceValue = parseFloat(priceString);

  const handleConfirm = () => {
    if (isNaN(finalPriceValue) || finalPriceValue < 0) return;
    onConfirm(finalPriceValue);
  };

  const isPriceValid = !isNaN(finalPriceValue) && finalPriceValue >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="text-green-500" size={20} /> Concluir
            Atendimento
          </DialogTitle>
          <DialogDescription>
            Confirme ou ajuste o valor final cobrado pelo serviço.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Card className="bg-gray-800/50 border-gray-700 p-3 flex items-center gap-3">
            <Info className="text-primary shrink-0" size={18} />
            <span className="text-sm text-gray-300">
              Valor Original:{" "}
              <span className="font-bold text-white">
                R$ {initialPrice.toFixed(2)}
              </span>
            </span>
          </Card>

          <div className="space-y-2">
            <label
              htmlFor="finalPrice"
              className="text-sm font-medium text-gray-300"
            >
              Valor Final (R$)
            </label>
            <div className="relative">
              <DollarSign
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <Input
                id="finalPrice"
                type="number"
                step="0.01"
                value={priceString}
                onChange={(e) => setPriceString(e.target.value)}
                className="pl-9 h-12 text-lg bg-gray-950 border-gray-700 focus-visible:ring-primary"
                autoFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !isPriceValid}
            className="bg-green-600 hover:bg-green-500 text-white font-bold"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : null}
            Confirmar e Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

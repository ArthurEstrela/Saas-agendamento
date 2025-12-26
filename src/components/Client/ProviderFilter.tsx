import { useState } from "react";
import { SlidersHorizontal, MapPin, Star, CreditCard} from "lucide-react";
import type { PaymentMethod } from "../../types";

// UI
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "../ui/sheet";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils/cn";

interface AppliedFilters {
  distance: number;
  areaOfWork: string;
  minRating: number;
  paymentMethods: PaymentMethod[];
}

interface ProviderFilterProps {
  onApplyFilters: (filters: AppliedFilters) => void;
  availableAreas: string[];
  initialFilters: AppliedFilters;
}

const paymentOptions: { id: PaymentMethod; label: string }[] = [
  { id: "pix", label: "Pix" },
  { id: "credit_card", label: "Cartão" },
  { id: "cash", label: "Dinheiro" },
];

export const ProviderFilter = ({
  onApplyFilters,
  availableAreas,
  initialFilters,
}: ProviderFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<AppliedFilters>(initialFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    setIsOpen(false);
  };

  const handleClear = () => {
    const reset = {
      distance: 50,
      areaOfWork: "all",
      minRating: 0,
      paymentMethods: [],
    };
    setFilters(reset);
    onApplyFilters(reset);
    setIsOpen(false);
  };

  const togglePayment = (method: PaymentMethod) => {
    setFilters((prev) => {
      const methods = prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method];
      return { ...prev, paymentMethods: methods };
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-12 border-gray-700 bg-gray-900/50 hover:bg-gray-800 text-gray-300 gap-2"
        >
          <SlidersHorizontal size={18} /> Filtros
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md bg-gray-900 border-l border-gray-800 flex flex-col h-full">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-white text-xl flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-primary" /> Filtrar
            Resultados
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-8 pr-2">
          {/* Distância */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base text-white flex items-center gap-2">
                <MapPin size={16} /> Distância Máxima
              </Label>
              <span className="text-primary font-bold text-sm">
                {filters.distance} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={filters.distance}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  distance: Number(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1km</span>
              <span>100km</span>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Avaliação */}
          <div className="space-y-3">
            <Label className="text-base text-white flex items-center gap-2">
              <Star size={16} /> Avaliação Mínima
            </Label>
            <div className="flex gap-2">
              {[0, 3, 4, 4.5].map((rating) => (
                <Badge
                  key={rating}
                  variant={filters.minRating === rating ? "default" : "outline"}
                  className="cursor-pointer h-9 px-4 text-sm"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, minRating: rating }))
                  }
                >
                  {rating === 0 ? "Todas" : `${rating}+ ★`}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Categoria */}
          <div className="space-y-3">
            <Label className="text-base text-white">Categoria</Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={filters.areaOfWork === "all" ? "default" : "outline"}
                className="cursor-pointer h-8"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, areaOfWork: "all" }))
                }
              >
                Todas
              </Badge>
              {availableAreas.map((area) => (
                <Badge
                  key={area}
                  variant={filters.areaOfWork === area ? "default" : "outline"}
                  className="cursor-pointer h-8"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, areaOfWork: area }))
                  }
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Pagamento */}
          <div className="space-y-3">
            <Label className="text-base text-white flex items-center gap-2">
              <CreditCard size={16} /> Formas de Pagamento
            </Label>
            <div className="flex gap-2">
              {paymentOptions.map((opt) => {
                const isSelected = filters.paymentMethods.includes(opt.id);
                return (
                  <Badge
                    key={opt.id}
                    variant="outline"
                    className={cn(
                      "cursor-pointer h-9 px-4 text-sm transition-all",
                      isSelected
                        ? "bg-primary/20 border-primary text-primary hover:bg-primary/30"
                        : "text-gray-400 border-gray-700 hover:text-white hover:border-gray-500"
                    )}
                    onClick={() => togglePayment(opt.id)}
                  >
                    {opt.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={handleClear}
            className="w-full sm:w-auto"
          >
            Limpar
          </Button>
          <Button
            onClick={handleApply}
            className="w-full sm:w-auto font-bold bg-primary text-black hover:bg-primary/90"
          >
            Ver Resultados
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

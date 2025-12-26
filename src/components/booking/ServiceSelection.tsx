import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { motion } from "framer-motion";
import { Check, Plus, ShoppingCart, Clock, DollarSign } from "lucide-react";
import { useMemo } from "react";
import { cn } from "../../lib/utils/cn";

// Primitivos
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Typography } from "../ui/typography";

export const ServiceSelection = () => {
  const { provider, selectedServices, toggleService, goToNextStep } = useBookingProcessStore();

  const { totalDuration, totalPrice } = useMemo(() => {
    return selectedServices.reduce(
      (acc, service) => ({
        totalDuration: acc.totalDuration + service.duration,
        totalPrice: acc.totalPrice + service.price,
      }),
      { totalDuration: 0, totalPrice: 0 }
    );
  }, [selectedServices]);

  const hasServices = (provider?.services?.length ?? 0) > 0;
  const isServiceSelected = selectedServices.length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24">
      <div className="text-center mb-8">
        <Typography variant="h2">Selecione os Serviços</Typography>
        <Typography variant="muted">Escolha um ou mais serviços para continuar.</Typography>
      </div>

      <div className="max-w-5xl mx-auto px-1">
        {hasServices ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {provider!.services!.map((service) => {
              const isSelected = selectedServices.some((s) => s.id === service.id);
              return (
                <motion.div
                    key={service.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Card
                    onClick={() => toggleService(service)}
                    className={cn(
                        "cursor-pointer h-full transition-all duration-300 border-2",
                        isSelected
                        ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(218,165,32,0.15)]"
                        : "border-gray-800 hover:border-gray-600 bg-gray-900/50"
                    )}
                    >
                    <CardHeader className="pb-2 space-y-0">
                        <div className="flex justify-between items-start gap-4">
                            <CardTitle className="text-base font-bold text-gray-100 leading-tight">
                                {service.name}
                            </CardTitle>
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                isSelected ? "bg-primary text-black" : "bg-gray-800 text-gray-500"
                            )}>
                                {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-4 min-h-[40px]">
                            {service.description || "Sem descrição disponível."}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                            <Badge variant="outline" className="border-primary/30 text-primary gap-1">
                                <DollarSign size={12} /> {service.price.toFixed(2)}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={12} /> {service.duration} min
                            </span>
                        </div>
                    </CardContent>
                    </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
            <ShoppingCart size={48} className="mx-auto text-gray-600 mb-4" />
            <Typography variant="h4" className="text-gray-400">Nenhum serviço disponível.</Typography>
          </div>
        )}
      </div>

      {/* --- Resumo Fixo --- */}
      <div className="fixed bottom-0 left-0 w-full z-40 p-4">
        <div className="max-w-4xl mx-auto bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Estimado</p>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-white">R$ {totalPrice.toFixed(2)}</span>
                        <Badge variant="secondary" className="h-6">
                            <Clock size={12} className="mr-1" /> {totalDuration} min
                        </Badge>
                    </div>
                </div>
            </div>
            <Button
                onClick={goToNextStep}
                disabled={!isServiceSelected}
                size="lg"
                className="w-full sm:w-auto px-8 font-bold shadow-lg shadow-primary/20"
            >
                Continuar
            </Button>
        </div>
      </div>
    </motion.div>
  );
};
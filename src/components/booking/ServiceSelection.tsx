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
  const { provider, selectedServices, toggleService, goToNextStep } =
    useBookingProcessStore();

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-32"
    >
      <div className="text-center mb-10">
        <Typography variant="h2" className="drop-shadow-sm">
          Selecione os Serviços
        </Typography>
        <Typography variant="muted">
          Escolha um ou mais serviços para continuar.
        </Typography>
      </div>

      <div className="max-w-6xl mx-auto px-2">
        {hasServices ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {provider!.services!.map((service) => {
              const isSelected = selectedServices.some(
                (s) => s.id === service.id
              );
              return (
                <motion.div
                  key={service.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    onClick={() => toggleService(service)}
                    className={cn(
                      "cursor-pointer h-full transition-all duration-300 border",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(218,165,32,0.15)]"
                        : "border-white/5 hover:border-primary/40 bg-gray-900/60 hover:bg-gray-900/80 backdrop-blur-sm"
                    )}
                  >
                    <CardHeader className="pb-3 space-y-0">
                      <div className="flex justify-between items-start gap-4">
                        <CardTitle className="text-lg font-bold text-gray-100 leading-tight">
                          {service.name}
                        </CardTitle>
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors border",
                            isSelected
                              ? "bg-primary text-black border-primary"
                              : "bg-transparent text-gray-500 border-gray-700"
                          )}
                        >
                          {isSelected ? (
                            <Check size={14} strokeWidth={3} />
                          ) : (
                            <Plus size={14} />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-5 min-h-[40px] leading-relaxed">
                        {service.description || "Sem descrição disponível."}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <Badge
                          variant="outline"
                          className="border-primary/30 text-primary gap-1 bg-primary/5"
                        >
                          <DollarSign size={12} /> {service.price.toFixed(2)}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
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
          <div className="text-center py-20 bg-gray-900/40 rounded-3xl border border-dashed border-white/10 backdrop-blur-sm">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart size={40} className="text-gray-500" />
            </div>
            <Typography variant="h4" className="text-gray-300 mb-2">
              Nenhum serviço disponível
            </Typography>
            <p className="text-gray-500">
              Este profissional ainda não cadastrou serviços.
            </p>
          </div>
        )}
      </div>

      {/* --- Resumo Fixo --- */}
      <div className="fixed bottom-0 left-0 w-full z-50 p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ring-1 ring-white/5">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                Total Estimado
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold text-white">
                  R$ {totalPrice.toFixed(2)}
                </span>
                {totalDuration > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-6 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Clock size={12} className="mr-1.5" /> {totalDuration} min
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={goToNextStep}
            disabled={!isServiceSelected}
            size="lg"
            className="w-full sm:w-auto px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            Continuar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
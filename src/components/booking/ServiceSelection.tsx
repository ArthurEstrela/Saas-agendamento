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
      className="pb-32 md:pb-32" // Padding inferior para não esconder conteúdo atrás do footer
    >
      <div className="text-center mb-6 md:mb-10">
        <Typography variant="h2" className="drop-shadow-sm text-2xl md:text-3xl">
          Selecione os Serviços
        </Typography>
        <Typography variant="muted" className="text-sm md:text-base">
          Escolha um ou mais serviços para continuar.
        </Typography>
      </div>

      <div className="max-w-6xl mx-auto px-2 md:px-4">
        {hasServices ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {provider!.services!.map((service) => {
              const isSelected = selectedServices.some(
                (s) => s.id === service.id
              );
              return (
                <motion.div
                  key={service.id}
                  // Removemos scale no hover em mobile via media query do CSS se necessário, 
                  // mas aqui mantemos sutil
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="touch-manipulation" // Melhora resposta ao toque
                >
                  <Card
                    onClick={() => toggleService(service)}
                    className={cn(
                      "cursor-pointer h-full transition-all duration-200 border relative overflow-hidden",
                      isSelected
                        ? "border-primary bg-primary/10 md:shadow-[0_0_20px_rgba(218,165,32,0.15)]" // Sombra pesada só no desktop
                        : "border-white/5 hover:border-primary/40 bg-[#18181b] md:bg-gray-900/60 md:backdrop-blur-sm" // Fundo sólido no mobile
                    )}
                  >
                    <CardHeader className="pb-3 space-y-0 relative z-10">
                      <div className="flex justify-between items-start gap-4">
                        <CardTitle className="text-base md:text-lg font-bold text-gray-100 leading-tight">
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
                    <CardContent className="relative z-10">
                      <p className="text-xs md:text-sm text-gray-400 line-clamp-2 mb-4 min-h-[32px] md:min-h-[40px] leading-relaxed">
                        {service.description || "Sem descrição disponível."}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <Badge
                          variant="outline"
                          className="border-primary/30 text-primary gap-1 bg-primary/5 text-xs font-normal"
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
          <div className="text-center py-16 md:py-20 bg-[#18181b] md:bg-gray-900/40 rounded-3xl border border-dashed border-white/10 md:backdrop-blur-sm">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart size={32} className="text-gray-500 md:w-10 md:h-10" />
            </div>
            <Typography variant="h4" className="text-gray-300 mb-2 text-lg md:text-xl">
              Nenhum serviço disponível
            </Typography>
            <p className="text-gray-500 text-sm">
              Este profissional ainda não cadastrou serviços.
            </p>
          </div>
        )}
      </div>

      {/* --- Resumo Fixo Otimizado --- */}
      <div className="fixed bottom-0 left-0 w-full z-50 p-2 md:p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto bg-[#121214] border-t border-white/10 md:bg-gray-900/90 md:backdrop-blur-xl md:border md:rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ring-1 ring-white/5 rounded-xl md:rounded-2xl">
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
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
            
            {/* Info Mobile Extra (Contador) */}
            <div className="sm:hidden text-right">
                <span className="text-xs text-gray-500 font-medium">
                    {selectedServices.length} {selectedServices.length === 1 ? 'item' : 'itens'}
                </span>
            </div>
          </div>
          
          <Button
            onClick={goToNextStep}
            disabled={!isServiceSelected}
            size="lg"
            className="w-full sm:w-auto px-8 font-bold shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            Continuar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
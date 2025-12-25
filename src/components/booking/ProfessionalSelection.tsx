import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { CheckCircle, User, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "../../lib/utils/cn";

// Primitivos
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const ProfessionalSelection = () => {
  const {
    professionals,
    selectedServices,
    selectedProfessional,
    selectProfessional,
    goToNextStep,
    goToPreviousStep,
  } = useBookingProcessStore();

  const availableProfessionals = useMemo(() => {
    if (!selectedServices || selectedServices.length === 0) return [];
    const selectedServiceIds = selectedServices.map((s) => s.id);
    return professionals.filter((prof) =>
      selectedServiceIds.every((serviceId) =>
        prof.services.some((ps) => ps.id === serviceId)
      )
    );
  }, [professionals, selectedServices]);

  if (availableProfessionals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center max-w-lg mx-auto bg-black/30 p-8 rounded-2xl border border-destructive/50 shadow-2xl"
      >
        <Users size={48} className="mx-auto text-destructive/50" />
        <Typography variant="h3" className="mt-4 mb-2">
          Nenhum Profissional Disponível
        </Typography>
        <Typography variant="p" className="mb-6">
          Não encontramos um profissional que realize *todos* os serviços
          selecionados.
        </Typography>
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          className="border-destructive hover:bg-destructive hover:text-white"
        >
          Voltar e alterar serviços
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Typography variant="h2" className="text-center mb-8">
        Escolha o Profissional
      </Typography>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {availableProfessionals.map((professional) => {
          const isSelected = selectedProfessional?.id === professional.id;
          return (
            <motion.button
              key={professional.id}
              onClick={() => selectProfessional(professional)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative p-4 flex flex-col items-center gap-4 bg-black/30 rounded-2xl border-2 transition-all duration-300 w-full",
                isSelected
                  ? "border-primary ring-4 ring-primary/20 bg-primary/10"
                  : "border-gray-700 hover:border-primary/50 hover:bg-gray-800/50"
              )}
            >
              {isSelected && (
                <CheckCircle
                  size={24}
                  className="absolute top-2 right-2 text-primary bg-black rounded-full p-0.5"
                />
              )}

              <Avatar className="w-24 h-24 border-2 border-gray-600">
                <AvatarImage
                  src={professional.photoURL || ""}
                  alt={professional.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-800">
                  <User size={40} className="text-gray-500" />
                </AvatarFallback>
              </Avatar>

              <h3
                className={cn(
                  "text-lg font-semibold text-center",
                  isSelected ? "text-primary" : "text-white"
                )}
              >
                {professional.name}
              </h3>
            </motion.button>
          );
        })}
      </div>

      <div className="sticky bottom-0 mt-8 py-4 px-6 bg-gray-900/80 backdrop-blur-sm rounded-t-2xl border-t border-gray-800 flex justify-between items-center gap-4 max-w-4xl mx-auto">
        <Button variant="secondary" onClick={goToPreviousStep}>
          Voltar
        </Button>
        <Button
          onClick={goToNextStep}
          disabled={!selectedProfessional}
          className="w-full md:w-auto"
        >
          Avançar para Data e Hora
        </Button>
      </div>
    </motion.div>
  );
};

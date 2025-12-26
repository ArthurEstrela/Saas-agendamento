import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { CheckCircle, User, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "../../lib/utils/cn";

// Primitivos
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";

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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
        <Card className="max-w-md w-full p-8 text-center bg-gray-900/50 border-destructive/30">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-destructive" />
            </div>
            <Typography variant="h3" className="mb-2">Indisponível</Typography>
            <p className="text-gray-400 mb-6">
                Nenhum profissional realiza <b>todos</b> os serviços selecionados. Tente remover alguns serviços.
            </p>
            <Button variant="outline" onClick={goToPreviousStep} className="w-full">
                Voltar e alterar serviços
            </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-24">
      <div className="text-center mb-8">
        <Typography variant="h2">Escolha o Profissional</Typography>
        <Typography variant="muted">Quem você prefere que te atenda?</Typography>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl mx-auto px-2">
        {availableProfessionals.map((professional) => {
          const isSelected = selectedProfessional?.id === professional.id;
          return (
            <motion.div
                key={professional.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Card
                onClick={() => selectProfessional(professional)}
                className={cn(
                    "cursor-pointer flex flex-col items-center gap-4 p-6 transition-all duration-300 border-2",
                    isSelected
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(218,165,32,0.2)]"
                        : "border-gray-800 hover:border-gray-600 bg-gray-900/50"
                )}
                >
                <div className="relative">
                    <Avatar className={cn("w-24 h-24 border-2 transition-colors", isSelected ? "border-primary" : "border-gray-700")}>
                        <AvatarImage src={professional.photoURL || ""} alt={professional.name} />
                        <AvatarFallback className="bg-gray-800 text-gray-500">
                            <User size={40} />
                        </AvatarFallback>
                    </Avatar>
                    {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 animate-scale-in">
                            <CheckCircle size={24} className="text-primary fill-current" />
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <h3 className={cn("text-lg font-bold transition-colors", isSelected ? "text-primary" : "text-white")}>
                        {professional.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Disponível</p>
                </div>
                </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full z-40 p-4">
        <div className="max-w-4xl mx-auto bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-4 flex justify-between items-center gap-4">
            <Button variant="ghost" onClick={goToPreviousStep}>
                Voltar
            </Button>
            <Button
                onClick={goToNextStep}
                disabled={!selectedProfessional}
                className="w-full sm:w-auto px-8 font-bold"
            >
                Ver Horários
            </Button>
        </div>
      </div>
    </motion.div>
  );
};
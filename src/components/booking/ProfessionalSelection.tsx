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
import { Badge } from "../ui/badge";

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
        className="flex justify-center py-10"
      >
        <Card className="max-w-md w-full p-8 text-center bg-gray-900/60 border-destructive/30 backdrop-blur-md shadow-2xl">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-destructive" />
          </div>
          <Typography variant="h3" className="mb-2 text-white">
            Indisponível
          </Typography>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Nenhum profissional realiza <b>todos</b> os serviços selecionados.
            <br /> Tente remover alguns serviços.
          </p>
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            className="w-full border-white/10 hover:bg-white/5"
          >
            Voltar e alterar serviços
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32"
    >
      <div className="text-center mb-10">
        <Typography variant="h2" className="drop-shadow-sm">
          Escolha o Profissional
        </Typography>
        <Typography variant="muted">
          Quem você prefere que te atenda?
        </Typography>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto px-2">
        {availableProfessionals.map((professional) => {
          const isSelected = selectedProfessional?.id === professional.id;
          return (
            <motion.div
              key={professional.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Card
                onClick={() => selectProfessional(professional)}
                className={cn(
                  "cursor-pointer flex flex-col items-center gap-5 p-6 transition-all duration-300 border relative overflow-hidden",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_25px_rgba(218,165,32,0.2)]"
                    : "border-white/5 hover:border-primary/30 bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-sm"
                )}
              >
                {/* Efeito de brilho ao fundo se selecionado */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                )}

                <div className="relative z-10">
                  <Avatar
                    className={cn(
                      "w-28 h-28 border-4 transition-all shadow-xl",
                      isSelected
                        ? "border-primary shadow-primary/20"
                        : "border-gray-800"
                    )}
                  >
                    <AvatarImage
                      src={professional.photoURL || ""}
                      alt={professional.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gray-800 text-gray-500">
                      <User size={40} />
                    </AvatarFallback>
                  </Avatar>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-background rounded-full p-1 shadow-lg"
                    >
                      <CheckCircle
                        size={24}
                        className="text-primary fill-current"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="text-center z-10">
                  <h3
                    className={cn(
                      "text-lg font-bold transition-colors line-clamp-1",
                      isSelected ? "text-primary" : "text-white"
                    )}
                  >
                    {professional.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className="mt-2 border-green-500/30 text-green-400 bg-green-500/10 text-[10px] h-5"
                  >
                    Disponível
                  </Badge>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full z-50 p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex justify-between items-center gap-4 ring-1 ring-white/5">
          <Button
            variant="ghost"
            onClick={goToPreviousStep}
            className="hover:bg-white/5"
          >
            Voltar
          </Button>
          <Button
            onClick={goToNextStep}
            disabled={!selectedProfessional}
            className="w-full sm:w-auto px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            Ver Horários
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

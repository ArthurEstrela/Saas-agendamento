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
        <Card className="max-w-md w-full p-8 text-center bg-[#18181b] md:bg-gray-900/60 border-destructive/30 md:backdrop-blur-md shadow-xl">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-destructive" />
          </div>
          <Typography variant="h3" className="mb-2 text-white">
            Indisponível
          </Typography>
          <p className="text-gray-400 mb-8 leading-relaxed text-sm md:text-base">
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
      className="pb-32 md:pb-32"
    >
      <div className="text-center mb-6 md:mb-10">
        <Typography variant="h2" className="drop-shadow-sm text-2xl md:text-3xl">
          Escolha o Profissional
        </Typography>
        <Typography variant="muted" className="text-sm md:text-base">
          Quem você prefere que te atenda?
        </Typography>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 max-w-5xl mx-auto px-2 md:px-4">
        {availableProfessionals.map((professional) => {
          const isSelected = selectedProfessional?.id === professional.id;
          return (
            <motion.div
              key={professional.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="touch-manipulation"
            >
              <Card
                onClick={() => selectProfessional(professional)}
                className={cn(
                  "cursor-pointer flex flex-col items-center gap-4 md:gap-5 p-4 md:p-6 transition-all duration-200 border relative overflow-hidden",
                  isSelected
                    ? "border-primary bg-primary/10 md:shadow-[0_0_25px_rgba(218,165,32,0.2)]" // Sombra só no desktop
                    : "border-white/5 hover:border-primary/30 bg-[#18181b] md:bg-gray-900/60 md:hover:bg-gray-800/80 md:backdrop-blur-sm" // Fundo sólido mobile
                )}
              >
                {/* Efeito de brilho ao fundo se selecionado (Apenas Desktop para poupar GPU mobile) */}
                {isSelected && (
                  <div className="hidden md:block absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                )}

                <div className="relative z-10">
                  <Avatar
                    className={cn(
                      "w-20 h-20 md:w-28 md:h-28 border-4 transition-all shadow-xl",
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
                      <User size={32} className="md:w-10 md:h-10" />
                    </AvatarFallback>
                  </Avatar>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-background rounded-full p-1 shadow-lg"
                    >
                      <CheckCircle
                        size={20}
                        className="text-primary fill-current md:w-6 md:h-6"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="text-center z-10 w-full">
                  <h3
                    className={cn(
                      "text-sm md:text-lg font-bold transition-colors line-clamp-1 break-words px-1",
                      isSelected ? "text-primary" : "text-white"
                    )}
                  >
                    {professional.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className="mt-2 border-green-500/30 text-green-400 bg-green-500/10 text-[10px] h-5 px-1.5 md:px-2.5"
                  >
                    Disponível
                  </Badge>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* --- Footer Fixo Otimizado --- */}
      <div className="fixed bottom-0 left-0 w-full z-50 p-2 md:p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto bg-[#121214] border-t border-white/10 md:bg-gray-900/90 md:backdrop-blur-xl md:border md:rounded-2xl shadow-2xl p-4 flex justify-between items-center gap-4 ring-1 ring-white/5 rounded-xl md:rounded-2xl">
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
            className="w-full sm:w-auto px-6 md:px-8 font-bold shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            Ver Horários
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
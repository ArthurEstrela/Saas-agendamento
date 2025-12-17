// Em src/components/ServiceProvider/AvailabilityManagement.tsx

import { useState, useEffect, useMemo } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useProfessionalsManagementStore } from "../../store/professionalsManagementStore";

import type {
  Professional,
  DailyAvailability,
  TimeSlot,
  ServiceProviderProfile,
  ProfessionalProfile,
  UserProfile,
} from "../../types";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils/cn";

// Constantes
const weekDays: DailyAvailability["dayOfWeek"][] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const weekDaysPt: { [key in DailyAvailability["dayOfWeek"]]: string } = {
  Sunday: "Domingo",
  Monday: "Segunda-feira",
  Tuesday: "Terça-feira",
  Wednesday: "Quarta-feira",
  Thursday: "Quinta-feira",
  Friday: "Sexta-feira",
  Saturday: "Sábado",
};

// --- Helper para preencher a semana ---
const getFullWeekAvailability = (
  availability: DailyAvailability[] | undefined
): DailyAvailability[] => {
  return weekDays.map((dayName) => {
    return (
      availability?.find((a) => a.dayOfWeek === dayName) || {
        dayOfWeek: dayName,
        isAvailable: false,
        slots: [],
      }
    );
  });
};

// --- INTERFACE DE PROPS (FASE 4) ---
interface AvailabilityManagementProps {
  userProfile: UserProfile | null;
}

export const AvailabilityManagement = ({
  userProfile,
}: AvailabilityManagementProps) => {
  // --- 1. LÓGICA DE ROLE E ESTADO ---
  const { updateProfessional } = useProfessionalsManagementStore();
  const allProfessionals = useProfileStore((state) => state.professionals);

  // Estado local
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<DailyAvailability[]>([]);
  const [currentProfessional, setCurrentProfessional] =
    useState<Professional | null>(null);
  const [selectedProfId, setSelectedProfId] = useState<string>("");

  // --- 2. VERIFICAÇÃO DE ROLE E DADOS ---
  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  const isOwner = userProfile.role === "serviceProvider";

  // --- 3. EFEITO DE CARREGAMENTO DE DADOS (LIMPO E CORRIGIDO) ---
  useEffect(() => {
    setIsLoading(true);

    if (isOwner) {
      // --- Lógica do Dono ---
      if (!allProfessionals || allProfessionals.length === 0) {
        setIsLoading(false);
        setCurrentProfessional(null); // Limpa o profissional
        setAvailability([]); // Limpa a disponibilidade
        return;
      }

      const profId = selectedProfId || allProfessionals[0].id;
      if (selectedProfId !== profId) {
        setSelectedProfId(profId);
      }

      const selected = allProfessionals.find((p) => p.id === profId);

      if (selected) {
        setCurrentProfessional(selected);
        setAvailability(getFullWeekAvailability(selected.availability));
      } else {
        // Fallback se o ID selecionado for inválido
        setCurrentProfessional(allProfessionals[0]);
        setAvailability(
          getFullWeekAvailability(allProfessionals[0].availability)
        );
        setSelectedProfId(allProfessionals[0].id);
      }
      setIsLoading(false);
    } else {
      // --- Lógica do Profissional ---
      // (Depende da 'profileStore' carregar 'allProfessionals' para o profissional)

      if (!allProfessionals) {
        // A 'profileStore' ainda não carregou a lista.
        return;
      }

      // Obter o 'professionalId' (do recurso) a partir do perfil do utilizador
      const { professionalId } = userProfile as ProfessionalProfile;

      const myProfessionalData = allProfessionals.find(
        (p) => p.id === professionalId
      );

      if (myProfessionalData) {
        setCurrentProfessional(myProfessionalData);
        setAvailability(
          getFullWeekAvailability(myProfessionalData.availability)
        );
      } else {
        console.error(
          "Erro de dados: Não foi possível encontrar os dados do profissional logado."
        );
        setCurrentProfessional(null);
        setAvailability([]);
      }
      setIsLoading(false);
    }
  }, [isOwner, userProfile, allProfessionals, selectedProfId]);

  // --- 4. HANDLERS (Com a correção) ---

  const handleIsAvailableChange = (
    day: DailyAvailability["dayOfWeek"],
    isAvailable: boolean
  ) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.dayOfWeek === day
          ? {
              ...d,
              isAvailable,
              slots:
                isAvailable && d.slots.length === 0
                  ? [{ start: "09:00", end: "18:00" }]
                  : d.slots,
            }
          : d
      )
    );
  };

  // ***** AQUI ESTÁ A CORREÇÃO *****
  const handleSlotChange = (
    day: DailyAvailability["dayOfWeek"],
    slotIndex: number,
    field: "start" | "end", // <-- Corrigido de | end" para | "end"
    value: string
  ) => {
    setAvailability((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek === day) {
          const newSlots = [...d.slots];
          newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
          return { ...d, slots: newSlots };
        }
        return d;
      })
    );
  };

  const handleAddSlot = (day: DailyAvailability["dayOfWeek"]) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.dayOfWeek === day
          ? { ...d, slots: [...d.slots, { start: "19:00", end: "21:00" }] }
          : d
      )
    );
  };

  const handleRemoveSlot = (
    day: DailyAvailability["dayOfWeek"],
    slotIndex: number
  ) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.dayOfWeek === day
          ? { ...d, slots: d.slots.filter((_, i) => i !== slotIndex) }
          : d
      )
    );
  };

  // --- 5. LÓGICA DE SALVAR ---
  const handleSave = async () => {
    if (!currentProfessional) return;
    setIsSaving(true);

    const providerId = isOwner
      ? (userProfile as ServiceProviderProfile).id
      : (userProfile as ProfessionalProfile).serviceProviderId;

    const professionalIdToSave = isOwner
      ? selectedProfId
      : (userProfile as ProfessionalProfile).professionalId;

    const updatedProfessional = {
      ...currentProfessional,
      availability: availability,
    };

    const { id, photoURL, ...payloadWithoutId } = updatedProfessional;
    const payload = {
      ...payloadWithoutId,
      photoURL: photoURL,
      photoFile: null,
    };

    try {
      await updateProfessional(providerId, professionalIdToSave, payload);
      // showToast("Disponibilidade salva com sucesso!", "success");
    } catch (error) {
      console.error("Falha ao salvar a disponibilidade:", error);
      // showToast("Falha ao salvar a disponibilidade.", "error");
    }

    setIsSaving(false);
  };

  // --- 6. RENDERIZAÇÃO (ESTADOS DE LOADING E VAZIO) ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  if (isOwner && (!allProfessionals || allProfessionals.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-2xl p-8">
        <AlertTriangle size={48} className="mb-4 text-amber-500" />
        <h3 className="text-xl font-semibold text-gray-300">
          Nenhum profissional cadastrado
        </h3>
        <p className="text-center mt-2">
          Cadastre um profissional na seção "Profissionais" para gerenciar a
          disponibilidade.
        </p>
      </div>
    );
  }

  if (!currentProfessional) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <AlertTriangle size={32} className="mr-3" />
        Não foi possível carregar os dados do profissional.
      </div>
    );
  }

  // --- 7. RENDERIZAÇÃO (COMPONENTE PRINCIPAL) ---

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <Clock /> Gerenciar Disponibilidade
      </h1>

      {/* --- SELETOR (RENDERIZAÇÃO CONDICIONAL) --- */}
      <div className="bg-black/30 p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-amber-500/50">
          {currentProfessional?.photoURL ? (
            <img
              src={currentProfessional.photoURL}
              alt={currentProfessional.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="text-gray-400" size={32} />
          )}
        </div>

        <div className="flex-grow">
          <p className="text-sm font-medium text-gray-300 mb-1">
            {isOwner ? "Profissional Selecionado" : "Meu Perfil"}
          </p>
          <h2 className="text-2xl font-bold text-white mb-3">
            {currentProfessional?.name || "Selecione..."}
          </h2>

          {isOwner && allProfessionals && (
            <select
              id="professional-select"
              onChange={(e) => setSelectedProfId(e.target.value)}
              value={selectedProfId}
              className="w-full max-w-xs bg-gray-800 p-3 rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-amber-500 appearance-none transition-colors"
            >
              {allProfessionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* --- GRID DOS DIAS DA SEMANA --- */}
      <>
        <h2 className="text-2xl font-bold text-white pt-4">
          Horários de Trabalho
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availability.map((day) => (
            <motion.div
              key={day.dayOfWeek}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "bg-black/30 p-5 rounded-2xl border border-gray-800 transition-all duration-300",
                {
                  "border-amber-500/50 shadow-lg shadow-amber-900/10":
                    day.isAvailable,
                  "hover:border-gray-600": !day.isAvailable,
                }
              )}
            >
              {/* Cabeçalho do Dia (Nome e Toggle) */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700/50">
                <h3 className="text-lg font-semibold text-white">
                  {weekDaysPt[day.dayOfWeek]}
                </h3>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isAvailable}
                    onChange={(e) =>
                      handleIsAvailableChange(day.dayOfWeek, e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Slots de Horário (Apenas se disponível) */}
              {day.isAvailable && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 pt-2"
                >
                  {day.slots.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg"
                    >
                      {/* Campo De */}
                      <div className="flex-1 min-w-0">
                        <label className="text-gray-400 text-xs block mb-1">
                          De:
                        </label>
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) =>
                            handleSlotChange(
                              day.dayOfWeek,
                              i,
                              "start",
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-900 p-2 rounded-md border border-gray-600 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                        />
                      </div>

                      {/* Campo Até */}
                      <div className="flex-1 min-w-0">
                        <label className="text-gray-400 text-xs block mb-1">
                          Até:
                        </label>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) =>
                            handleSlotChange(
                              day.dayOfWeek,
                              i,
                              "end",
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-900 p-2 rounded-md border border-gray-600 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                        />
                      </div>

                      {/* Botão Remover */}
                      <button
                        onClick={() => handleRemoveSlot(day.dayOfWeek, i)}
                        className="p-2 text-gray-500 hover:text-red-400 rounded-full hover:bg-red-900/50 transition self-end mb-0.5 flex-shrink-0"
                        title="Remover Intervalo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Botão Adicionar */}
                  <button
                    onClick={() => handleAddSlot(day.dayOfWeek)}
                    className="flex items-center gap-2 text-sm text-amber-500 hover:text-yellow-300 mt-2 p-1 rounded-md transition"
                  >
                    <Plus size={16} /> Adicionar intervalo
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end pt-8">
          <button
            onClick={handleSave}
            disabled={isSaving || !currentProfessional}
            className="bg-amber-500 text-black font-semibold px-6 py-3 rounded-lg hover:bg-amber-600 transition flex items-center gap-2 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
          >
            {isSaving ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {isSaving ? "Salvando..." : "Salvar Disponibilidade"}
          </button>
        </div>
      </>
    </motion.div>
  );
};

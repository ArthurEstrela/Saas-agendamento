import { useState, useEffect, useMemo } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useAvailabilityStore } from "../../store/availabilityStore";
import { Loader2, Plus, Trash2, Save, CalendarRange } from "lucide-react"; // Adicionado CalendarRange
import { useToast } from "../../hooks/useToast";
import type {
  DailyAvailability,
  TimeSlot,
  ServiceProviderProfile,
} from "../../types";

// UI Components
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

const DAYS_OF_WEEK: { key: DailyAvailability["dayOfWeek"]; label: string }[] = [
  { key: "Monday", label: "Segunda-feira" },
  { key: "Tuesday", label: "Terça-feira" },
  { key: "Wednesday", label: "Quarta-feira" },
  { key: "Thursday", label: "Quinta-feira" },
  { key: "Friday", label: "Sexta-feira" },
  { key: "Saturday", label: "Sábado" },
  { key: "Sunday", label: "Domingo" },
];

export const AvailabilityManagement = () => {
  // Adicionado updateUserProfile ao destructuring
  const { userProfile, professionals, updateUserProfile } = useProfileStore();
  const { availability, isLoading, fetchAvailability, updateAvailability } =
    useAvailabilityStore();
  const { showSuccess, showError } = useToast();

  const [localAvailability, setLocalAvailability] = useState<
    DailyAvailability[]
  >([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedProfId, setSelectedProfId] = useState<string>("");

  // Novo estado para a Janela de Agendamento
  const [bookingWindow, setBookingWindow] = useState<number>(30);
  const [isSavingWindow, setIsSavingWindow] = useState(false);

  const isOwner = userProfile?.role === "serviceProvider";

  // Inicializa o estado da janela de agendamento quando o perfil carrega
  useEffect(() => {
    if (isOwner && userProfile) {
      const profile = userProfile as ServiceProviderProfile;
      setBookingWindow(profile.bookingWindowDays || 30);
    }
  }, [userProfile, isOwner]);

  // 1. Organiza a lista: Dono primeiro, depois o resto da equipe
  const sortedProfessionals = useMemo(() => {
    if (!professionals) return [];
    return [...professionals].sort((a, b) => {
      if (a.isOwner) return -1;
      if (b.isOwner) return 1;
      return 0;
    });
  }, [professionals]);

  // 2. Identifica o profissional selecionado na lista unificada
  const currentProfessional = sortedProfessionals.find(
    (p) => p.id === selectedProfId
  );

  // 3. Inicialização inteligente
  useEffect(() => {
    if (
      isOwner &&
      !selectedProfId &&
      sortedProfessionals.length > 0 &&
      userProfile?.id
    ) {
      // Tenta pegar o profissional que é dono
      const ownerProfile = sortedProfessionals.find((p) => p.isOwner);

      if (ownerProfile) {
        setSelectedProfId(ownerProfile.id);
        fetchAvailability(userProfile.id, ownerProfile.id);
      } else {
        // Fallback
        const firstProf = sortedProfessionals[0];
        setSelectedProfId(firstProf.id);
        fetchAvailability(userProfile.id, firstProf.id);
      }
    }
  }, [
    isOwner,
    selectedProfId,
    sortedProfessionals,
    fetchAvailability,
    userProfile,
  ]);

  // Sincroniza estado local com a store
  useEffect(() => {
    if (availability.length > 0) {
      setLocalAvailability(availability);
    } else {
      const initial = DAYS_OF_WEEK.map((d) => ({
        dayOfWeek: d.key,
        isAvailable: false,
        slots: [{ start: "09:00", end: "18:00" }],
      }));
      setLocalAvailability(initial);
    }
  }, [availability]);

  // --- HANDLERS ---

  const handleSaveWindow = async () => {
    if (!userProfile?.id) return;
    setIsSavingWindow(true);
    try {
      await updateUserProfile(userProfile.id, {
        bookingWindowDays: bookingWindow,
      });
      showSuccess("Janela de agendamento atualizada!");
    } catch (error) {
      showError("Erro ao atualizar janela de agendamento.");
    } finally {
      setIsSavingWindow(false);
    }
  };

  const handleProfessionalChange = (profId: string) => {
    if (!userProfile?.id) return;
    setSelectedProfId(profId);
    setHasChanges(false);
    fetchAvailability(userProfile.id, profId);
  };

  const handleDayToggle = (dayKey: string, checked: boolean) => {
    setLocalAvailability((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayKey ? { ...day, isAvailable: checked } : day
      )
    );
    setHasChanges(true);
  };

  const handleSlotChange = (
    dayKey: string,
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    setLocalAvailability((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayKey) return day;
        const newSlots = [...day.slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        return { ...day, slots: newSlots };
      })
    );
    setHasChanges(true);
  };

  const addSlot = (dayKey: string) => {
    setLocalAvailability((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayKey) return day;
        return {
          ...day,
          slots: [...day.slots, { start: "08:00", end: "12:00" }],
        };
      })
    );
    setHasChanges(true);
  };

  const removeSlot = (dayKey: string, index: number) => {
    setLocalAvailability((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayKey) return day;
        return { ...day, slots: day.slots.filter((_, i) => i !== index) };
      })
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedProfId || !userProfile?.id) return;
    try {
      await updateAvailability(
        userProfile.id,
        selectedProfId,
        localAvailability
      );
      showSuccess("Horários atualizados com sucesso!");
      setHasChanges(false);
    } catch (error) {
      showError("Erro ao salvar horários.");
    }
  };

  if (!userProfile)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  const initials =
    currentProfessional?.name?.substring(0, 2).toUpperCase() || "US";
  const photoUrl = currentProfessional?.photoURL || "";

  return (
    <div className="space-y-8 pb-20">
      {/* --- CONFIGURAÇÃO DA JANELA DE AGENDAMENTO (Visível apenas para o Dono) --- */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-end gap-6 shadow-sm"
        >
          <div className="flex items-start gap-4 flex-1">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400">
              <CalendarRange size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white leading-none mt-1">
                Janela de Agendamento
              </h3>
              <p className="text-sm text-gray-400 max-w-xl">
                Defina com quanta antecedência os clientes podem ver sua agenda
                aberta. Isso evita agendamentos muito distantes e melhora a
                performance.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={bookingWindow}
                    onChange={(e) => setBookingWindow(Number(e.target.value))}
                    className="w-24 bg-gray-950 border-gray-700 text-white pl-4 pr-2 font-mono text-center focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  dias de antecedência
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSaveWindow}
            disabled={
              isSavingWindow ||
              bookingWindow ===
                (userProfile as ServiceProviderProfile).bookingWindowDays
            }
            className={cn(
              "w-full md:w-auto min-w-[140px]",
              bookingWindow !==
                (userProfile as ServiceProviderProfile).bookingWindowDays
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            {isSavingWindow ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {isSavingWindow ? "Salvando..." : "Salvar Config"}
          </Button>
        </motion.div>
      )}

      {/* --- CABEÇALHO DO PROFISSIONAL --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <Avatar className="h-20 w-20 border-2 border-primary shadow-[0_0_15px_rgba(218,165,32,0.3)]">
            <AvatarImage src={photoUrl} className="object-cover" />
            <AvatarFallback className="bg-gray-800 text-xl font-bold text-gray-400">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <p className="text-sm font-medium text-primary mb-1">
              Editando horários de:
            </p>

            {isOwner && sortedProfessionals.length > 0 ? (
              <div className="w-full md:w-64">
                <Select
                  value={selectedProfId}
                  onValueChange={handleProfessionalChange}
                >
                  <SelectTrigger className="bg-gray-950 border-gray-700 h-10 text-lg font-bold text-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {sortedProfessionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.isOwner && "(Você)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <h2 className="text-2xl font-bold text-white">
                {currentProfessional?.name || "Carregando..."}
              </h2>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className={cn(
            "gap-2 font-bold px-8 h-12 text-base transition-all shadow-lg w-full md:w-auto",
            hasChanges &&
              "shadow-primary/20 animate-pulse bg-primary text-black hover:bg-primary/90"
          )}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* --- GRID DE HORÁRIOS --- */}
      {isLoading && localAvailability.length === 0 ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const dayData = localAvailability.find(
              (d) => d.dayOfWeek === key
            ) || { isAvailable: false, slots: [] };

            return (
              <Card
                key={key}
                className={cn(
                  "transition-all duration-300 border-2",
                  dayData.isAvailable
                    ? "border-gray-700 bg-gray-900 shadow-lg"
                    : "border-gray-800 bg-gray-900/30 opacity-60"
                )}
              >
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <Label
                    className={cn(
                      "text-lg font-bold",
                      dayData.isAvailable ? "text-white" : "text-gray-500"
                    )}
                  >
                    {label}
                  </Label>
                  <Switch
                    checked={dayData.isAvailable}
                    onCheckedChange={(checked) => handleDayToggle(key, checked)}
                  />
                </CardHeader>

                <AnimatePresence>
                  {dayData.isAvailable && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="space-y-3 pt-0">
                        {dayData.slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-gray-800/50"
                          >
                            <div className="relative flex-1">
                              <Input
                                type="time"
                                value={slot.start}
                                onChange={(e) =>
                                  handleSlotChange(
                                    key,
                                    idx,
                                    "start",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-center bg-gray-800 border-gray-700 text-xs font-mono p-0"
                              />
                            </div>
                            <span className="text-gray-500 text-xs">às</span>
                            <div className="relative flex-1">
                              <Input
                                type="time"
                                value={slot.end}
                                onChange={(e) =>
                                  handleSlotChange(
                                    key,
                                    idx,
                                    "end",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-center bg-gray-800 border-gray-700 text-xs font-mono p-0"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSlot(key, idx)}
                              className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-500/10 shrink-0"
                              disabled={dayData.slots.length === 1}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                      <CardFooter className="pt-0 pb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSlot(key)}
                          className="w-full border-dashed border border-gray-700 text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 h-8 text-xs transition-colors"
                        >
                          <Plus size={14} className="mr-1" /> Adicionar
                          Intervalo
                        </Button>
                      </CardFooter>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

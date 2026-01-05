import { useState, useEffect, useMemo } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useAvailabilityStore } from "../../store/availabilityStore";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  CalendarRange,
  Copy,
  MoreVertical,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
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
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

const DAYS_OF_WEEK: {
  key: DailyAvailability["dayOfWeek"];
  label: string;
  short: string;
}[] = [
  { key: "Monday", label: "Segunda-feira", short: "Seg" },
  { key: "Tuesday", label: "Terça-feira", short: "Ter" },
  { key: "Wednesday", label: "Quarta-feira", short: "Qua" },
  { key: "Thursday", label: "Quinta-feira", short: "Qui" },
  { key: "Friday", label: "Sexta-feira", short: "Sex" },
  { key: "Saturday", label: "Sábado", short: "Sáb" },
  { key: "Sunday", label: "Domingo", short: "Dom" },
];

export const AvailabilityManagement = () => {
  const { userProfile, professionals, updateUserProfile } = useProfileStore();
  const { availability, isLoading, fetchAvailability, updateAvailability } =
    useAvailabilityStore();
  const { showSuccess, showError } = useToast();

  const [localAvailability, setLocalAvailability] = useState<
    DailyAvailability[]
  >([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedProfId, setSelectedProfId] = useState<string>("");

  // Booking Window State
  const [bookingWindow, setBookingWindow] = useState<number>(30);
  const [isSavingWindow, setIsSavingWindow] = useState(false);

  const isOwner = userProfile?.role === "serviceProvider";

  // --- EFEITOS DE INICIALIZAÇÃO ---

  useEffect(() => {
    if (isOwner && userProfile) {
      const profile = userProfile as ServiceProviderProfile;
      setBookingWindow(profile.bookingWindowDays || 30);
    }
  }, [userProfile, isOwner]);

  const sortedProfessionals = useMemo(() => {
    if (!professionals) return [];
    return [...professionals].sort((a, b) => {
      if (a.isOwner) return -1;
      if (b.isOwner) return 1;
      return 0;
    });
  }, [professionals]);

  const currentProfessional = sortedProfessionals.find(
    (p) => p.id === selectedProfId
  );

  useEffect(() => {
    if (
      isOwner &&
      !selectedProfId &&
      sortedProfessionals.length > 0 &&
      userProfile?.id
    ) {
      const ownerProfile = sortedProfessionals.find((p) => p.isOwner);
      const targetId = ownerProfile
        ? ownerProfile.id
        : sortedProfessionals[0].id;
      setSelectedProfId(targetId);
      fetchAvailability(userProfile.id, targetId);
    }
  }, [
    isOwner,
    selectedProfId,
    sortedProfessionals,
    fetchAvailability,
    userProfile,
  ]);

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
      showError("Erro ao atualizar janela.");
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
        // Tenta inferir um horário inteligente baseado no último slot
        const lastSlot = day.slots[day.slots.length - 1];
        let newStart = "13:00";
        let newEnd = "17:00";

        if (lastSlot && lastSlot.end) {
          // Se o último termina 12:00, sugere começar 13:00
          const [h, m] = lastSlot.end.split(":").map(Number);
          const nextH = h + 1;
          if (nextH < 23) {
            newStart = `${String(nextH).padStart(2, "0")}:${String(m).padStart(
              2,
              "0"
            )}`;
            newEnd = `${String(nextH + 4).padStart(2, "0")}:${String(
              m
            ).padStart(2, "0")}`;
          }
        }

        return {
          ...day,
          slots: [...day.slots, { start: newStart, end: newEnd }],
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

  // 🔥 NOVO: Copiar para dias úteis (Seg-Sex)
  const copyToWeekdays = (sourceDayKey: string) => {
    const sourceDay = localAvailability.find(
      (d) => d.dayOfWeek === sourceDayKey
    );
    if (!sourceDay) return;

    setLocalAvailability((prev) =>
      prev.map((day) => {
        // Se for Sábado ou Domingo, ignora
        if (day.dayOfWeek === "Saturday" || day.dayOfWeek === "Sunday")
          return day;
        // Se for o próprio dia, ignora
        if (day.dayOfWeek === sourceDayKey) return day;

        return {
          ...day,
          isAvailable: sourceDay.isAvailable,
          slots: [...sourceDay.slots], // Deep copy dos slots
        };
      })
    );
    setHasChanges(true);
    showSuccess(
      `Horários de ${
        DAYS_OF_WEEK.find((d) => d.key === sourceDayKey)?.label
      } copiados para dias úteis!`
    );
  };

  // 🔥 NOVO: Copiar para TODOS os dias
  const copyToAll = (sourceDayKey: string) => {
    const sourceDay = localAvailability.find(
      (d) => d.dayOfWeek === sourceDayKey
    );
    if (!sourceDay) return;

    setLocalAvailability((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek === sourceDayKey) return day;
        return {
          ...day,
          isAvailable: sourceDay.isAvailable,
          slots: [...sourceDay.slots],
        };
      })
    );
    setHasChanges(true);
    showSuccess(
      `Horários de ${
        DAYS_OF_WEEK.find((d) => d.key === sourceDayKey)?.label
      } replicados para a semana toda!`
    );
  };

  const handleReset = () => {
    setLocalAvailability(availability);
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!selectedProfId || !userProfile?.id) return;

    // Validação simples antes de enviar
    const hasErrors = localAvailability.some(
      (day) =>
        day.isAvailable && day.slots.some((slot) => slot.start >= slot.end)
    );

    if (hasErrors) {
      showError(
        "Existem horários inválidos (Início maior que Fim). Corrija antes de salvar."
      );
      return;
    }

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
      {/* --- JANELA DE AGENDAMENTO --- */}
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
                Defina com quanta antecedência os clientes podem ver sua agenda.
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
                <span className="text-sm font-medium text-gray-500">dias</span>
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

      {/* --- SELETOR DE PROFISSIONAL E AÇÕES --- */}
      <div className="sticky top-4 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/90 backdrop-blur-md p-4 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Avatar className="h-14 w-14 border-2 border-primary">
            <AvatarImage src={photoUrl} className="object-cover" />
            <AvatarFallback className="bg-gray-800 font-bold text-gray-400">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">
              Editando Horários
            </p>
            {isOwner && sortedProfessionals.length > 0 ? (
              <div className="w-full md:w-64">
                <Select
                  value={selectedProfId}
                  onValueChange={handleProfessionalChange}
                >
                  <SelectTrigger className="bg-gray-950 border-gray-700 h-9 font-bold text-white">
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
              <h2 className="text-xl font-bold text-white">
                {currentProfessional?.name || "Carregando..."}
              </h2>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {hasChanges && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <RotateCcw size={18} className="mr-2" /> Descartar
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className={cn(
              "gap-2 font-bold px-6 h-10 transition-all shadow-lg flex-1 md:flex-none",
              hasChanges &&
                "shadow-primary/20 bg-primary text-black hover:bg-primary/90"
            )}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* --- GRID DE DIAS --- */}
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
                  "transition-all duration-300 border relative group",
                  dayData.isAvailable
                    ? "border-gray-700 bg-gray-900 shadow-md"
                    : "border-gray-800 bg-gray-900/30 opacity-70 hover:opacity-100"
                )}
              >
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={dayData.isAvailable}
                      onCheckedChange={(checked) =>
                        handleDayToggle(key, checked)
                      }
                    />
                    <div>
                      <Label
                        className={cn(
                          "text-base font-bold block cursor-pointer",
                          dayData.isAvailable ? "text-white" : "text-gray-500"
                        )}
                      >
                        {label}
                      </Label>
                      {!dayData.isAvailable && (
                        <span className="text-xs text-gray-600">Fechado</span>
                      )}
                      {/* Badge de Resumo quando ativo */}
                      {dayData.isAvailable && (
                        <div className="flex gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1 bg-gray-800 border-gray-700 text-gray-400 font-normal"
                          >
                            {dayData.slots.length} turnos
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MENU DE AÇÕES (Copiar) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-white"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-gray-900 border-gray-800 text-gray-200"
                    >
                      <DropdownMenuLabel>Ações para {label}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-800" />
                      <DropdownMenuItem
                        onClick={() => copyToWeekdays(key)}
                        className="gap-2 cursor-pointer focus:bg-gray-800"
                      >
                        <Copy size={14} /> Copiar para Dias Úteis
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => copyToAll(key)}
                        className="gap-2 cursor-pointer focus:bg-gray-800"
                      >
                        <Copy size={14} /> Copiar para Todos os Dias
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                        {dayData.slots.map((slot, idx) => {
                          const isInvalid = slot.start >= slot.end;
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "flex items-center gap-2 bg-black/20 p-2 rounded-lg border transition-colors",
                                isInvalid
                                  ? "border-red-500/50 bg-red-900/10"
                                  : "border-gray-800/50"
                              )}
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
                                  className="h-9 text-center bg-gray-800 border-gray-700 text-sm font-mono p-0 focus-visible:ring-1 focus-visible:ring-primary"
                                />
                              </div>
                              <span className="text-gray-500 text-xs font-medium">
                                até
                              </span>
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
                                  className={cn(
                                    "h-9 text-center bg-gray-800 border-gray-700 text-sm font-mono p-0 focus-visible:ring-1 focus-visible:ring-primary",
                                    isInvalid &&
                                      "text-red-400 border-red-500/30"
                                  )}
                                />
                              </div>

                              {isInvalid && (
                                <div
                                  className="text-red-500"
                                  title="Horário final deve ser maior que inicial"
                                >
                                  <AlertCircle size={16} />
                                </div>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSlot(key, idx)}
                                className="h-8 w-8 text-gray-600 hover:text-red-500 hover:bg-red-500/10 shrink-0 rounded-full"
                                disabled={dayData.slots.length === 1}
                                title="Remover intervalo"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          );
                        })}
                      </CardContent>
                      <CardFooter className="pt-0 pb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSlot(key)}
                          className="w-full border-dashed border border-gray-700 text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 h-9 text-xs transition-colors"
                        >
                          <Plus size={14} className="mr-1" /> Adicionar Turno
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

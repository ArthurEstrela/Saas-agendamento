import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../store/authStore";
import { useProfessionalsManagementStore } from "../../store/professionalsManagementStore";
import { useProviderProfileStore } from "../../store/providerProfileStore";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Copy,
  MoreVertical,
  RotateCcw,
  Settings,
  CalendarClock,
} from "lucide-react";
import { toast } from "react-hot-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

const DAYS_OF_WEEK: {
  key: DailyAvailability["dayOfWeek"];
  label: string;
}[] = [
  { key: "MONDAY", label: "Segunda-feira" },
  { key: "TUESDAY", label: "Terça-feira" },
  { key: "WEDNESDAY", label: "Quarta-feira" },
  { key: "THURSDAY", label: "Quinta-feira" },
  { key: "FRIDAY", label: "Sexta-feira" },
  { key: "SATURDAY", label: "Sábado" },
  { key: "SUNDAY", label: "Domingo" },
];

export const AvailabilityManagement = () => {
  const { user } = useAuthStore();
  const {
    professionals,
    updateAvailability,
    fetchProfessionals,
    loading: profLoading,
  } = useProfessionalsManagementStore();

  // Settings do estabelecimento (Janela de dias, intervalo de slots)
  const { updateProfile, loading: settingsLoading } = useProviderProfileStore();

  const [localAvailability, setLocalAvailability] = useState<
    DailyAvailability[]
  >([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedProfId, setSelectedProfId] = useState<string>("");

  // Estados de Configuração Global
  const [bookingWindow, setBookingWindow] = useState<number>(30);
  const [slotInterval, setSlotInterval] = useState<number>(15);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isOwner = user?.role?.toUpperCase() === "SERVICE_PROVIDER";

  // --- SINCRONIZAÇÃO DE CONFIGURAÇÕES ---
  useEffect(() => {
    if (isOwner && user) {
      const provider = user as ServiceProviderProfile;
      setBookingWindow(provider.bookingWindowDays || 30);
      setSlotInterval(provider.slotInterval || 15);
    }
  }, [user, isOwner]);

  useEffect(() => {
    if (user?.id && professionals.length === 0) {
      fetchProfessionals(user.id);
    }
  }, [user?.id, professionals.length, fetchProfessionals]);

  // --- SELEÇÃO DE PROFISSIONAL INTELIGENTE ---
  useEffect(() => {
    if (!user) return;

    if (!isOwner) {
      // Se for profissional, trava no próprio ID
      setSelectedProfId(user.id);
    } else if (!selectedProfId && professionals.length > 0) {
      // Se for dono e nada selecionado, pega o dono se houver, ou o primeiro
      const ownerProf = professionals.find((p) => p.id === user.id);
      setSelectedProfId(ownerProf ? ownerProf.id : professionals[0].id);
    }
  }, [user, isOwner, professionals, selectedProfId]);

  // --- CARREGAR DISPONIBILIDADE DO PROFISSIONAL SELECIONADO ---
  useEffect(() => {
    if (!selectedProfId) return;

    const prof = professionals.find((p) => p.id === selectedProfId);

    // Fallback: Mesmo se a API mandar vazio, construímos a semana padrão
    if (prof?.availability && prof.availability.length > 0) {
      setLocalAvailability(prof.availability);
    } else {
      setLocalAvailability(
        DAYS_OF_WEEK.map((d) => ({
          dayOfWeek: d.key,
          isAvailable: false,
          slots: [{ start: "09:00", end: "18:00" }],
        })),
      );
    }
    setHasChanges(false);
  }, [selectedProfId, professionals]);

  // --- AÇÕES DO DONO ---
  const handleSaveGlobalSettings = async () => {
    if (!user?.id) return;
    try {
      await updateProfile(user.id, {
        bookingWindowDays: bookingWindow,
        // ✨ Literal type para remover o "any"
        slotInterval: slotInterval as 15 | 30 | 45 | 60,
      });
      toast.success("Configurações da agenda atualizadas!");
      setIsSettingsOpen(false);
    } catch {
      // ✨ O erro já é tratado e exibe um toast dentro da função updateProfile no store
    }
  };

  // --- MANIPULAÇÃO DE HORÁRIOS ---
  const handleDayToggle = (dayKey: string, checked: boolean) => {
    setLocalAvailability((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayKey ? { ...day, isAvailable: checked } : day,
      ),
    );
    setHasChanges(true);
  };

  const handleSlotChange = (
    dayKey: string,
    index: number,
    field: keyof TimeSlot,
    value: string,
  ) => {
    setLocalAvailability((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayKey) return day;
        const newSlots = [...day.slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        return { ...day, slots: newSlots };
      }),
    );
    setHasChanges(true);
  };

  const addSlot = (dayKey: string) => {
    setLocalAvailability((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayKey) return day;
        const lastSlot = day.slots[day.slots.length - 1];

        // Lógica amigável: se terminar às 12:00, o novo começa às 13:00
        let newStart = "14:00";
        let newEnd = "18:00";

        if (lastSlot && lastSlot.end) {
          const [h, m] = lastSlot.end.split(":").map(Number);
          const nextH = h + 1;
          if (nextH < 23) {
            newStart = `${String(nextH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            newEnd = `${String(nextH + 4).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          }
        }

        return {
          ...day,
          slots: [...day.slots, { start: newStart, end: newEnd }],
        };
      }),
    );
    setHasChanges(true);
  };

  const removeSlot = (dayKey: string, index: number) => {
    setLocalAvailability((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayKey) return day;
        return { ...day, slots: day.slots.filter((_, i) => i !== index) };
      }),
    );
    setHasChanges(true);
  };

  // --- AÇÕES EM MASSA ---
  const copyToWeekdays = (sourceDayKey: string) => {
    const sourceDay = localAvailability.find(
      (d) => d.dayOfWeek === sourceDayKey,
    );
    if (!sourceDay) return;
    setLocalAvailability((prev) =>
      prev.map((day) => {
        if (
          day.dayOfWeek === "SATURDAY" ||
          day.dayOfWeek === "SUNDAY" ||
          day.dayOfWeek === sourceDayKey
        ) {
          return day;
        }
        return {
          ...day,
          isAvailable: sourceDay.isAvailable,
          slots: [...sourceDay.slots],
        };
      }),
    );
    setHasChanges(true);
    toast.success(`Copiado para dias úteis!`);
  };

  const copyToAll = (sourceDayKey: string) => {
    const sourceDay = localAvailability.find(
      (d) => d.dayOfWeek === sourceDayKey,
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
      }),
    );
    setHasChanges(true);
    toast.success(`Replicado para a semana toda!`);
  };

  const handleReset = () => {
    const prof = professionals.find((p) => p.id === selectedProfId);
    if (prof?.availability) {
      setLocalAvailability(prof.availability);
    }
    setHasChanges(false);
  };

  const handleSaveAvailability = async () => {
    if (!selectedProfId) return;

    const hasErrors = localAvailability.some(
      (d) => d.isAvailable && d.slots.some((s) => s.start >= s.end),
    );

    if (hasErrors) {
      toast.error("Existem horários de início maiores que o fim.");
      return;
    }

    try {
      await updateAvailability(selectedProfId, localAvailability);
      setHasChanges(false);
      toast.success("Disponibilidade salva com sucesso!");
    } catch {
      // ✨ Erro tratado silenciosamente, o store já cuida do feedback visual
    }
  };

  const currentProf = professionals.find((p) => p.id === selectedProfId);
  const displayName = currentProf?.name || user?.name || "Profissional";
  const displayPhoto =
    currentProf?.profilePictureUrl || user?.profilePictureUrl;
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  // Organiza profissionais para o dropdown colocando o dono (se houver) no topo
  const sortedProfessionals = useMemo(() => {
    return [...professionals].sort((a, b) => {
      // Assumindo que o profissional com o mesmo ID do user é o dono logado
      if (a.id === user?.id) return -1;
      if (b.id === user?.id) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [professionals, user]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 shadow-xl p-4 sticky top-4 z-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={displayPhoto} className="object-cover" />
              <AvatarFallback className="bg-gray-800 font-bold text-gray-400">
                {displayInitials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary mb-0.5 uppercase tracking-wider">
                Horários de Atendimento
              </p>
              {isOwner ? (
                <Select
                  value={selectedProfId}
                  onValueChange={setSelectedProfId}
                >
                  <SelectTrigger className="bg-transparent border-0 p-0 h-auto text-lg font-bold text-white focus:ring-0 w-auto gap-2">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {sortedProfessionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.id === user?.id && "(Você)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <h2 className="text-lg font-bold text-white truncate">
                  {displayName}
                </h2>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {isOwner && (
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-gray-800 border-gray-700 hover:text-white hover:bg-gray-700"
                  >
                    <Settings size={18} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-950 border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CalendarClock className="text-primary" /> Configurações
                      de Agenda
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Defina regras globais para os agendamentos online.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Janela de Agendamento (Dias)</Label>
                      <Input
                        type="number"
                        value={bookingWindow}
                        onChange={(e) =>
                          setBookingWindow(Number(e.target.value))
                        }
                        className="bg-gray-900 border-gray-700 focus:ring-primary"
                      />
                      <p className="text-xs text-gray-500">
                        Até quando os clientes podem ver horários livres.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Intervalo entre Slots</Label>
                      <Select
                        value={slotInterval.toString()}
                        onValueChange={(v) => setSlotInterval(Number(v))}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 focus:ring-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 text-white">
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="45">45 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Intervalo padrão entre cada horário disponível.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setIsSettingsOpen(false)}
                      className="text-gray-400"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveGlobalSettings}
                      disabled={settingsLoading}
                      className="bg-primary text-black font-bold"
                    >
                      {settingsLoading ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : null}
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {hasChanges && (
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3"
              >
                <RotateCcw size={18} className="md:mr-2" />
                <span className="hidden md:inline">Descartar</span>
              </Button>
            )}

            <Button
              onClick={handleSaveAvailability}
              disabled={!hasChanges || profLoading}
              className={cn(
                "gap-2 font-bold px-6 h-10 min-w-[140px]",
                hasChanges
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "bg-gray-800 text-gray-400",
              )}
            >
              {profLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {hasChanges ? "Salvar" : "Sem alterações"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {DAYS_OF_WEEK.map(({ key, label }) => {
          const dayData = localAvailability.find(
            (d) => d.dayOfWeek === key,
          ) || { isAvailable: false, slots: [] };
          return (
            <Card
              key={key}
              className={cn(
                "border bg-gray-900",
                !dayData.isAvailable && "opacity-60",
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-black/20">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={dayData.isAvailable}
                    onCheckedChange={(v) => handleDayToggle(key, v)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div>
                    <Label
                      className={cn(
                        "font-bold block cursor-pointer",
                        dayData.isAvailable ? "text-white" : "text-gray-500",
                      )}
                    >
                      {label}
                    </Label>
                    {dayData.isAvailable ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1 bg-gray-800 border-gray-700 text-gray-400 font-normal mt-1"
                      >
                        {dayData.slots.length} turnos
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-600 block mt-0.5">
                        Indisponível
                      </span>
                    )}
                  </div>
                </div>

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
                    <DropdownMenuLabel>Ações em Massa</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem
                      onClick={() => copyToWeekdays(key)}
                      className="gap-2 cursor-pointer focus:bg-gray-800"
                    >
                      <Copy size={14} /> Replicar em dias úteis
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => copyToAll(key)}
                      className="gap-2 cursor-pointer focus:bg-gray-800"
                    >
                      <Copy size={14} /> Replicar na semana toda
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
                    <CardContent className="space-y-3 pt-4">
                      {dayData.slots.map((slot, idx) => {
                        const isInvalid = slot.start >= slot.end;
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center gap-2 p-1.5 rounded-lg border transition-colors",
                              isInvalid
                                ? "border-red-500/50 bg-red-900/10"
                                : "border-gray-800 bg-gray-950/50",
                            )}
                          >
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) =>
                                handleSlotChange(
                                  key,
                                  idx,
                                  "start",
                                  e.target.value,
                                )
                              }
                              className="h-9 text-center bg-transparent border-transparent text-sm font-mono p-0 focus:ring-0 hover:bg-gray-800/50 rounded transition-colors"
                            />
                            <span className="text-gray-600 text-xs font-medium">
                              às
                            </span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) =>
                                handleSlotChange(
                                  key,
                                  idx,
                                  "end",
                                  e.target.value,
                                )
                              }
                              className={cn(
                                "h-9 text-center bg-transparent border-transparent text-sm font-mono p-0 focus:ring-0 hover:bg-gray-800/50 rounded transition-colors",
                                isInvalid && "text-red-400",
                              )}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSlot(key, idx)}
                              className="h-7 w-7 text-gray-600 hover:text-red-400 hover:bg-red-950/30 shrink-0 rounded-full"
                              disabled={dayData.slots.length === 1}
                            >
                              <Trash2 size={13} />
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
                        className="w-full border-dashed border border-gray-800 text-gray-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5 h-8 text-xs transition-all"
                      >
                        <Plus size={14} className="mr-1" /> Adicionar Intervalo
                      </Button>
                    </CardFooter>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

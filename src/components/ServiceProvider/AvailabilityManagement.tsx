import { useState, useEffect, useMemo } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useAvailabilityStore } from "../../store/availabilityStore";
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
import { useToast } from "../../hooks/useToast";
import type {
  DailyAvailability,
  TimeSlot,
  ServiceProviderProfile,
  ProfessionalProfile, // Importado para tipagem segura
  Professional,
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

  // Estados de Configuração Global (Dono)
  const [bookingWindow, setBookingWindow] = useState<number>(30);
  const [slotInterval, setSlotInterval] = useState<number>(15);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isOwner = userProfile?.role === "serviceProvider";

  // --- Helpers para ID de Provider ---
  // Função segura para pegar o ID do Dono (Provider)
  const getProviderId = () => {
    if (!userProfile) return null;
    if (isOwner) return userProfile.id;
    // Se for profissional, retorna o serviceProviderId vinculado
    return (userProfile as ProfessionalProfile).serviceProviderId;
  };

  // --- INICIALIZAÇÃO E DADOS DO PROFISSIONAL ---

  useEffect(() => {
    if (isOwner && userProfile) {
      const profile = userProfile as ServiceProviderProfile;
      setBookingWindow(profile.bookingWindowDays || 30);
      setSlotInterval(profile.slotInterval || 15);
    }
  }, [userProfile, isOwner]);

  const handleSaveGlobalSettings = async () => {
    if (!userProfile?.id) return;
    setIsSavingSettings(true);
    try {
      await updateUserProfile(userProfile.id, {
        bookingWindowDays: bookingWindow,
        slotInterval: slotInterval,
      });
      showSuccess("Configurações atualizadas!");
      setIsSettingsOpen(false);
    } catch (error) {
      showError("Erro ao salvar configurações.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const sortedProfessionals = useMemo(() => {
    if (!professionals) return [];
    return [...professionals].sort((a, b) => {
      if (a.isOwner) return -1;
      if (b.isOwner) return 1;
      return 0;
    });
  }, [professionals]);

  // Lógica Robusta para Identificar o Profissional Atual (Visualização)
  const currentProfessional = useMemo(() => {
    // 1. Tenta achar na lista de profissionais carregada
    const found = sortedProfessionals.find((p) => p.id === selectedProfId);
    if (found) return found;

    // 2. Se não achou e o ID selecionado é o do próprio usuário logado
    if (userProfile && userProfile.id === selectedProfId) {
      return {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        photoURL: userProfile.profilePictureUrl,
        role: userProfile.role,
        isOwner: isOwner,
      } as any; // Cast UI safe
    }
    return null;
  }, [selectedProfId, sortedProfessionals, userProfile, isOwner]);

  // Inicialização Inteligente da Seleção e Busca
  useEffect(() => {
    if (!userProfile?.id) return;

    // Se já temos um selecionado, não faz nada (evita loop)
    if (selectedProfId) return;

    const providerId = getProviderId();

    if (isOwner) {
      // CENÁRIO DONO: Seleciona o primeiro da lista ou ele mesmo
      if (sortedProfessionals.length > 0) {
        const ownerProfile = sortedProfessionals.find((p) => p.isOwner);
        const targetId = ownerProfile
          ? ownerProfile.id
          : sortedProfessionals[0].id;

        setSelectedProfId(targetId);
        if (providerId) fetchAvailability(providerId, targetId);
      } else {
        // Fallback: seleciona a si mesmo se a lista estiver vazia
        setSelectedProfId(userProfile.id);
        if (providerId) fetchAvailability(providerId, userProfile.id);
      }
    } else {
      // CENÁRIO PROFISSIONAL: Seleciona a si mesmo obrigatoriamente
      // Mas o ID do "resource" professional pode ser diferente do ID de usuário
      // Aqui assumimos que professionalId no perfil é o ID do documento, ou fallback para user.id
      const profUser = userProfile as ProfessionalProfile;
      const targetDocId = profUser.professionalId || profUser.id;

      setSelectedProfId(targetDocId);

      if (providerId) {
        fetchAvailability(providerId, targetDocId);
      }
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

  const handleProfessionalChange = (profId: string) => {
    const providerId = getProviderId();
    if (!providerId) return;

    setSelectedProfId(profId);
    setHasChanges(false);
    fetchAvailability(providerId, profId);
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
        const lastSlot = day.slots[day.slots.length - 1];
        let newStart = "13:00";
        let newEnd = "17:00";
        if (lastSlot && lastSlot.end) {
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

  const copyToWeekdays = (sourceDayKey: string) => {
    const sourceDay = localAvailability.find(
      (d) => d.dayOfWeek === sourceDayKey
    );
    if (!sourceDay) return;
    setLocalAvailability((prev) =>
      prev.map((day) => {
        if (
          day.dayOfWeek === "Saturday" ||
          day.dayOfWeek === "Sunday" ||
          day.dayOfWeek === sourceDayKey
        )
          return day;
        return {
          ...day,
          isAvailable: sourceDay.isAvailable,
          slots: [...sourceDay.slots],
        };
      })
    );
    setHasChanges(true);
    showSuccess(`Copiado para dias úteis!`);
  };

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
    showSuccess(`Replicado para a semana toda!`);
  };

  const handleReset = () => {
    setLocalAvailability(availability);
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!selectedProfId || !userProfile?.id) return;
    const providerId = getProviderId();

    if (!providerId) {
      showError("Erro: ID do provedor não encontrado.");
      return;
    }

    const hasErrors = localAvailability.some(
      (day) =>
        day.isAvailable && day.slots.some((slot) => slot.start >= slot.end)
    );

    if (hasErrors) {
      showError("Corrija os horários inválidos antes de salvar.");
      return;
    }

    try {
      await updateAvailability(providerId, selectedProfId, localAvailability);
      showSuccess("Horários salvos com sucesso!");
      setHasChanges(false);
    } catch (error) {
      showError("Erro ao salvar.");
    }
  };

  if (!userProfile)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  // Dados para UI seguros
  const displayName =
    currentProfessional?.name || userProfile.name || "Profissional";
  // Tenta photoURL (Professional) ou profilePictureUrl (UserProfile)
  const displayPhoto =
    currentProfessional?.photoURL ||
    (currentProfessional as any)?.profilePictureUrl ||
    userProfile.profilePictureUrl ||
    "";
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 pb-20">
      {/* --- HEADER UNIFICADO E LIMPO --- */}
      <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 shadow-xl p-4 sticky top-4 z-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Esquerda: Identificação do Profissional */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={displayPhoto} className="object-cover" />
              <AvatarFallback className="bg-gray-800 font-bold text-gray-400">
                {displayInitials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary mb-0.5 uppercase tracking-wider">
                Gerenciando Horários
              </p>

              {isOwner && sortedProfessionals.length > 0 ? (
                <div className="w-full md:w-64">
                  <Select
                    value={selectedProfId}
                    onValueChange={handleProfessionalChange}
                  >
                    <SelectTrigger className="bg-transparent border-0 p-0 h-auto text-lg font-bold text-white focus:ring-0 hover:text-gray-300 transition-colors w-auto gap-2">
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
                <h2 className="text-lg font-bold text-white truncate">
                  {displayName}
                </h2>
              )}
            </div>
          </div>

          {/* Direita: Ações e Configurações */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Botão de Settings (Só para Dono) - Agora em um Modal Limpo */}
            {isOwner && (
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
                  >
                    <Settings size={18} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-950 border-gray-800 text-white sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CalendarClock className="text-primary" /> Configurações
                      de Agenda
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Defina regras globais para os agendamentos online.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    <div className="space-y-3">
                      <Label className="text-white">
                        Janela de Agendamento
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={bookingWindow}
                          onChange={(e) =>
                            setBookingWindow(Number(e.target.value))
                          }
                          className="bg-gray-900 border-gray-700 text-white w-24"
                        />
                        <span className="text-sm text-gray-400">
                          dias de antecedência
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Até quando os clientes podem ver horários livres.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white">
                        Duração do Slot (Intervalo)
                      </Label>
                      <Select
                        value={slotInterval.toString()}
                        onValueChange={(v) => setSlotInterval(Number(v))}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-full">
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
                      disabled={isSavingSettings}
                      className="bg-primary text-black hover:bg-primary/90"
                    >
                      {isSavingSettings && (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      )}
                      Salvar Configurações
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Ações de Salvar/Descartar */}
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
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className={cn(
                "gap-2 font-bold px-6 h-10 transition-all shadow-lg min-w-[140px]",
                hasChanges
                  ? "shadow-primary/20 bg-primary text-black hover:bg-primary/90"
                  : "bg-gray-800 text-gray-400 cursor-not-allowed hover:bg-gray-800"
              )}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {hasChanges ? "Salvar" : "Sem alterações"}
            </Button>
          </div>
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
                  "transition-all duration-300 border relative group overflow-hidden",
                  dayData.isAvailable
                    ? "border-gray-700 bg-gray-900 shadow-md"
                    : "border-gray-800 bg-gray-900/30 opacity-60 hover:opacity-100"
                )}
              >
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 bg-black/20">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={dayData.isAvailable}
                      onCheckedChange={(checked) =>
                        handleDayToggle(key, checked)
                      }
                      className="data-[state=checked]:bg-primary"
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
                      {dayData.isAvailable ? (
                        <div className="flex gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1 bg-gray-800 border-gray-700 text-gray-400 font-normal"
                          >
                            {dayData.slots.length} turnos
                          </Badge>
                        </div>
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
                                  : "border-gray-800 bg-gray-950/50"
                              )}
                            >
                              <div className="relative flex-1 group/input">
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
                                  className="h-9 text-center bg-transparent border-transparent text-sm font-mono p-0 focus:ring-0 group-hover/input:bg-gray-800/50 rounded transition-colors"
                                />
                              </div>
                              <span className="text-gray-600 text-xs font-medium">
                                às
                              </span>
                              <div className="relative flex-1 group/input">
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
                                    "h-9 text-center bg-transparent border-transparent text-sm font-mono p-0 focus:ring-0 group-hover/input:bg-gray-800/50 rounded transition-colors",
                                    isInvalid && "text-red-400"
                                  )}
                                />
                              </div>
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

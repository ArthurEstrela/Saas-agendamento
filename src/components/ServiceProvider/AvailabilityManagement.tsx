import { useState, useEffect } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useAvailabilityStore } from "../../store/availabilityStore";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Clock,
  CalendarCheck,
  User,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import type { DailyAvailability, TimeSlot } from "../../types";

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
  const { userProfile, professionals } = useProfileStore();
  const { availability, isLoading, fetchAvailability, updateAvailability } =
    useAvailabilityStore();
  const { showSuccess, showError } = useToast();

  const [localAvailability, setLocalAvailability] = useState<
    DailyAvailability[]
  >([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedProfId, setSelectedProfId] = useState<string>("");

  const isOwner = userProfile?.role === "serviceProvider";

  // Identifica o profissional selecionado com segurança
  const currentProfessional = isOwner
    ? selectedProfId === userProfile?.id
      ? userProfile
      : professionals?.find((p) => p.id === selectedProfId)
    : userProfile;

  // Inicialização: Se for dono e não tiver ID, seleciona ele mesmo
  useEffect(() => {
    if (userProfile && !selectedProfId) {
      setSelectedProfId(userProfile.id);
      fetchAvailability(userProfile.id);
    }
  }, [userProfile, selectedProfId, fetchAvailability]);

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

  const handleProfessionalChange = (profId: string) => {
    setSelectedProfId(profId);
    setHasChanges(false);
    fetchAvailability(profId);
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
    if (!selectedProfId) return;
    try {
      await updateAvailability(selectedProfId, localAvailability);
      showSuccess("Horários atualizados com sucesso!");
      setHasChanges(false);
    } catch (error) {
      showError("Erro ao salvar horários.");
    }
  };

  // Se não houver perfil carregado, mostra loader
  if (!userProfile)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  // --- CORREÇÃO DO ERRO ---
  // Acessamos as propriedades com optional chaining (?.) para evitar o crash se currentProfessional for undefined/null
  const initials =
    currentProfessional?.name?.substring(0, 2).toUpperCase() || "US";
  const photoUrl =
    (currentProfessional as any)?.photoURL ||
    (currentProfessional as any)?.profilePictureUrl ||
    "";

  return (
    <div className="space-y-8 pb-20">
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

            {isOwner && professionals && professionals.length > 0 ? (
              <div className="w-full md:w-64">
                <Select
                  value={selectedProfId}
                  onValueChange={handleProfessionalChange}
                >
                  <SelectTrigger className="bg-gray-950 border-gray-700 h-10 text-lg font-bold text-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    <SelectItem value={userProfile.id} className="font-bold">
                      {userProfile.name} (Eu)
                    </SelectItem>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
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
            "gap-2 font-bold px-8 h-12 text-base transition-all shadow-lg",
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

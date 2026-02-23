import { useState, useEffect } from "react";
// Lemos o utilizador através do AuthStore
import { useAuthStore } from "../../../store/authStore";
import { useProfessionalsManagementStore } from "../../../store/professionalsManagementStore";
import { useServiceManagementStore } from "../../../store/serviceManagementStore";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";

import type {
  Service,
  ProfessionalProfile,
  ServiceProviderProfile,
} from "../../../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Switch } from "../../ui/switch";
import { toast } from "react-hot-toast";
import {
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  MessageSquare,
  Phone,
} from "lucide-react";
import { format, addMinutes } from "date-fns";
// Importamos o cliente da API para fazer a chamada que ainda não está no store (se necessário)
import { api } from "../../../lib/api";

interface ManualAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

export const ManualAppointmentModal = ({
  isOpen,
  onClose,
  defaultDate,
}: ManualAppointmentModalProps) => {
  // 🔥 Lemos dados separados dos seus stores corretos
  const { user } = useAuthStore();
  const provider = user as ServiceProviderProfile;
  const { professionals } = useProfessionalsManagementStore();
  const { services } = useServiceManagementStore();

  // No Spring Boot, nós atualizamos o store local após criar, ou mandamos re-fetch.
  const { fetchAppointments } = useProviderAppointmentsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isBlockMode, setIsBlockMode] = useState(false);

  // Form States
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedProfessionalId, setSelectedProfessionalId] =
    useState<string>("");

  // Data e Hora
  const [appointmentDate, setAppointmentDate] = useState(
    format(defaultDate || new Date(), "yyyy-MM-dd"),
  );
  const [startTime, setStartTime] = useState(
    format(defaultDate || new Date(), "HH:mm"),
  );
  const [duration, setDuration] = useState("30");

  // Resetar campos ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setClientName("");
      setClientPhone("");
      setNotes("");
      setIsBlockMode(false);
      setSelectedServiceId("");

      // Auto-seleciona o profissional se o usuário logado for um profissional
      if (user?.role?.toUpperCase() === "PROFESSIONAL") {
        setSelectedProfessionalId(user.id);
      } else {
        setSelectedProfessionalId("");
      }

      if (defaultDate) {
        setAppointmentDate(format(defaultDate, "yyyy-MM-dd"));
        setStartTime(format(defaultDate, "HH:mm"));
      }
    }
  }, [isOpen, defaultDate, user]);

  const handleSave = async () => {
    if (
      !selectedProfessionalId ||
      !startTime ||
      (!isBlockMode && !clientName)
    ) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    setIsLoading(true);
    try {
      // Combina a string de data (YYYY-MM-DD) com a de hora (HH:mm) para enviar ao backend
      const start = new Date(`${appointmentDate}T${startTime}:00`);
      const end = addMinutes(start, parseInt(duration));

      // ✨ Nova Lógica Baseada nos Endpoints do Spring Boot
      if (isBlockMode) {
        // Envia um BlockRequest
        await api.post("/professionals/block-time", {
          professionalId: selectedProfessionalId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reason: notes || clientName || "Bloqueio Manual",
        });
        toast.success("Agenda bloqueada!");
      } else {
        // Envia um CreateManualAppointmentRequest
        const selectedService = services.find(
          (s: Service) => s.id === selectedServiceId,
        );
        if (!selectedService) throw new Error("Serviço inválido");

        await api.post("/appointments/manual", {
          professionalId: selectedProfessionalId,
          clientName: clientName,
          clientPhone: clientPhone || null,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          notes: notes || "Agendamento via WhatsApp/Manual.",
          items: [
            {
              referenceId: selectedService.id,
              type: "SERVICE",
              quantity: 1,
            },
          ],
        });
        toast.success("Agendamento realizado!");
      }

      // Atualiza a vista por baixo (pedindo os dados de novo)
      const startDateStr = format(start, "yyyy-MM-dd"); // Exemplo simples
      await fetchAppointments(provider.id, startDateStr, startDateStr);

      onClose();
    } catch (err) {
      console.error("Erro ao salvar agendamento manual:", err);
      toast.error("Erro ao salvar. Verifique os dados e a disponibilidade.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-gray-900 border-gray-800 text-white max-h-[95vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isBlockMode ? (
              <Clock className="text-yellow-500" />
            ) : (
              <CalendarIcon className="text-primary" />
            )}
            {isBlockMode ? "Bloquear Horário" : "Novo Agendamento Manual"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Preencha os detalhes do {isBlockMode ? "bloqueio" : "cliente"}{" "}
            abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-3 border-y border-gray-800 my-2">
          <Switch
            id="block-mode"
            checked={isBlockMode}
            onCheckedChange={setIsBlockMode}
          />
          <Label
            htmlFor="block-mode"
            className="text-sm font-medium cursor-pointer"
          >
            Modo Bloqueio (Almoço, Particular, Indisponível)
          </Label>
        </div>

        <div className="grid gap-4 py-2">
          {/* Seleção de Data */}
          <div className="grid gap-2">
            <Label className="text-gray-300 flex items-center gap-2 italic text-xs">
              <CalendarIcon size={12} /> Data do Compromisso
            </Label>
            <Input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="bg-gray-800 border-gray-700 focus:ring-primary text-white scheme-dark"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-gray-300 text-xs italic">
                Hora de Início
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-gray-800 border-gray-700 focus:ring-primary text-white scheme-dark"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-gray-300 text-xs italic">
                Duração (minutos)
              </Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-gray-300">
              <User size={14} />{" "}
              {isBlockMode ? "Motivo do Bloqueio" : "Nome do Cliente"}
            </Label>
            <Input
              placeholder={
                isBlockMode
                  ? "Ex: Almoço / Médico"
                  : "Nome do cliente que chamou"
              }
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-gray-800 border-gray-700 focus:ring-primary"
            />
          </div>

          {!isBlockMode && (
            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-gray-300">
                <Phone size={14} /> WhatsApp do Cliente (opcional)
              </Label>
              <Input
                placeholder="(00) 00000-0000"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-gray-300 text-xs italic text-gray-500">
              Profissional Responsável
            </Label>
            <Select
              onValueChange={setSelectedProfessionalId}
              value={selectedProfessionalId}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white z-[60]">
                {professionals?.map((pro: ProfessionalProfile) => (
                  <SelectItem key={pro.id} value={pro.id}>
                    {pro.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isBlockMode && (
            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-gray-300">
                <Scissors size={14} /> Serviço
              </Label>
              <Select
                onValueChange={(val) => {
                  setSelectedServiceId(val);
                  const s = services.find((x: Service) => x.id === val);
                  if (s) setDuration(s.duration.toString());
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white z-[60]">
                  {services.map((s: Service) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-gray-300 text-xs italic">
              <MessageSquare size={14} /> Observações Internas
            </Label>
            <Textarea
              placeholder="Algum detalhe importante..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-gray-800 border-gray-700 resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary text-black font-bold hover:bg-primary/90"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

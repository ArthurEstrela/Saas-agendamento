import { useState, useEffect } from "react";
import { useProfileStore } from "../../../store/profileStore";
import { createManualAppointment } from "../../../firebase/bookingService";
import type {
  Service,
  Professional,
  Appointment,
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
} from "lucide-react";
import { format, addMinutes } from "date-fns";

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
  // ✅ CORREÇÃO: Buscando os dados da useProfileStore, onde as listas realmente residem
  const { userProfile, professionals } = useProfileStore();

  // ✅ CORREÇÃO: Services ficam dentro do objeto userProfile do prestador
  const provider = userProfile as ServiceProviderProfile;
  const services = provider?.services || [];

  const [isLoading, setIsLoading] = useState(false);
  const [isBlockMode, setIsBlockMode] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientPhone] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedProfessionalId, setSelectedProfessionalId] =
    useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState(
    format(defaultDate || new Date(), "yyyy-MM-dd"),
  );
  const [startTime, setStartTime] = useState(
    format(defaultDate || new Date(), "HH:mm"),
  );
  const [duration, setDuration] = useState("30");

  useEffect(() => {
    if (isOpen) {
      setClientName("");
      setIsBlockMode(false);
      if (defaultDate) {
        setAppointmentDate(format(defaultDate, "yyyy-MM-dd"));
        setStartTime(format(defaultDate, "HH:mm"));
      }
    }
  }, [isOpen, defaultDate]);

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
      const start = new Date(`${appointmentDate}T${startTime}`);
      const end = addMinutes(start, parseInt(duration));

      const selectedService = services.find(
        (s: Service) => s.id === selectedServiceId,
      );
      const selectedProfessional = professionals?.find(
        (p: Professional) => p.id === selectedProfessionalId,
      );

      const appointmentData: Omit<Appointment, "id"> = {
        providerId: provider.id,
        professionalId: selectedProfessionalId,
        professionalName: selectedProfessional?.name || "Profissional",
        clientId: "manual-entry",
        clientName: isBlockMode
          ? `BLOQUEIO: ${clientName || "Compromisso"}`
          : clientName,
        clientPhone: clientPhone || "",
        services: selectedService ? [selectedService] : [],
        serviceName: isBlockMode
          ? "Bloqueio de Agenda"
          : selectedService?.name || "Serviço Manual",
        startTime: start,
        endTime: end,
        status: "scheduled",
        totalPrice: selectedService?.price || 0,
        totalDuration: parseInt(duration),
        createdAt: new Date(),
        paymentMethod: "cash",
        notes: isBlockMode
          ? "Horário bloqueado manualmente."
          : "Agendamento manual via dashboard.",
      };

      await createManualAppointment(appointmentData);
      toast.success(
        isBlockMode ? "Agenda bloqueada!" : "Agendamento realizado!",
      );
      onClose();
    } catch (err: unknown) {
      // ✅ CORREÇÃO: Tratando o erro para evitar avisos de 'unused variable'
      console.error("Erro ao salvar:", err);
      toast.error("Erro ao salvar. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-gray-900 border-gray-800 text-white">
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
            Adicione um compromisso ou um cliente externo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4 border-y border-gray-800 my-2">
          <Switch
            id="block-mode"
            checked={isBlockMode}
            onCheckedChange={setIsBlockMode}
          />
          <Label htmlFor="block-mode" className="text-sm font-medium">
            Modo Bloqueio (Almoço, Médico, etc)
          </Label>
        </div>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-gray-300">
              <User size={14} /> {isBlockMode ? "Motivo" : "Nome do Cliente"}
            </Label>
            <Input
              placeholder={isBlockMode ? "Ex: Almoço" : "Nome completo"}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-gray-800 border-gray-700 focus:ring-primary"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-gray-300">Profissional</Label>
            <Select
              onValueChange={setSelectedProfessionalId}
              value={selectedProfessionalId}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {/* ✅ CORREÇÃO: profissionais vem da profileStore */}
                {professionals?.map((pro: Professional) => (
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
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {/* ✅ CORREÇÃO: services vem do userProfile */}
                  {services.map((s: Service) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-gray-300">Hora</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-gray-300">Duração (min)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-gray-400">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary text-black font-bold"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Salvar na Agenda"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

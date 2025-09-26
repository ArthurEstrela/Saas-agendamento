import { useState, useEffect } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useProfessionalsManagementStore } from "../../store/professionalsManagementStore";
// Importar ServiceProviderProfile para a narração de tipo
import type {
  Professional,
  DailyAvailability,
  TimeSlot,
  ServiceProviderProfile,
} from "../../types";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";

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

export const AvailabilityManagement = () => {
  // 1. CHAME TODOS OS HOOKS E SELECTORS NO TOPO (Regra do React)

  // Selectors individuais para garantir a estabilidade das referências (evita loop)
  const userProfile = useProfileStore((state) => state.userProfile);
  const professionalsState = useProfileStore((state) => state.professionals);

  // Hook para a função de salvar do novo Service
  const { updateProfessional } = useProfessionalsManagementStore();

  // Derivação de estado inicial para os hooks
  const professionals = professionalsState || [];
  // Garante que o ID inicial seja setado APENAS na montagem
  const initialProfId = professionals.length > 0 ? professionals[0].id : "";

  // Hooks de Estado Local (useState)
  const [selectedProfId, setSelectedProfId] = useState<string>(initialProfId);
  const [availability, setAvailability] = useState<DailyAvailability[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 2. USE EFFECTS (Chamados incondicionalmente, mesmo que o userProfile seja null inicialmente)

  // Efeito para garantir que o ID selecionado seja o primeiro da lista se a lista for carregada
  useEffect(() => {
    // A lista professionals (derivada de professionalsState) pode ser um novo array,
    // então precisamos desse efeito.
    if (
      professionals.length > 0 &&
      !professionals.some((p) => p.id === selectedProfId)
    ) {
      setSelectedProfId(professionals[0].id);
    }
  }, [professionals, selectedProfId]);

  // Efeito para sincronizar a disponibilidade com o profissional selecionado
  useEffect(() => {
    const selectedProfessional = professionals.find(
      (p) => p.id === selectedProfId
    );
    if (selectedProfessional) {
      // Garante que a lista de disponibilidade tenha sempre todos os dias da semana
      const fullWeekAvailability = weekDays.map((dayName) => {
        // Utiliza a disponibilidade salva ou o padrão
        return (
          selectedProfessional.availability?.find(
            (a) => a.dayOfWeek === dayName
          ) || { dayOfWeek: dayName, isAvailable: false, slots: [] }
        );
      });
      setAvailability(fullWeekAvailability);
    } else if (professionals.length > 0 && !selectedProfId) {
      // Se houver profissionais mas nenhum selecionado (pode ocorrer na montagem inicial)
      setSelectedProfId(professionals[0].id);
    }
  }, [selectedProfId, professionals]);

  // 3. LÓGICA CONDICIONAL E EARLY RETURN (DEPOIS DE TODOS OS HOOKS)

  if (!userProfile || userProfile.role !== "serviceProvider") {
    return null;
  }

  // Type Narrowing para o TS saber que userProfile é ServiceProviderProfile
  const providerProfile = userProfile as ServiceProviderProfile;

  // 4. Lógica de Carregamento e Estado Vazio
  if (professionalsState === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  if (professionals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-2xl p-8">
        <AlertTriangle size={48} className="mb-4 text-amber-500" />
        <h3 className="text-xl font-semibold text-gray-300">
          Nenhum profissional cadastrado
        </h3>
        <p className="text-center mt-2">
          Cadastre um profissional na seção "Meus Profissionais" para gerenciar
          a disponibilidade.
        </p>
      </div>
    );
  }

  // 5. Handlers (Permanecem a mesma lógica)

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

  const handleSlotChange = (
    day: DailyAvailability["dayOfWeek"],
    slotIndex: number,
    field: "start" | "end",
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

  // FUNÇÃO DE SALVAMENTO (usando a nova arquitetura)
  const handleSave = async () => {
    if (!selectedProfId) return;
    setIsSaving(true);

    const professionalToUpdate = professionals.find(
      (p) => p.id === selectedProfId
    );

    if (!professionalToUpdate) {
      setIsSaving(false);
      // showToast("Profissional não encontrado.", "error");
      return;
    }

    const updatedProfessional = {
      ...professionalToUpdate,
      availability: availability,
    };

    // Extrai o ID e photoURL para construir o payload esperado pelo service
    const { id, photoURL, ...payloadWithoutId } = updatedProfessional;

    const payload = {
      ...payloadWithoutId,
      photoURL: photoURL,
      photoFile: null,
    };

    try {
      await updateProfessional(providerProfile.id, selectedProfId, payload);
      // showToast("Disponibilidade salva com sucesso!", "success");
    } catch (error) {
      console.error("Falha ao salvar a disponibilidade:", error);
      // showToast("Falha ao salvar a disponibilidade.", "error");
    }

    setIsSaving(false);
  };

  // 6. Renderização
  return (
    <div className="animate-fade-in-down">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <Clock /> Gerenciar Disponibilidade
      </h1>
      <div className="mb-6">
        <label
          htmlFor="professional-select"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Selecione o Profissional
        </label>
        <select
          id="professional-select"
          onChange={(e) => setSelectedProfId(e.target.value)}
          value={selectedProfId}
          className="w-full max-w-xs primary-button-inverted bg-gray-900 p-3 rounded-md border border-gray-700 appearance-none"
        >
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProfId && (
        <div className="space-y-6">
          {availability.map((day) => (
            <div
              key={day.dayOfWeek}
              className="bg-gray-800/70 p-4 rounded-xl border border-gray-700 transition hover:border-amber-500/50"
            >
              <div className="flex items-center justify-between">
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
              {day.isAvailable && (
                <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-700">
                  {day.slots.map((slot, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">De:</span>
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
                          className="bg-gray-900 p-2 rounded-md border border-gray-600 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">Até:</span>
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
                          className="bg-gray-900 p-2 rounded-md border border-gray-600 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveSlot(day.dayOfWeek, i)}
                        className="text-gray-500 hover:text-red-400 p-2 rounded-full hover:bg-red-900/50 transition"
                        title="Remover Intervalo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddSlot(day.dayOfWeek)}
                    className="flex items-center gap-2 text-sm text-amber-500 hover:text-yellow-300 mt-2 p-1 rounded-md transition"
                  >
                    <Plus size={16} /> Adicionar intervalo
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving || !selectedProfId}
              className="bg-amber-500 text-black font-semibold px-6 py-3 rounded-lg hover:bg-amber-600 transition flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              {isSaving ? "Salvando..." : "Salvar Disponibilidade"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

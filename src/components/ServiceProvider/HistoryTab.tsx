import { useState, useMemo } from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, CheckCircle, XCircle } from "lucide-react";
import type { EnrichedProviderAppointment } from "../../store/providerAppointmentsStore";

// 1. Definição do novo tipo para o filtro de status
type HistoryFilterStatus = "all" | "completed" | "cancelled";

const HistoryCard = ({ appt }: { appt: EnrichedProviderAppointment }) => (
  // ... (O conteúdo de HistoryCard permanece inalterado)
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <p className="font-bold text-white">{appt.client?.name}</p>
      <p className="text-sm text-gray-400">
        {appt.services.map((s) => s.name).join(", ")}
      </p>
      <p className="text-xs text-gray-500">com {appt.professionalName}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-semibold text-gray-300">
        {format(appt.startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </p>
      {appt.status === "completed" ? (
        <span className="flex items-center justify-end gap-2 text-green-400 text-sm mt-1">
          <CheckCircle size={16} /> Concluído
        </span>
      ) : (
        <span className="flex items-center justify-end gap-2 text-red-400 text-sm mt-1">
          <XCircle size={16} /> Cancelado
        </span>
      )}
    </div>
  </div>
);

export const HistoryTab = ({
  appointments,
}: {
  appointments: EnrichedProviderAppointment[];
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  // 2. Usando o tipo no useState
  const [statusFilter, setStatusFilter] = useState<HistoryFilterStatus>("all");

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => {
        const clientName = appt.client?.name?.toLowerCase() || "";
        return clientName.includes(searchTerm.toLowerCase());
      })
      .filter((appt) => {
        if (statusFilter === "all") return true;
        return appt.status === statusFilter;
      })
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [appointments, searchTerm, statusFilter]);

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-xl font-bold">Histórico de Agendamentos</h2>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Filtro por status */}
          <select
            value={statusFilter}
            // 3. CORREÇÃO: Usando Type Assertion para o tipo correto (HistoryFilterStatus)
            onChange={(e) =>
              setStatusFilter(e.target.value as HistoryFilterStatus)
            }
            className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-[#daa520] focus:outline-none"
          >
            <option value="all">Todos Status</option>
            <option value="completed">Concluídos</option>
            <option value="cancelled">Cancelados</option>
          </select>

          {/* Barra de Busca */}
          <div className="relative flex-grow">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 pl-10 text-white focus:ring-2 focus:ring-[#daa520] focus:outline-none"
            />
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appt) => (
            <HistoryCard key={appt.id} appt={appt} />
          ))
        ) : (
          <p className="text-center text-gray-500 mt-16">
            Nenhum agendamento encontrado no histórico.
          </p>
        )}
      </div>
    </div>
  );
};

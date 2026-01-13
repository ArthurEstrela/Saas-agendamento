import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
} from "lucide-react";
import type { EnrichedProviderAppointment } from "../../store/providerAppointmentsStore";
import type { Appointment } from "../../types";

// UI Components
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";

type HistoryFilterStatus = "all" | "completed" | "cancelled";

const ITEMS_PER_PAGE = 10;

const HistoryCard = ({
  appt,
  onClick,
}: {
  appt: EnrichedProviderAppointment;
  onClick: () => void;
}) => {
  // ✅ LÓGICA CORRIGIDA: Prioriza o nome salvo no agendamento (blindagem)
  const clientName = appt.clientName || appt.client?.name || "Cliente desconhecido";

  return (
    <Card
      onClick={onClick}
      className="group hover:border-primary/40 transition-all cursor-pointer bg-gray-900/40 border-gray-800"
    >
      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User size={16} className="text-primary" />
            <p className="font-bold text-gray-200 group-hover:text-primary transition-colors">
              {clientName}
            </p>
          </div>
          <p className="text-sm text-gray-400 pl-6">
            {appt.services.map((s) => s.name).join(", ")}
          </p>
          <p className="text-xs text-gray-500 pl-6 mt-0.5">
            com {appt.professionalName}
          </p>
        </div>

        <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end gap-2 sm:gap-1 border-t sm:border-none border-gray-800 pt-3 sm:pt-0">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
            <Calendar size={14} className="text-gray-500" />
            {format(appt.startTime, "dd MMM, HH:mm", { locale: ptBR })}
          </div>

          {appt.status === "completed" ? (
            <Badge
              variant="success"
              className="gap-1.5 bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
            >
              <CheckCircle size={12} /> Concluído
            </Badge>
          ) : (
            <Badge
              variant="destructive"
              className="gap-1.5 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
            >
              <XCircle size={12} /> Cancelado
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface HistoryTabProps {
  appointments: EnrichedProviderAppointment[];
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const HistoryTab = ({
  appointments,
  onAppointmentSelect,
}: HistoryTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<HistoryFilterStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => {
        // ✅ BUSCA CORRIGIDA: Usa a mesma lógica do card para filtrar
        const nameToSearch = appt.clientName || appt.client?.name || "";
        return nameToSearch.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .filter((appt) =>
        statusFilter === "all" ? true : appt.status === statusFilter
      )
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [appointments, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAppointments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAppointments, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-800/50">
        <h2 className="text-xl font-bold text-white whitespace-nowrap">
          Histórico{" "}
          <span className="text-sm font-normal text-gray-500 hidden sm:inline">
            (Últimos 30 dias)
          </span>
        </h2>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="w-full sm:w-40">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as HistoryFilterStatus)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
            />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700 h-10"
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3 min-h-[300px]">
        {paginatedAppointments.length > 0 ? (
          paginatedAppointments.map((appt) => (
            <HistoryCard
              key={appt.id}
              appt={appt}
              onClick={() => onAppointmentSelect(appt)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={48} className="text-gray-700 mb-4" />
            <p className="text-gray-500">Nenhum agendamento encontrado.</p>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4 border-t border-gray-800/50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="h-9 w-9"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-medium text-gray-400">
            {currentPage} <span className="text-gray-600">/</span> {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="h-9 w-9"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};
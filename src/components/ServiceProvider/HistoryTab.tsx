// src/components/ServiceProvider/HistoryTab.tsx

import { useState, useMemo, useEffect } from 'react' // 1. ADICIONADO useEffect
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search,
  CheckCircle,
  XCircle,
  ChevronLeft, // 2. IMPORTADO
  ChevronRight, // 2. IMPORTADO
} from 'lucide-react'
import { Button } from '../ui/button' // 3. IMPORTADO
import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore'

type HistoryFilterStatus = 'all' | 'completed' | 'cancelled'

// 4. ITENS POR PÁGINA
const ITEMS_PER_PAGE = 10

const HistoryCard = ({ appt }: { appt: EnrichedProviderAppointment }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    {/* ... (O conteúdo do Card permanece o mesmo) ... */}
    <div>
      <p className="font-bold text-white">{appt.client?.name}</p>
      <p className="text-sm text-gray-400">
        {appt.services.map((s) => s.name).join(', ')}
      </p>
      <p className="text-xs text-gray-500">com {appt.professionalName}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-semibold text-gray-300">
        {format(appt.startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </p>
      {appt.status === 'completed' ? (
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
)

export const HistoryTab = ({
  appointments,
}: {
  appointments: EnrichedProviderAppointment[]
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<HistoryFilterStatus>('all')
  const [currentPage, setCurrentPage] = useState(1) // 5. ESTADO DE PÁGINA

  // 6. Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // 7. useMemo para APENAS filtrar e ordenar
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => {
        const clientName = appt.client?.name?.toLowerCase() || ''
        return clientName.includes(searchTerm.toLowerCase())
      })
      .filter((appt) => {
        if (statusFilter === 'all') return true
        return appt.status === statusFilter
      })
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  }, [appointments, searchTerm, statusFilter])

  // 8. Cálculo de paginação
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE)

  // 9. useMemo para PAGINAR os resultados já filtrados
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredAppointments.slice(startIndex, endIndex)
  }, [filteredAppointments, currentPage])

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        {/* ... (O header com filtros permanece o mesmo) ... */}
        <h2 className="text-xl font-bold text-white">
          Histórico (Últimos 30 dias)
        </h2>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Filtro por status */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as HistoryFilterStatus)
            }
            className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
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
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 pl-10 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* 10. Renderização dos itens PAGINADOS */}
      <div className="space-y-4">
        {paginatedAppointments.length > 0 ? (
          paginatedAppointments.map((appt) => (
            <HistoryCard key={appt.id} appt={appt} />
          ))
        ) : (
          <p className="text-center text-gray-500 mt-16">
            {searchTerm || statusFilter !== 'all'
              ? 'Nenhum agendamento encontrado para esta busca.'
              : 'Nenhum agendamento encontrado no histórico dos últimos 30 dias.'}
          </p>
        )}
      </div>

      {/* 11. CONTROLES DE PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-gray-300">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
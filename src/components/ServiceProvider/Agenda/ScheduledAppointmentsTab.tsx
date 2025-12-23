// src/components/ServiceProvider/Agenda/ScheduledAppointmentsTab.tsx

import { useState, useMemo } from 'react' // 1. IMPORTAMOS HOOKS
import type { EnrichedProviderAppointment } from '../../../store/providerAppointmentsStore'
import type { Appointment } from '../../../types'
import { ScheduledAppointmentCard } from './ScheduledAppointmentCard'
import { Button } from '../../ui/button' // 2. IMPORTAMOS O BOTÃO
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react' // 3. IMPORTAMOS ÍCONES
import { isToday, isFuture } from 'date-fns'

// 4. DEFINIMOS QUANTOS CARDS POR PÁGINA (ex: 9 para uma grade de 3 colunas)
const ITEMS_PER_PAGE = 9

interface ScheduledAppointmentsTabProps {
  appointments: EnrichedProviderAppointment[]
  onAppointmentSelect: (appointment: Appointment) => void
}

export const ScheduledAppointmentsTab = ({
  appointments,
  onAppointmentSelect,
}: ScheduledAppointmentsTabProps) => {
  // --- Lógica de separação (HOJE vs FUTURO) ---
  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => isToday(a.startTime))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()) // Ordena tbm
  }, [appointments])

  const futureAppointments = useMemo(() => {
    return appointments
      .filter((a) => isFuture(a.startTime) && !isToday(a.startTime))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()) // Ordena tbm
  }, [appointments])

  // --- 5. LÓGICA DE PAGINAÇÃO (APENAS PARA OS FUTUROS) ---
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(futureAppointments.length / ITEMS_PER_PAGE)

  // "Fatia" o array de futuros para mostrar só os da página atual
  const paginatedFutureAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return futureAppointments.slice(startIndex, endIndex)
  }, [futureAppointments, currentPage])

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-amber-400">
        Agendamentos Confirmados
      </h2>

      {/* --- Agendamentos de Hoje (Sem paginação) --- */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Hoje</h3>
        {todayAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAppointments.map((appt) => (
              <ScheduledAppointmentCard
                key={appt.id}
                appointment={appt}
                onAppointmentSelect={onAppointmentSelect}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Nenhum agendamento para hoje.
          </p>
        )}
      </section>

      {/* --- 6. Agendamentos Futuros (COM PAGINAÇÃO) --- */}
      {futureAppointments.length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Próximos Dias ({futureAppointments.length} no total)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Renderiza apenas os itens da página atual */}
            {paginatedFutureAppointments.map((appt) => (
              <ScheduledAppointmentCard
                key={appt.id}
                appointment={appt}
                onAppointmentSelect={onAppointmentSelect}
              />
            ))}
          </div>

          {/* --- 7. CONTROLES DE PAGINAÇÃO --- */}
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
        </section>
      )}

      {/* --- Mensagem de "Nenhum Agendamento" --- */}
      {todayAppointments.length === 0 && futureAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center text-gray-600 mt-16">
          <CalendarCheck size={48} />
          <p className="mt-4 font-semibold">Nenhum agendamento confirmado</p>
          <p className="text-sm">
            Nenhum agendamento encontrado nos próximos 30 dias.
          </p>
        </div>
      )}
    </div>
  )
}
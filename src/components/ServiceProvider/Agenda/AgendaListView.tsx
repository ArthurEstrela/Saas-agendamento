// src/components/ServiceProvider/Agenda/AgendaListView.tsx

import { useState, useMemo, useEffect } from 'react' // 1. IMPORTADO
import type { EnrichedProviderAppointment } from '../../../store/providerAppointmentsStore'
import type { Appointment } from '../../../types'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  Clock,
  User,
  Scissors,
  DollarSign,
  ChevronLeft, // 2. IMPORTADO
  ChevronRight, // 2. IMPORTADO
} from 'lucide-react'
import { Button } from '../../ui/button' // 3. IMPORTADO
import { cn } from '../../../lib/utils/cn'

// 4. ITENS POR PÁGINA
const ITEMS_PER_PAGE = 10

const AppointmentRow = ({
  appointment,
  onClick,
}: {
  appointment: EnrichedProviderAppointment
  onClick: () => void
}) => {
  const isPending = appointment.status === 'pending'
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800/50 hover:border-amber-500/20 transition-all duration-200 cursor-pointer',
        isPending &&
          'border-l-4 border-l-amber-500 bg-amber-900/10 hover:border-amber-500/40',
      )}
    >
      {/* ... (O conteúdo do Row permanece o mesmo) ... */}
      <div className="flex flex-col items-center justify-center text-center w-24 flex-shrink-0">
        <p className="font-bold text-lg text-white">
          {format(appointment.startTime, 'HH:mm')}
        </p>
        <p className="text-xs text-gray-400">
          às {format(appointment.endTime, 'HH:mm')}
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <Clock size={12} />
          <span>{appointment.totalDuration} min</span>
        </div>
        {isPending && (
          <span className="mt-2 text-xs font-semibold text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-full">
            Pendente
          </span>
        )}
      </div>
      <div className="w-px bg-gray-700 h-12"></div>
      <div className="flex-grow">
        <p className="font-semibold text-white truncate flex items-center gap-2">
          <Scissors size={14} className="text-amber-400" />
          {appointment.services.map((s) => s.name).join(', ')}
        </p>
        <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
          <User size={14} />
          {appointment.client?.name}
        </p>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className="font-bold text-amber-500 text-lg flex items-center gap-1">
          <DollarSign size={16} />
          {appointment.totalPrice.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {appointment.professionalName}
        </p>
      </div>
    </motion.li>
  )
}

export const AgendaListView = ({
  appointments,
  onAppointmentSelect,
}: {
  appointments: EnrichedProviderAppointment[]
  onAppointmentSelect: (appointment: Appointment) => void
}) => {
  const [currentPage, setCurrentPage] = useState(1) // 5. ESTADO DE PÁGINA

  // 6. Resetar página se a lista de agendamentos (prop) mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [appointments])
  
  // 7. Cálculo de paginação
  const totalPages = Math.ceil(appointments.length / ITEMS_PER_PAGE)

  // 8. useMemo para PAGINAR os resultados
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return appointments.slice(startIndex, endIndex)
  }, [appointments, currentPage])

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  // 9. A verificação de "vazio" deve ser feita aqui,
  //    pois o AgendaView não sabe se a lista está vazia
  if (appointments.length === 0) {
    return (
       <p className="text-center text-gray-500 mt-16">
         Nenhum agendamento encontrado nos próximos 30 dias.
       </p>
    )
  }

  return (
    // 10. Wrapper div para a lista + paginação
    <div>
      <ul className="space-y-3">
        {/* 11. Renderiza os itens PAGINADOS */}
        {paginatedAppointments.map((appt) => (
          <AppointmentRow
            key={appt.id}
            appointment={appt}
            onClick={() => onAppointmentSelect(appt)}
          />
        ))}
      </ul>

      {/* 12. CONTROLES DE PAGINAÇÃO */}
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
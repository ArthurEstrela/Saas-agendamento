// src/components/ServiceProvider/AgendaListView.tsx
import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { groupBy } from 'lodash';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

const formatDateHeading = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
};

export const AgendaListView = ({ appointments }: { appointments: EnrichedProviderAppointment[] }) => {
  const groupedByDay = groupBy(appointments, appt => format(startOfDay(appt.startTime), 'yyyy-MM-dd'));

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center text-gray-600">
        <Users size={48} />
        <p className="mt-4 font-semibold">Nenhum agendamento encontrado</p>
        <p className="text-sm">Tente ajustar os filtros ou aproveite o dia livre!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedByDay).map(([day, dayAppointments], index) => (
        <motion.div
          key={day}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <h3 className="font-bold text-lg text-amber-400 mb-4 sticky top-0 bg-black/80 backdrop-blur-sm py-2">
            {formatDateHeading(day)}
          </h3>
          <ul className="space-y-3">
            {dayAppointments.map(appt => (
              <li key={appt.id} className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
                <div className="text-center w-16 flex-shrink-0">
                  <p className="font-bold text-lg text-white">{format(appt.startTime, 'HH:mm')}</p>
                  <p className="text-xs text-gray-400">às {format(appt.endTime, 'HH:mm')}</p>
                </div>
                <div className="w-px bg-gray-700 h-10"></div>
                <div className="flex-grow">
                  <p className="font-semibold text-white truncate">{appt.services.map(s => s.name).join(', ')}</p>
                  <p className="text-sm text-gray-400">{appt.client?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-500">R$ {appt.totalPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{appt.professionalName}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
};
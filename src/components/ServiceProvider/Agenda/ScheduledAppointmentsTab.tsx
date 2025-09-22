// src/components/ServiceProvider/Agenda/ScheduledAppointmentsTab.tsx
import type { EnrichedProviderAppointment } from '../../../store/providerAppointmentsStore';
import { ScheduledAppointmentCard } from './ScheduledAppointmentCard';
import { CalendarCheck } from 'lucide-react';
import { isToday, isFuture, startOfDay } from 'date-fns';

export const ScheduledAppointmentsTab = ({ appointments }: { appointments: EnrichedProviderAppointment[] }) => {
  const todayStart = startOfDay(new Date());

  const todayAppointments = appointments.filter(a => isToday(a.startTime));
  const futureAppointments = appointments.filter(a => isFuture(a.startTime) && !isToday(a.startTime));
  
  return (
    <div>
        <h2 className="text-xl font-bold mb-6 text-amber-400">Agendamentos Confirmados</h2>

        {/* Agendamentos de Hoje */}
        <section>
             <h3 className="text-lg font-semibold text-white mb-4">Hoje</h3>
            {todayAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todayAppointments.map(appt => <ScheduledAppointmentCard key={appt.id} appointment={appt} />)}
                </div>
            ) : (
                <p className="text-gray-500 text-sm">Nenhum agendamento para hoje.</p>
            )}
        </section>

        {/* Agendamentos Futuros */}
        {futureAppointments.length > 0 && (
            <section className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Próximos Dias</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {futureAppointments.map(appt => <ScheduledAppointmentCard key={appt.id} appointment={appt} />)}
                </div>
            </section>
        )}

        {todayAppointments.length === 0 && futureAppointments.length === 0 && (
             <div className="flex flex-col items-center justify-center text-center text-gray-600 mt-16">
                <CalendarCheck size={48} />
                <p className="mt-4 font-semibold">Nenhum agendamento confirmado</p>
                <p className="text-sm">Aguarde novas solicitações ou veja seu histórico.</p>
            </div>
        )}
    </div>
  );
};
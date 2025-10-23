// src/components/ServiceProvider/Agenda/ScheduledAppointmentsTab.tsx
import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
// ****** 1. IMPORTAMOS O TIPO 'Appointment' ******
import type { Appointment } from "../../../types"; 
import { ScheduledAppointmentCard } from "./ScheduledAppointmentCard";
import { CalendarCheck } from "lucide-react";
import { isToday, isFuture, startOfDay } from "date-fns";

// ****** 2. ATUALIZAMOS AS PROPS ******
interface ScheduledAppointmentsTabProps {
  appointments: EnrichedProviderAppointment[];
  onAppointmentSelect: (appointment: Appointment) => void; // <-- ADICIONADO
}

export const ScheduledAppointmentsTab = ({ 
  appointments, 
  onAppointmentSelect // <-- ADICIONADO
}: ScheduledAppointmentsTabProps) => { // <-- ATUALIZADO
  
  const todayStart = startOfDay(new Date());

  const todayAppointments = appointments.filter((a) => isToday(a.startTime));
  const futureAppointments = appointments.filter(
    (a) => isFuture(a.startTime) && !isToday(a.startTime)
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-amber-400">
        Agendamentos Confirmados
      </h2>

      {/* Agendamentos de Hoje */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Hoje</h3>
        {todayAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAppointments.map((appt) => (
              // ****** 3. PASSAMOS A PROP PARA O CARD ******
              <ScheduledAppointmentCard
                key={appt.id}
                appointment={appt}
                onAppointmentSelect={onAppointmentSelect} // <-- ADICIONADO
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nenhum agendamento para hoje.</p>
        )}
      </section>

      {/* Agendamentos Futuros */}
      {futureAppointments.length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Próximos Dias
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {futureAppointments.map((appt) => (
              // ****** 4. PASSAMOS A PROP PARA O CARD ******
              <ScheduledAppointmentCard
                key={appt.id}
                appointment={appt}
                onAppointmentSelect={onAppointmentSelect} // <-- ADICIONADO
              />
            ))}
          </div>
        </section>
      )}

      {todayAppointments.length === 0 && futureAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center text-gray-600 mt-16">
          <CalendarCheck size={48} />
          <p className="mt-4 font-semibold">Nenhum agendamento confirmado</p>
          <p className="text-sm">
            Novos agendamentos confirmados aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
};
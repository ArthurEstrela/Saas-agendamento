// 1. REMOVEMOS 'useState'
import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
// 2. REMOVEMOS 'useProviderAppointmentsStore'
// 3. Importamos o tipo Appointment padrão
import type { Appointment } from "../../../types"; 
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Scissors, CheckCircle } from "lucide-react"; // Removemos User, Calendar
import { motion } from "framer-motion";
// 4. REMOVEMOS 'ServiceCompletionModal'

interface CardProps {
  appointment: EnrichedProviderAppointment;
  // 5. ADICIONAMOS 'onAppointmentSelect'
  onAppointmentSelect: (appointment: Appointment) => void; 
}

export const ScheduledAppointmentCard = ({ 
  appointment, 
  onAppointmentSelect // <-- Recebemos a prop
}: CardProps) => {
  // 6. REMOVEMOS 'completeAppointment', 'isCompletionModalOpen', 'handleConfirmCompletion'
  
  // A lógica de UI para destacar o card pode ser mantida
  const isServiceTimePast = isPast(appointment.endTime);

  return (
    // 7. REMOVEMOS o fragment (<>) que envolvia o modal
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      // 8. ADICIONAMOS o onClick e o cursor-pointer
      onClick={() => onAppointmentSelect(appointment)}
      className={`bg-gray-800/50 border border-gray-700 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:border-amber-500/50 ${
        isServiceTimePast ? "border-amber-500/30" : "hover:border-gray-600" // Ajuste sutil no hover
      }`}
    >
      {/* ... (Seu JSX de Header e Detalhes - 100% INTACTO) ... */}
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-white">{appointment.client?.name}</p>
          <p className="text-sm text-gray-400">
            com {appointment.professionalName}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-white">
            {format(appointment.startTime, "HH:mm")}
          </p>
          <p className="text-xs text-gray-500">
            {format(appointment.startTime, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-700 my-3"></div>

      <div className="space-y-2 text-sm text-gray-300">
        <p className="flex items-start gap-2">
          <Scissors size={16} className="text-amber-400 mt-0.5" />
          <span>{appointment.services.map((s) => s.name).join(", ")}</span>
        </p>
        <p className="flex items-center gap-2">
          <Clock size={16} className="text-amber-400" />
          <span>Duração: {appointment.totalDuration} min</span>
        </p>
      </div>

      {/* 9. REMOVEMOS O BOTÃO "CONCLUIR SERVIÇO" */}
      {/* Agora, a única ação é clicar no card. */}
      
      {/* (Opcional) Podemos manter um indicador visual sutil */}
      {isServiceTimePast && (
        <div className="mt-4 pt-3 border-t border-gray-700/50">
           <p className="text-xs text-amber-400/80 flex items-center justify-center gap-1.5">
             <CheckCircle size={14} />
             Horário finalizado. Clique para ver detalhes e concluir.
           </p>
         </div>
      )}
      
      {/* 10. REMOVEMOS a renderização do <ServiceCompletionModal /> */}
    </motion.div>
  );
};
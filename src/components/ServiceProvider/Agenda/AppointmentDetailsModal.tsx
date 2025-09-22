// src/components/ServiceProvider/Agenda/AppointmentDetailsModal.tsx (NOVO)

import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  Phone,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const AppointmentDetailsModal = () => {
  const { selectedAppointment, setSelectedAppointment } =
    useProviderAppointmentsStore();

  if (!selectedAppointment) {
    return null;
  }

  const { client, services, startTime, endTime, professionalName, totalPrice } =
    selectedAppointment;

  const closeModal = () => setSelectedAppointment(null);

  return (
    <AnimatePresence>
      {selectedAppointment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg text-white shadow-xl"
            onClick={(e) => e.stopPropagation()} // Evita que o modal feche ao clicar dentro dele
          >
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-xl font-bold">Detalhes do Agendamento</h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </header>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-amber-500" />
                <span className="font-semibold">
                  {format(startTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-amber-500" />
                <span className="font-semibold">{`${format(
                  startTime,
                  "HH:mm"
                )} - ${format(endTime, "HH:mm")}`}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="text-amber-500" />
                <span className="font-semibold">{client?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-amber-500" />
                <a href={`tel:${client?.phone}`} className="hover:underline">
                  {client?.phone}
                </a>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-800">
                <p className="font-bold mb-2">Serviços:</p>
                <ul className="space-y-2">
                  {services.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>{s.name}</span>
                      <span className="text-gray-400">
                        R$ {s.price.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-800">
                <p className="text-lg font-bold">Total:</p>
                <p className="text-2xl font-bold text-amber-500">
                  R$ {totalPrice.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Footer - Ações */}
            <footer className="p-4 bg-gray-900/50 flex gap-3">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                Marcar como Concluído
              </button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                <XCircle size={18} />
                Cancelar
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

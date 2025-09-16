// Em: src/components/ServiceProvider/AgendaView.tsx
import { useState, useEffect, useMemo } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useProviderAppointmentsStore } from "../../store/providerAppointmentsStore";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { isSameDay, format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { AppointmentRequestCard } from "./AppointmentRequestCard";
import { AppointmentCard } from "./AppointmentCard"; // Reutilizaremos o AppointmentCard
import { Loader2, Users, CalendarDays, Inbox, ChevronDown } from "lucide-react";
import type { ServiceProviderProfile } from "../../types";

export const AgendaView = () => {
  const { userProfile } = useProfileStore();
  const {
    appointments,
    isLoading,
    fetchAppointments,
    selectedProfessionalId,
    setSelectedProfessionalId,
    updateStatus,
  } = useProviderAppointmentsStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const provider = userProfile as ServiceProviderProfile;

  useEffect(() => {
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]);

  const { pending, confirmedOnDate } = useMemo(() => {
    const pending = appointments
      .filter((a) => a.status === "pending")
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const filteredByProf =
      selectedProfessionalId === "all"
        ? appointments
        : appointments.filter(
            (a) => a.professionalId === selectedProfessionalId
          );

    const confirmedOnDate = filteredByProf
      .filter(
        (a) => a.status === "scheduled" && isSameDay(a.startTime, selectedDate)
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return { pending, confirmedOnDate };
  }, [appointments, selectedDate, selectedProfessionalId]);

  const selectedProfessional = useMemo(() => {
    if (selectedProfessionalId === "all") {
      return null; // Retorna nulo se "Todos" estiver selecionado
    }
    return provider?.professionals?.find(
      (p) => p.id === selectedProfessionalId
    );
  }, [provider?.professionals, selectedProfessionalId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#daa520]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col lg:flex-row gap-8"
    >
      {/* Coluna de Solicitações Pendentes */}
      <aside className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <Inbox size={24} className="text-[#daa520]" /> Novas Solicitações
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 h-[75vh] overflow-y-auto">
          <AnimatePresence>
            {pending.length > 0 ? (
              pending.map((appt) => (
                <AppointmentRequestCard
                  key={appt.id}
                  appointment={appt}
                  onAccept={updateStatus}
                  onReject={updateStatus}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center text-gray-500"
              >
                <Inbox size={48} />
                <p className="mt-4 font-semibold">Caixa de entrada limpa!</p>
                <p className="text-sm">Nenhuma nova solicitação no momento.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Agenda Principal */}
      <main className="flex-grow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <CalendarDays size={24} className="text-[#daa520]" /> Agenda
          </h2>
          {/* 👇 COLE ESTE CÓDIGO NO LUGAR DO BLOCO ANTIGO 👇 */}

          {/* NOVO SELETOR DE PROFISSIONAIS ESTILO DROPDOWN */}
          <div className="relative mt-4 sm:mt-0 w-full sm:w-64 z-10">
            {/* Botão que mostra a seleção atual e abre/fecha a lista */}
            <button
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              onBlur={() => setTimeout(() => setIsSelectorOpen(false), 100)} // Fecha ao clicar fora com um pequeno delay
              className="flex items-center justify-between w-full p-2 bg-gray-900 rounded-md border border-gray-700 text-white"
            >
              <span className="flex items-center gap-3">
                {selectedProfessional ? (
                  <img
                    src={
                      selectedProfessional.photoURL ||
                      `https://ui-avatars.com/api/?name=${selectedProfessional.name.replace(
                        /\s/g,
                        "+"
                      )}`
                    }
                    alt={selectedProfessional.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full">
                    <Users className="w-5 h-5 text-gray-400" />
                  </span>
                )}
                <span className="font-semibold">
                  {selectedProfessional?.name || "Todos os Profissionais"}
                </span>
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isSelectorOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* A lista de opções que aparece e desaparece */}
            <AnimatePresence>
              {isSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
                >
                  <ul className="max-h-60 overflow-y-auto">
                    {/* Opção "Todos" */}
                    <li
                      onMouseDown={() => {
                        // Usamos onMouseDown para executar antes do onBlur do botão
                        setSelectedProfessionalId("all");
                        setIsSelectorOpen(false);
                      }}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-700"
                    >
                      <span className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full">
                        <Users className="w-5 h-5 text-gray-400" />
                      </span>
                      <span className="font-semibold text-gray-200">
                        Todos os Profissionais
                      </span>
                    </li>

                    {/* Opções dos profissionais */}
                    {provider?.professionals?.map((p) => (
                      <li
                        key={p.id}
                        onMouseDown={() => {
                          setSelectedProfessionalId(p.id);
                          setIsSelectorOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-700"
                      >
                        <img
                          src={
                            p.photoURL ||
                            `https://ui-avatars.com/api/?name=${p.name.replace(
                              /\s/g,
                              "+"
                            )}`
                          }
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-semibold text-gray-200">
                          {p.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 bg-gray-800/50 border border-gray-700 rounded-2xl p-2 sm:p-4 flex justify-center">
            <DayPicker
              mode="single"
              locale={ptBR}
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="w-full" // Garante que ele ocupe o espaço
              classNames={{
                // Containers
                root: "w-full text-white",
                month: "space-y-4 w-full",
                table: "w-full border-collapse",

                // Navegação (Mês e setas)
                caption:
                  "flex justify-between items-center pb-4 mb-4 border-b border-gray-700",
                caption_label: "text-lg font-bold text-gray-100",
                nav: "flex items-center gap-1",
                nav_button:
                  "h-9 w-9 flex items-center justify-center p-0 rounded-lg hover:bg-gray-700 transition-colors",

                // Cabeçalho (Dom, Seg, Ter...)
                head_row: "flex w-full",
                head_cell: "w-full text-gray-400 font-semibold text-sm pb-2",

                // Corpo (Dias)
                row: "flex w-full mt-2",
                cell: "w-full flex items-center justify-center",

                // Estilo de cada dia (botão)
                day: "h-10 w-10 text-center text-base p-0 rounded-lg transition-all hover:bg-gray-700 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900",
                day_selected:
                  "bg-amber-400 text-gray-900 font-bold hover:bg-amber-500 hover:text-gray-900",
                day_today: "font-bold text-amber-400 ring-1 ring-amber-400",
                day_outside: "text-gray-600",
                day_disabled: "text-gray-600 opacity-50",
              }}
            />
          </div>

          <div className="xl:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-4">
              Agendamentos para{" "}
              <span className="text-[#daa520]">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </h3>
            <div className="space-y-4 h-[65vh] overflow-y-auto pr-2">
              <AnimatePresence>
                {confirmedOnDate.length > 0 ? (
                  confirmedOnDate.map((appt) => (
                    <AppointmentCard key={appt.id} appointment={appt} />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center text-gray-500"
                  >
                    <Users size={48} />
                    <p className="mt-4 font-semibold">
                      Nenhum horário confirmado
                    </p>
                    <p className="text-sm">
                      Não há agendamentos para este dia ou profissional.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

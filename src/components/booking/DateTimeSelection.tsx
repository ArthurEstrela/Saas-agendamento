import { useState, useEffect } from "react";
import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import "../../Calendar.css"; // Nosso CSS personalizado
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Clock, Loader2 } from "lucide-react";

// Função de exemplo para gerar horários. No mundo real, isso viria do backend.
const generateTimeSlots = (): string[] => {
  const slots = [];
  for (let i = 9; i <= 18; i++) {
    slots.push(`${i.toString().padStart(2, "0")}:00`);
    if (i < 18) slots.push(`${i.toString().padStart(2, "0")}:30`);
  }
  return slots;
};

export const DateTimeSelection = () => {
  const {
    date: selectedDate,
    timeSlot: selectedTime,
    selectDateTime,
    goToNextStep,
    goToPreviousStep,
  } = useBookingProcessStore();

  const [date, setDate] = useState<Date | undefined>(
    selectedDate || new Date()
  );
  const [timeSlot, setTimeSlot] = useState<string | null>(selectedTime);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  useEffect(() => {
    if (date) {
      setIsLoadingTimes(true);
      setTimeout(() => {
        // Simula busca de horários
        setAvailableTimes(generateTimeSlots());
        setIsLoadingTimes(false);
      }, 500);
    }
  }, [date]);

  const handleConfirm = () => {
    if (date && timeSlot) {
      selectDateTime(date, timeSlot);
      goToNextStep();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-3xl font-bold text-center text-white mb-8">
        Escolha a Data e Hora
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto bg-black/30 p-8 rounded-2xl">
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
            fromDate={new Date()}
            className="text-white"
          />
        </div>

        <div className="flex flex-col">
          <h3 className="text-xl font-semibold text-[#daa520] mb-4 flex items-center gap-2">
            <Clock size={20} /> Horários para{" "}
            {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : "..."}
          </h3>
          {isLoadingTimes ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-64 pr-2">
              {availableTimes.map((slot) => {
                const isSelected = timeSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setTimeSlot(slot)}
                    className={`p-3 rounded-lg font-semibold transition-all duration-200
                                        ${
                                          isSelected
                                            ? "bg-[#daa520] text-gray-900"
                                            : "bg-gray-700 text-white hover:bg-gray-600"
                                        }
                                    `}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-center items-center gap-4 mt-8">
        <button onClick={goToPreviousStep} className="secondary-button">
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!date || !timeSlot}
          className="primary-button w-48"
        >
          Avançar
        </button>
      </div>
    </motion.div>
  );
};

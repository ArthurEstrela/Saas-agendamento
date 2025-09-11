import { useEffect } from 'react';
import { useBookingProcessStore } from '../../store/bookingProcessStore';
import { useAvailabilityStore } from '../../store/availabilityStore';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';

export const DateTimeSelection = () => {
  const { 
    selectDate, 
    selectTimeSlot, 
    date: selectedDate, 
    timeSlot: selectedTimeSlot, 
    professional, 
    service, 
    goToPreviousStep, 
    goToNextStep 
  } = useBookingProcessStore();
  
  const { availableSlots, isLoading, error, fetchAvailableSlots } = useAvailabilityStore();

  // Busca os horários disponíveis sempre que a data, o profissional ou o serviço mudam
  useEffect(() => {
    if (selectedDate && professional && service) {
      fetchAvailableSlots(professional, service, selectedDate);
    }
  }, [selectedDate, professional, service, fetchAvailableSlots]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      selectDate(date);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">3. Escolha a Data e Hora</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <h3 className="font-semibold mb-2">Selecione o Dia</h3>
          <DayPicker
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleDateChange}
            locale={ptBR}
            fromDate={new Date()} // Desabilita dias passados
            className="border rounded-md p-2 bg-white"
            styles={{
              head_cell: { width: '40px' },
              caption: { color: '#daa520' },
              day_selected: { backgroundColor: '#daa520', color: 'black' },
            }}
          />
        </div>
        <div className="flex flex-col items-center">
          <h3 className="font-semibold mb-2">Horários Disponíveis</h3>
          <div className="w-full h-64 overflow-y-auto border rounded-md p-2 grid grid-cols-3 gap-2 content-start">
            {isLoading && <p className="col-span-3 text-center text-gray-500">Buscando horários...</p>}
            {error && <p className="col-span-3 text-center text-red-500">{error}</p>}
            {!isLoading && !error && availableSlots.length === 0 && (
              <p className="col-span-3 text-center text-gray-500">Nenhum horário vago para este dia.</p>
            )}
            {!isLoading && !error && availableSlots.map(time => (
              <button
                key={time}
                onClick={() => selectTimeSlot(time)}
                className={`p-2 rounded-md border text-center transition-colors ${
                  selectedTimeSlot === time 
                  ? 'bg-[#daa520] text-black font-semibold'
                  : 'bg-gray-100 hover:border-[#daa520]'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-8">
        <button onClick={goToPreviousStep} className="text-sm text-gray-600 hover:text-black flex items-center gap-2">
          <ArrowLeft size={16} />
          Voltar
        </button>
        <button
          onClick={goToNextStep}
          disabled={!selectedDate || !selectedTimeSlot}
          className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Avançar
        </button>
      </div>
    </div>
  );
};
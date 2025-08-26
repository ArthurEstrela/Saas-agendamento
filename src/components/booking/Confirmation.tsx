import React, { useState, useCallback } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import type { UserProfile, Appointment } from '../../types';
import { Loader2, CheckCircle } from 'lucide-react';

interface ConfirmationProps {
  establishment: UserProfile;
}

const Confirmation = ({ establishment }: ConfirmationProps) => {
  // Pega os dados do agendamento do bookingStore
  const {
    selectedServices,
    selectedProfessional,
    selectedDate,
    selectedTime,
    totalPrice,
    totalDuration,
  } = useBookingStore();

  // Pega os dados do usuário e o perfil do authStore
  const { user, userProfile } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isBooking, setIsBooking] = useState(false);

  const handleBookAppointment = useCallback(async () => {
    // Validação para garantir que todos os dados necessários estão presentes
    if (!user || !userProfile) {
      showToast("Por favor, faça login para completar o agendamento.", "info");
      // Idealmente, redirecionar para o login guardando o estado
      navigate('/login');
      return;
    }

    if (!selectedProfessional || selectedServices.length === 0 || !selectedTime || !selectedDate || Array.isArray(selectedDate)) {
      showToast("Faltam informações para o agendamento. Por favor, volte e verifique.", "error");
      return;
    }

    setIsBooking(true);
    try {
      const startTime = new Date(`${selectedDate.toISOString().split("T")[0]}T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + totalDuration * 60000);

      const newAppointmentData: Omit<Appointment, "id"> = {
        clientId: user.uid,
        serviceProviderId: establishment.uid,
        professionalId: selectedProfessional.id,
        serviceIds: selectedServices.map((s) => s.id),
        date: selectedDate.toISOString().split("T")[0],
        startTime: selectedTime,
        endTime: endTime.toTimeString().substring(0, 5),
        status: "scheduled",
        createdAt: Timestamp.now(),
        price: totalPrice,
        serviceName: selectedServices.map((s) => s.name).join(", "),
        professionalName: selectedProfessional.name,
        clientName: userProfile.displayName || user.displayName || "Cliente",
        duration: totalDuration,
      };

      await addDoc(collection(db, "appointments"), newAppointmentData);
      showToast("Agendamento realizado com sucesso!", "success");
      navigate("/booking", { state: { view: "myAppointments" }, replace: true });

    } catch (error) {
      console.error("Erro ao agendar:", error);
      showToast("Ocorreu um erro ao confirmar o agendamento.", "error");
    } finally {
      setIsBooking(false);
    }
  }, [user, userProfile, selectedProfessional, selectedServices, selectedDate, selectedTime, totalDuration, totalPrice, establishment.uid, navigate, showToast]);


  if (!selectedProfessional || selectedServices.length === 0 || !selectedDate || Array.isArray(selectedDate) || !selectedTime) {
    return (
        <div className="text-center text-gray-400 py-8">
            <p>Por favor, preencha as etapas anteriores para ver o resumo.</p>
        </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-white mb-6">4. Confirmar Agendamento</h2>
      <div className="bg-gray-800 p-6 rounded-xl border border-[#daa520]">
        <h3 className="text-xl font-bold text-white mb-4">Detalhes do Agendamento</h3>
        <div className="space-y-3 text-gray-300">
          <div className="flex justify-between"><span>Estabelecimento:</span><span className="font-semibold text-white">{establishment.companyName}</span></div>
          <div className="flex justify-between"><span>Profissional:</span><span className="font-semibold text-white">{selectedProfessional.name}</span></div>
          <div className="flex justify-between"><span>Data:</span><span className="font-semibold text-white">{(selectedDate as Date).toLocaleDateString("pt-BR")}</span></div>
          <div className="flex justify-between"><span>Horário:</span><span className="font-semibold text-white">{selectedTime}</span></div>
          <div className="border-t border-gray-700 pt-3">
            <span className="font-semibold text-white">Serviços:</span>
            <ul className="list-disc list-inside mt-2 text-sm space-y-1">
              {selectedServices.map(s => <li key={s.id}>{s.name}</li>)}
            </ul>
          </div>
          <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-xl">
            <span className="text-[#daa520]">Total:</span>
            <span className="text-[#daa520]">R$ {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleBookAppointment}
          disabled={isBooking}
          className="bg-[#daa520] hover:bg-[#c8961e] text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-500"
        >
          {isBooking ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          {isBooking ? "A Agendar..." : "Confirmar e Agendar"}
        </button>
      </div>
    </div>
  );
};

export default Confirmation;

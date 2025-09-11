import { useState } from 'react';
import { useBookingProcessStore } from '../../store/bookingProcessStore';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

export const Confirmation = () => {
  const { service, professional, date, timeSlot, goToPreviousStep, confirmBooking } = useBookingProcessStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    const result = await confirmBooking();
    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || "Ocorreu um erro ao confirmar.");
    }
    setIsLoading(false);
  };
  
  if (isSuccess) {
    return (
      <div className="text-center animate-fade-in p-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Agendamento Enviado!</h2>
        <p className="text-gray-600 mt-2">
          Sua solicitação foi enviada. Você receberá uma notificação assim que for confirmada pelo profissional.
        </p>
      </div>
    );
  }

  // Se o usuário não está logado, ele é redirecionado para a página de login.
  // O 'state' da localização guarda a página atual para que possamos voltar depois.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">4. Confirme seu Agendamento</h2>
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div>
          <p className="text-sm text-gray-500">Serviço</p>
          <p className="font-semibold text-lg">{service?.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Profissional</p>
          <p className="font-semibold">{professional?.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Data e Hora</p>
          <p className="font-semibold">{date?.toLocaleDateString('pt-BR')} às {timeSlot}</p>
        </div>
      </div>

      {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mt-4 flex items-center gap-2">
            <AlertTriangle size={18} /> {error}
          </div>
      )}

      <div className="flex justify-between items-center mt-8">
        <button onClick={goToPreviousStep} className="text-sm text-gray-600 hover:text-black flex items-center gap-2">
          <ArrowLeft size={16} />
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
        >
          {isLoading ? 'Confirmando...' : 'Confirmar Agendamento'}
        </button>
      </div>
    </div>
  );
};
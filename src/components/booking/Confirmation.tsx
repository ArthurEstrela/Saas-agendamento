import { useBookingProcessStore } from '../../store/bookingProcessStore';
import { useProfileStore } from '../../store/profileStore';
import { Loader2, Calendar, Clock, User, Scissors, DollarSign, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const Confirmation = () => {
    const {
        provider,
        service: selectedService,
        professional: selectedProfessional,
        date: selectedDate,
        timeSlot: selectedTime,
        isBooking,
        bookingSuccess,
        bookingError,
        confirmBooking,
        goToPreviousStep
    } = useBookingProcessStore();

    const { userProfile } = useProfileStore();

    if (!provider || !selectedService || !selectedProfessional || !selectedDate || !selectedTime || !userProfile) {
        return <p className="text-center text-red-400">Dados do agendamento incompletos. Por favor, volte e tente novamente.</p>;
    }
    
    const handleConfirm = () => {
        const startTime = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        startTime.setHours(hours, minutes, 0, 0);

        const appointmentData = {
            providerId: provider.id,
            clientId: userProfile.id,
            clientName: userProfile.name,
            professionalId: selectedProfessional.id,
            professionalName: selectedProfessional.name,
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            startTime,
            endTime: new Date(startTime.getTime() + selectedService.duration * 60000),
            status: 'pending' as const
        };
        confirmBooking(appointmentData);
    };

    if (bookingSuccess) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-lg mx-auto bg-black/30 p-8 rounded-2xl">
                <CheckCircle size={64} className="mx-auto text-green-400 mb-6"/>
                <h2 className="text-3xl font-bold text-white">Agendamento Solicitado!</h2>
                <p className="text-gray-300 mt-4">
                    Seu horário foi enviado para o estabelecimento. Você será notificado sobre a confirmação.
                </p>
                <Link to="/dashboard" className="primary-button mt-8">
                    Ver Meus Agendamentos
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-bold text-center text-white mb-8">Confirme seu Agendamento</h2>
            <div className="max-w-lg mx-auto bg-black/30 p-8 rounded-2xl space-y-6">
                <div>
                    <h3 className="text-xl font-semibold text-amber-400 border-b border-gray-700 pb-3 mb-3">Resumo do Agendamento</h3>
                    <div className="space-y-4 text-lg">
                        <p className="flex items-center gap-3"><Scissors className="text-gray-400" size={20}/> <span className="font-semibold">{selectedService.name}</span></p>
                        <p className="flex items-center gap-3"><User className="text-gray-400" size={20}/> Com <span className="font-semibold">{selectedProfessional.name}</span></p>
                        <p className="flex items-center gap-3"><Calendar className="text-gray-400" size={20}/> Dia <span className="font-semibold">{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span></p>
                        <p className="flex items-center gap-3"><Clock className="text-gray-400" size={20}/> Às <span className="font-semibold">{selectedTime}</span></p>
                        <p className="flex items-center gap-3"><DollarSign className="text-gray-400" size={20}/> Valor <span className="font-semibold">R$ {selectedService.price.toFixed(2).replace('.', ',')}</span></p>
                    </div>
                </div>
            </div>
             {bookingError && <p className="error-message text-center mt-4">{bookingError}</p>}
            <div className="flex justify-center items-center gap-4 mt-8">
                <button onClick={goToPreviousStep} className="secondary-button" disabled={isBooking}>Voltar</button>
                <button onClick={handleConfirm} disabled={isBooking} className="primary-button w-56 flex justify-center">
                    {isBooking ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
                </button>
            </div>
        </motion.div>
    );
};
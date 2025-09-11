import type { Appointment } from '../../types';
import { useUserAppointmentsStore } from '../../store/userAppointmentsStore';
import { FaCalendar, FaClock, FaUserTie, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaStar } from 'react-icons/fa';

interface ClientAppointmentCardProps {
  appointment: Appointment;
}

const getStatusChip = (status: Appointment['status']) => {
    const baseClasses = "text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full";
    const statusMap = {
        pending: <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}><FaHourglassHalf className="inline mr-1"/>Pendente</span>,
        scheduled: <span className={`${baseClasses} bg-green-100 text-green-800`}><FaCheckCircle className="inline mr-1"/>Confirmado</span>,
        completed: <span className={`${baseClasses} bg-blue-100 text-blue-800`}><FaCheckCircle className="inline mr-1"/>Concluído</span>,
        cancelled: <span className={`${baseClasses} bg-red-100 text-red-800`}><FaTimesCircle className="inline mr-1"/>Cancelado</span>,
    };
    return statusMap[status] || null;
}

export const ClientAppointmentCard = ({ appointment }: ClientAppointmentCardProps) => {
  const { cancelAppointment } = useUserAppointmentsStore();
//   const [isReviewModalOpen, setReviewModalOpen] = useState(false);

  const canCancel = appointment.status === 'pending' || appointment.status === 'scheduled';
  const canReview = appointment.status === 'completed' && !appointment.review;

  return (
    <>
    <div className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-800">{appointment.serviceName}</h3>
            {getStatusChip(appointment.status)}
        </div>
        <div className="text-sm text-gray-500 space-y-2">
            <p><FaCalendar className="inline mr-2" />{new Date(appointment.startTime).toLocaleDateString('pt-BR')}</p>
            <p><FaClock className="inline mr-2" />{`${new Date(appointment.startTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - ${new Date(appointment.endTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`}</p>
            <p><FaUserTie className="inline mr-2" />{appointment.professionalName}</p>
        </div>
      </div>
      <div className="mt-4 flex space-x-2">
        {canCancel && (
            <button 
                onClick={() => window.confirm('Tem certeza que deseja cancelar?') && cancelAppointment(appointment.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded transition-colors"
            >
                Cancelar
            </button>
        )}
        {canReview && (
            <button
                // onClick={() => setReviewModalOpen(true)}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-2 px-4 rounded transition-colors"
            >
                <FaStar className="inline mr-1" /> Avaliar
            </button>
        )}
      </div>
    </div>
    {/* {isReviewModalOpen && <ReviewModal appointmentId={appointment.id} onClose={() => setReviewModalOpen(false)} />} */}
    </>
  );
};
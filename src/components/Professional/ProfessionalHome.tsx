// src/components/Professional/ProfessionalHome.tsx

import { useMemo } from "react";
import { useProviderAppointmentsStore } from "../../store/providerAppointmentsStore";
import type { ProfessionalProfile } from "../../types";
import { 
  TrendingUp, 
  Users, 
  Star, 
  CalendarClock, 
  CheckCircle2,
  DollarSign,
  Clock,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isSameDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FaWhatsapp } from "react-icons/fa"; // Certifique-se de ter: npm install react-icons

interface ProfessionalHomeProps {
  userProfile: ProfessionalProfile;
}

export const ProfessionalHome = ({ userProfile }: ProfessionalHomeProps) => {
  const { appointments } = useProviderAppointmentsStore();

  // --- Lógica dos Lembretes (WhatsApp) ---
  const tomorrowAppointments = useMemo(() => {
    const tomorrow = addDays(new Date(), 1);
    
    return appointments
      .filter((app) => 
        app.professionalId === userProfile.professionalId &&
        app.status === 'scheduled' && 
        isSameDay(new Date(app.startTime), tomorrow)
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [appointments, userProfile.professionalId]);

  const generateWhatsAppLink = (appointment: any) => {
    // Tenta pegar o telefone. Assumindo que o objeto appointment ou o clientProfile tenha isso.
    // Nota: Se o 'clientPhone' ainda não existir no tipo Appointment, ele buscará undefined.
    const phone = appointment.clientPhone || ""; 
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone) return null;

    const time = format(new Date(appointment.startTime), "HH:mm");
    const message = `Olá ${appointment.clientName}, confirmando seu horário amanhã às ${time}. Tudo certo?`;
    
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // --- Cálculos de Métricas (Performance) ---
  const metrics = useMemo(() => {
    const myAppointments = appointments.filter(
      (a) => a.professionalId === userProfile.professionalId
    );

    const today = new Date();
    
    // 1. Agendamentos de Hoje
    const todayAppointments = myAppointments.filter((a) => 
      isSameDay(new Date(a.startTime), today) && a.status === 'scheduled'
    );

    // 2. Total Realizado (Geral)
    const completed = myAppointments.filter((a) => a.status === "completed");
    
    // 3. Estimativa de Faturamento
    const estimatedRevenue = completed.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    // 4. Média de Avaliações
    const reviewedAppts = myAppointments.filter(a => a.review);
    const avgRating = reviewedAppts.length > 0 
      ? reviewedAppts.reduce((acc, curr) => acc + (curr.review?.rating || 0), 0) / reviewedAppts.length
      : 5.0; // Começa com 5

    return {
      todayCount: todayAppointments.length,
      completedCount: completed.length,
      revenue: estimatedRevenue,
      rating: avgRating,
      nextAppointment: todayAppointments.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]
    };
  }, [appointments, userProfile.professionalId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho de Boas Vindas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Olá, <span className="text-amber-500">{userProfile.name}</span>! 👋
          </h1>
          <p className="text-gray-400 mt-2">
            Aqui está o resumo da sua performance e agenda.
          </p>
        </div>
        
        {/* Badge Informativa Simples */}
        <div className="bg-gray-800/80 px-4 py-2 rounded-full border border-gray-700 text-xs text-gray-400 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           Sistema Online
        </div>
      </div>

      {/* --- SEÇÃO DE LEMBRETES (NOVA) --- */}
      {tomorrowAppointments.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-900/20 to-gray-800/50 border border-green-500/30 rounded-2xl p-6 relative overflow-hidden"
        >
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <FaWhatsapp size={100} />
          </div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
                <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
                <FaWhatsapp className="text-green-500" size={24} />
                Confirmar Agenda de Amanhã
                </h2>
                <p className="text-sm text-gray-400">Envie lembretes com 1 clique para reduzir faltas.</p>
            </div>
            <span className="text-sm font-bold bg-green-500 text-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              {tomorrowAppointments.length} clientes
            </span>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 relative z-10">
            {tomorrowAppointments.map((app) => {
              const waLink = generateWhatsAppLink(app);
              
              return (
                <div key={app.id} className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl flex items-center justify-between border border-gray-700 hover:border-green-500/50 transition-all group shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-green-400 transition-colors">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm truncate max-w-[120px]" title={app.clientName}>
                        {app.clientName}
                      </p>
                      <p className="text-xs text-green-400 font-mono flex items-center gap-1">
                        {format(new Date(app.startTime), "HH:mm")} • {app.serviceName}
                      </p>
                    </div>
                  </div>

                  {waLink ? (
                    <a 
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white p-2.5 rounded-lg transition-all shadow-lg shadow-green-900/20 hover:scale-105 active:scale-95 flex items-center gap-2 text-xs font-bold"
                      title="Enviar lembrete no WhatsApp"
                    >
                      <span>Avisar</span>
                      <FaWhatsapp size={16} />
                    </a>
                  ) : (
                    <button 
                      disabled 
                      className="bg-gray-800 text-gray-600 p-2 rounded-lg cursor-not-allowed border border-gray-700"
                      title="Telefone não cadastrado"
                    >
                      <FaWhatsapp size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Grid de Cards de Métricas (Mantido igual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ganhos Estimados */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 font-medium">Faturamento Estimado</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.revenue)}
              </h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <DollarSign size={20} />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Atendimentos Realizados */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 font-medium">Serviços Realizados</p>
              <h3 className="text-2xl font-bold text-white mt-1">{metrics.completedCount}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </motion.div>

        {/* Card 3: Agenda Hoje */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 font-medium">Agenda Hoje</p>
              <h3 className="text-2xl font-bold text-white mt-1">{metrics.todayCount} clientes</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <CalendarClock size={20} />
            </div>
          </div>
        </motion.div>

        {/* Card 4: Avaliação */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 font-medium">Sua Nota</p>
              <div className="flex items-center gap-1 mt-1">
                <h3 className="text-2xl font-bold text-white">{metrics.rating.toFixed(1)}</h3>
                <Star size={18} className="text-yellow-400 fill-yellow-400 mb-1" />
              </div>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <TrendingUp size={20} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Próximo Cliente (Destaque) */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-3xl border border-gray-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Users size={150} />
        </div>
        
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <CalendarClock className="text-amber-500" /> Próximo Cliente
        </h2>

        {metrics.nextAppointment ? (
          <div className="flex flex-col md:flex-row items-center gap-6 bg-black/20 p-6 rounded-xl border border-gray-700/30 backdrop-blur-sm">
            <div className="text-center md:text-left min-w-[120px]">
               <p className="text-4xl font-bold text-white tracking-tighter">
                 {format(new Date(metrics.nextAppointment.startTime), "HH:mm")}
               </p>
               <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mt-1">
                 {format(new Date(metrics.nextAppointment.startTime), "EEEE", { locale: ptBR })}
               </p>
            </div>
            <div className="w-px h-16 bg-gray-700 hidden md:block"></div>
            <div className="flex-1 w-full md:w-auto text-center md:text-left">
               <h3 className="text-xl font-bold text-white mb-1">{metrics.nextAppointment.clientName}</h3>
               <p className="text-gray-300 flex items-center justify-center md:justify-start gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                 {metrics.nextAppointment.serviceName}
               </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               {/* Botão de WhatsApp no Próximo Cliente também (Opcional, mas útil) */}
               {(() => {
                  const link = generateWhatsAppLink(metrics.nextAppointment);
                  return link ? (
                    <a 
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#128C7E] text-white font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <FaWhatsapp />
                      Confirmar
                    </a>
                  ) : null;
               })()}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 flex flex-col items-center">
            <CheckCircle2 size={48} className="mb-4 text-gray-700" />
            <p className="text-lg font-medium">Agenda de hoje concluída!</p>
            <p className="text-sm">Aproveite seu descanso ou prepare-se para amanhã. ☕</p>
          </div>
        )}
      </div>
    </div>
  );
};
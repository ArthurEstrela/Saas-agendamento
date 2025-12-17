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
  DollarSign 
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfessionalHomeProps {
  userProfile: ProfessionalProfile;
}

export const ProfessionalHome = ({ userProfile }: ProfessionalHomeProps) => {
  const { appointments } = useProviderAppointmentsStore();

  // --- Cálculos de Métricas (Performance) ---
  const metrics = useMemo(() => {
    // Filtra apenas agendamentos DESTE profissional (segurança extra)
    const myAppointments = appointments.filter(
      (a) => a.professionalId === userProfile.professionalId
    );

    const today = new Date();
    
    // 1. Agendamentos de Hoje
    const todayAppointments = myAppointments.filter((a) => 
      isSameDay(new Date(a.startTime), today) && a.status === 'scheduled'
    );

    // 2. Total Realizado (Mês atual ou Geral - vamos fazer Geral por enquanto)
    const completed = myAppointments.filter((a) => a.status === "completed");
    
    // 3. Estimativa de Faturamento (Baseado nos concluídos)
    // Nota: O backend deve validar isso, mas aqui serve como estimativa visual
    const estimatedRevenue = completed.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    // 4. Média de Avaliações (Se houver reviews atreladas)
    // Assumindo que o objeto appointment tenha review, ou teríamos que buscar da store de reviews
    // Vamos usar um placeholder ou calcular se tiver review no appointment
    const reviewedAppts = myAppointments.filter(a => a.review);
    const avgRating = reviewedAppts.length > 0 
      ? reviewedAppts.reduce((acc, curr) => acc + (curr.review?.rating || 0), 0) / reviewedAppts.length
      : 0;

    return {
      todayCount: todayAppointments.length,
      completedCount: completed.length,
      revenue: estimatedRevenue,
      rating: avgRating || 5.0, // Começa com 5 se não tiver nada
      nextAppointment: todayAppointments.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]
    };
  }, [appointments, userProfile.professionalId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho de Boas Vindas */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Olá, <span className="text-amber-500">{userProfile.name}</span>! 👋
        </h1>
        <p className="text-gray-400 mt-2">
          Aqui está o resumo da sua performance e agenda de hoje.
        </p>
      </div>

      {/* Grid de Cards de Métricas */}
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
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-3xl border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Users size={150} />
        </div>
        
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <CalendarClock className="text-amber-500" /> Próximo Cliente
        </h2>

        {metrics.nextAppointment ? (
          <div className="flex flex-col md:flex-row items-center gap-6 bg-black/20 p-6 rounded-xl border border-gray-700/30">
            <div className="text-center md:text-left">
               <p className="text-3xl font-bold text-white">
                 {format(new Date(metrics.nextAppointment.startTime), "HH:mm")}
               </p>
               <p className="text-gray-400 text-sm uppercase font-bold tracking-wider mt-1">
                 {format(new Date(metrics.nextAppointment.startTime), "EEEE", { locale: ptBR })}
               </p>
            </div>
            <div className="w-px h-12 bg-gray-700 hidden md:block"></div>
            <div className="flex-1">
               <h3 className="text-lg font-bold text-white">{metrics.nextAppointment.clientName}</h3>
               <p className="text-gray-300">{metrics.nextAppointment.serviceName}</p>
            </div>
            <div>
               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/20">
                 Confirmado
               </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum outro agendamento para hoje. Aproveite o descanso! ☕</p>
          </div>
        )}
      </div>
    </div>
  );
};
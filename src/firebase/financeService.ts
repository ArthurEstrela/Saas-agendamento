// src/firebase/financeService.ts

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
// Importei 'Service' para a nova lógica
import type { Appointment, FinancialData, Service } from '../types'; 
// Importei a função corrigida de buscar despesas
import { getExpensesByDateRange } from './expenseService';

export const getFinancialData = async (
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<FinancialData> => {
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  // 1. Buscar Agendamentos (Receitas)
  const appointmentsRef = collection(db, 'appointments');
  const appointmentsQuery = query(
    appointmentsRef,
    where('providerId', '==', providerId),
    where('status', '==', 'completed'),
    where('completedAt', '>=', startTimestamp),
    where('completedAt', '<=', endTimestamp)
  );

  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  // Convertendo Timestamps para Dates IMEDIATAMENTE
  const appointments = appointmentsSnapshot.docs.map((doc) => {
    const data = doc.data();
    
    // Pega o completedAt e já converte
    const completedAt = data.completedAt 
      ? (data.completedAt as Timestamp).toDate() 
      : undefined; // Embora a query filtre, é bom ter o fallback

    return {
      id: doc.id,
      ...data,
      startTime: (data.startTime as Timestamp).toDate(),
      endTime: (data.endTime as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
      completedAt: completedAt, // Agora é Date ou undefined
    } as Appointment;
  });

  // 2. Buscar Despesas (Usando a função corrigida de expenseService)
  const expenses = await getExpensesByDateRange(providerId, startDate, endDate);

  // 3. Calcular Totais
  const totalRevenue = appointments.reduce(
    (sum, appt) => sum + (appt.finalPrice ?? appt.totalPrice),
    0
  );
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  // 4. Estruturar dados mensais
  const monthlyRevenue: Record<string, number> = {};
  appointments.forEach((appt) => { 
    
    // --- ****** AQUI ESTÁ A CORREÇÃO DO ERRO ****** ---
    // Checa se completedAt existe e é um objeto Date antes de usar
    if (appt.completedAt && appt.completedAt instanceof Date) {
      const monthYear = appt.completedAt.toISOString().slice(0, 7); // "YYYY-MM"
      if (!monthlyRevenue[monthYear]) {
        monthlyRevenue[monthYear] = 0;
      }
      monthlyRevenue[monthYear] += appt.finalPrice ?? appt.totalPrice;
    }
    // --- FIM DA CORREÇÃO ---
  });

  // --- Lógica de Receita Proporcional ---
  const serviceRevenue: Record<string, number> = {};
  const professionalRevenue: Record<string, number> = {};

  appointments.forEach((appt) => { 
    const pricePaid = appt.finalPrice ?? appt.totalPrice;

    // --- LÓGICA DE SERVIÇOS (CORRIGIDA) ---
    const originalTotalPrice = appt.totalPrice;

    if (appt.services && appt.services.length > 0 && originalTotalPrice > 0) {
      appt.services.forEach((service: Service) => {
        const serviceKey = service.name;
        const serviceProportion = service.price / originalTotalPrice;
        const proportionalRevenue = serviceProportion * pricePaid;
        serviceRevenue[serviceKey] = (serviceRevenue[serviceKey] || 0) + proportionalRevenue;
      });
    } else if (appt.services && appt.services.length === 1) {
      const serviceKey = appt.services[0].name;
      serviceRevenue[serviceKey] = (serviceRevenue[serviceKey] || 0) + pricePaid;
    } else {
      const serviceKey = appt.serviceName || "Serviço Desconhecido";
      serviceRevenue[serviceKey] = (serviceRevenue[serviceKey] || 0) + pricePaid;
    }

    // --- LÓGICA DE PROFISSIONAIS (Já estava ok) ---
    if (appt.professionalName) {
      professionalRevenue[appt.professionalName] =
        (professionalRevenue[appt.professionalName] || 0) + pricePaid;
    }
  });
  
  // Ordena e fatia o top 5
  const topServices = Object.entries(serviceRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topProfessionals = Object.entries(professionalRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  
  // --- FIM DA LÓGICA ---

  return {
    totalRevenue,
    totalExpenses,
    netIncome,
    monthlyRevenue, // Agora retorna o objeto calculado
    expenses,
    appointments,
    topServices,
    topProfessionals,
  };
};
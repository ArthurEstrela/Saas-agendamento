import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { Appointment, FinancialData } from '../types';
import { getExpensesByProviderId } from './expenseService'; // Vamos criar este serviço a seguir

/**
 * Calcula os dados financeiros para um prestador de serviço com base nos agendamentos concluídos.
 * @param providerId O ID do prestador de serviço (usuário).
 */
export const getFinancialData = async (providerId: string): Promise<FinancialData> => {
  // 1. Buscar todos os agendamentos concluídos
  const appointmentsCollection = collection(db, 'appointments');
  const q = query(
    appointmentsCollection,
    where('professionalId', '==', providerId), // Ou pode ser um ID de negócio geral
    where('status', '==', 'completed')
  );

  const querySnapshot = await getDocs(q);
  const completedAppointments = querySnapshot.docs.map(doc => doc.data() as Appointment);

  // 2. Buscar todas as despesas
  const expenses = await getExpensesByProviderId(providerId);

  // 3. Calcular os totais
  const totalRevenue = completedAppointments.reduce((acc, app) => {
    // Precisamos buscar o preço do serviço. Idealmente, o preço deveria ser salvo no agendamento.
    // Por simplicidade aqui, vamos assumir um valor fixo ou que ele está no objeto.
    // Para um sistema real, seria crucial salvar o preço no momento do agendamento.
    const servicePrice = app.review?.rating ? 50 : 50; // Exemplo de placeholder
    return acc + servicePrice;
  }, 0);

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  // 4. Calcular receita mensal (exemplo)
  const monthlyRevenue: Record<string, number> = {};
  completedAppointments.forEach(app => {
    const month = (app.endTime as unknown as Timestamp).toDate().toISOString().slice(0, 7); // "YYYY-MM"
    const servicePrice = 50; // Placeholder
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = 0;
    }
    monthlyRevenue[month] += servicePrice;
  });

  return {
    totalRevenue,
    totalExpenses,
    netIncome,
    monthlyRevenue,
    expenses,
  };
};
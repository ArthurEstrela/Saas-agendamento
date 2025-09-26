// src/firebase/financeService.ts

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Appointment, Expense, FinancialData } from "../types";

export const getFinancialData = async (
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<FinancialData> => {
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  // 1. Buscar Agendamentos (Receitas)
  const appointmentsRef = collection(db, "appointments");
  const appointmentsQuery = query(
    appointmentsRef,
    where("providerId", "==", providerId),
    where("status", "==", "completed"),
    where("completedAt", ">=", startTimestamp),
    where("completedAt", "<=", endTimestamp)
  );

  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  const appointments = appointmentsSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Appointment)
  );

  // 2. Buscar Despesas
  const expensesRef = collection(db, `serviceProviders/${providerId}/expenses`);
  const expensesQuery = query(
    expensesRef,
    where("date", ">=", startTimestamp),
    where("date", "<=", endTimestamp)
  );
  const expensesSnapshot = await getDocs(expensesQuery);
  const expenses = expensesSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Expense)
  );

  // 3. Calcular Totais
  const totalRevenue = appointments.reduce(
    (sum, appt) => sum + (appt.finalPrice || appt.totalPrice),
    0
  );
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  // 4. Estruturar dados mensais
  const monthlyRevenue: Record<string, number> = {};
  appointments.forEach((appt) => {
    if (appt.completedAt && appt.completedAt instanceof Timestamp) {
      const monthYear = appt.completedAt.toDate().toISOString().slice(0, 7); // "YYYY-MM"
      if (!monthlyRevenue[monthYear]) {
        monthlyRevenue[monthYear] = 0;
      }
      monthlyRevenue[monthYear] += appt.finalPrice || appt.totalPrice;
    }
  });

  const serviceRevenue: Record<string, number> = {};
  const professionalRevenue: Record<string, number> = {};

  appointments.forEach((appt) => {
    const revenue = appt.finalPrice || appt.totalPrice;

    // Agrega receita por nome do serviço principal
    if (appt.serviceName) {
      serviceRevenue[appt.serviceName] =
        (serviceRevenue[appt.serviceName] || 0) + revenue;
    }

    // Agrega receita por nome do profissional
    if (appt.professionalName) {
      professionalRevenue[appt.professionalName] =
        (professionalRevenue[appt.professionalName] || 0) + revenue;
    }
  });

  const topServices = Object.entries(serviceRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // Pega os 5 melhores

  const topProfessionals = Object.entries(professionalRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // Pega os 5 melhores

  return {
    totalRevenue,
    totalExpenses,
    netIncome,
    monthlyRevenue: {},
    expenses,
    appointments,
    topServices,
    topProfessionals,
  };
};

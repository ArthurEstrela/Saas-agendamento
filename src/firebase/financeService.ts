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

  return {
    totalRevenue,
    totalExpenses,
    netIncome,
    monthlyRevenue,
    expenses,
    appointments, // A propriedade 'appointments' agora é esperada pelo tipo FinancialData
  };
};
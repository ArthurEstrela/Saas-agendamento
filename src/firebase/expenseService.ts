import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  deleteDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './config';
import type { Expense } from '../types';

const getExpensesCollection = (providerId: string) => {
  return collection(db, 'users', providerId, 'expenses');
};

/**
 * Adiciona uma nova despesa para um prestador de serviço.
 */
export const addExpense = async (
  providerId: string,
  expenseData: Omit<Expense, 'id'>
) => {
  const expensesCollection = getExpensesCollection(providerId);
  await addDoc(expensesCollection, {
    ...expenseData,
    date: expenseData.date instanceof Date 
      ? Timestamp.fromDate(expenseData.date) 
      : expenseData.date,
  });
};

/**
 * Busca todas as despesas de um prestador de serviço (geral).
 */
export const getExpensesByProviderId = async (
  providerId: string
): Promise<Expense[]> => {
  const expensesCollection = getExpensesCollection(providerId); 
  const q = query(expensesCollection);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    // Converte Timestamp para Date
    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
    
    return { 
      id: doc.id, 
      ...data,
      date: date 
    } as Expense;
  });
};

/**
 * Busca despesas de um prestador dentro de um intervalo de datas.
 * (Função nova, usada pelo financeService)
 */
export const getExpensesByDateRange = async (
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<Expense[]> => {
  const expensesCollection = getExpensesCollection(providerId);
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  const expensesQuery = query(
    expensesCollection,
    where('date', '>=', startTimestamp),
    where('date', '<=', endTimestamp)
  );
  
  const expensesSnapshot = await getDocs(expensesQuery);
  
  return expensesSnapshot.docs.map((doc) => {
    const data = doc.data();
    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
    
    return { 
      id: doc.id, 
      ...data,
      date: date 
    } as Expense;
  });
};


/**
 * Deleta uma despesa.
 */
export const deleteExpense = async (
  providerId: string,
  expenseId: string
) => {
  const expenseDoc = doc(getExpensesCollection(providerId), expenseId);
  await deleteDoc(expenseDoc);
};

/**
 * Atualiza uma despesa.
 */
export const updateExpense = async (
  providerId: string,
  expenseId: string,
  expenseData: Partial<Omit<Expense, 'id'>>
) => {
  const expenseDoc = doc(getExpensesCollection(providerId), expenseId);
  
  if (expenseData.date && expenseData.date instanceof Date) {
    expenseData.date = Timestamp.fromDate(expenseData.date);
  }
  
  await updateDoc(expenseDoc, expenseData);
};
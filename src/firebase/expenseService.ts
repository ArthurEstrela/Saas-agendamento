import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  deleteDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from './config';
import type { Expense } from '../types';

const getExpensesCollection = (providerId: string) => {
  return collection(db, `serviceProviders/${providerId}/expenses`);
};

/**
 * Adiciona uma nova despesa para um prestador de serviço.
 */
export const addExpense = async (
  providerId: string,
  expenseData: Omit<Expense, "id">
) => {
  const expensesCollection = getExpensesCollection(providerId);
  await addDoc(expensesCollection, {
    ...expenseData,
    date: expenseData.date, // Já deve ser um Timestamp vindo do modal
  });
};

/**
 * Busca todas as despesas de um prestador de serviço.
 */
export const getExpensesByProviderId = async (providerId: string): Promise<Expense[]> => {
  const expensesCollection = collection(db, 'users', providerId, 'expenses');
  const q = query(expensesCollection);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    if (data['date'] instanceof Timestamp) {
        data['date'] = (data['date'] as Timestamp).toDate();
    }
    return { id: doc.id, ...data } as Expense;
  });
};

/**
 * Deleta uma despesa.
 */

export const deleteExpense = async (
  providerId: string,
  expenseId: string
) => {
  const expenseDoc = doc(db, `serviceProviders/${providerId}/expenses`, expenseId);
  await deleteDoc(expenseDoc);
};



export const updateExpense = async (
  providerId: string,
  expenseId: string,
  expenseData: Partial<Omit<Expense, "id">>
) => {
  const expenseDoc = doc(db, `serviceProviders/${providerId}/expenses`, expenseId);
  await updateDoc(expenseDoc, expenseData);
};
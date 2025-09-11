import {
  collection,
  addDoc,
  getDocs,
  query,
  serverTimestamp,
  doc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import type { Expense } from '../types';

/**
 * Adiciona uma nova despesa para um prestador de serviço.
 */
export const addExpense = async (providerId: string, expenseData: Omit<Expense, 'id' | 'date'>): Promise<string> => {
  const expensesCollection = collection(db, 'users', providerId, 'expenses');
  const docRef = await addDoc(expensesCollection, {
    ...expenseData,
    date: serverTimestamp(),
  });
  return docRef.id;
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
export const deleteExpense = async (providerId: string, expenseId: string): Promise<void> => {
    const expenseRef = doc(db, 'users', providerId, 'expenses', expenseId);
    await deleteDoc(expenseRef);
};
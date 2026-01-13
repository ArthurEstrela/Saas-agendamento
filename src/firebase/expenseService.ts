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
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import type { Expense } from '../types';

// Referência constante para a coleção raiz
const EXPENSES_COLLECTION = 'expenses';

const getExpensesRef = () => collection(db, EXPENSES_COLLECTION);

/**
 * Adiciona uma nova despesa na coleção raiz.
 */
export const addExpense = async (
  providerId: string,
  expenseData: Omit<Expense, 'id'>
): Promise<void> => {
  if (!providerId) throw new Error("ProviderID é obrigatório para criar despesa.");

  const expensesRef = getExpensesRef();
  
  // Garante que a data seja salva como Timestamp do Firestore
  const dateToSave = expenseData.date instanceof Date 
    ? Timestamp.fromDate(expenseData.date) 
    : expenseData.date;

  await addDoc(expensesRef, {
    ...expenseData,
    providerId, // Vínculo crucial para as regras de segurança
    date: dateToSave,
    createdAt: Timestamp.now() // Útil para ordenação interna
  });
};

/**
 * Busca todas as despesas de um prestador.
 */
export const getExpensesByProviderId = async (
  providerId: string
): Promise<Expense[]> => {
  const expensesRef = getExpensesRef();
  
  const q = query(
    expensesRef, 
    where('providerId', '==', providerId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    // Converte Timestamp de volta para Date do JS para o frontend usar
    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
    
    return { 
      id: doc.id, 
      ...data,
      date: date 
    } as Expense;
  });
};

/**
 * Busca despesas por intervalo de datas (Essencial para o Dashboard Financeiro).
 */
export const getExpensesByDateRange = async (
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<Expense[]> => {
  const expensesRef = getExpensesRef();
  
  // Converter para Timestamp para a query do Firestore
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  const q = query(
    expensesRef,
    where('providerId', '==', providerId),
    where('date', '>=', startTimestamp),
    where('date', '<=', endTimestamp),
    orderBy('date', 'desc') // Ordenação importante para a UI
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
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
 * Nota: providerId mantido para consistência da API, mesmo que deleteDoc use apenas o ID.
 */
export const deleteExpense = async (
  _providerId: string, 
  expenseId: string
): Promise<void> => {
  // Aponta direto para o documento na coleção raiz
  const expenseDoc = doc(db, EXPENSES_COLLECTION, expenseId);
  await deleteDoc(expenseDoc);
};

/**
 * Atualiza uma despesa.
 */
export const updateExpense = async (
  _providerId: string,
  expenseId: string,
  expenseData: Partial<Omit<Expense, 'id'>>
): Promise<void> => {
  const expenseDoc = doc(db, EXPENSES_COLLECTION, expenseId);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataToUpdate: any = { ...expenseData };

  // Se houver data na atualização, converte para Timestamp
  if (expenseData.date && expenseData.date instanceof Date) {
    dataToUpdate.date = Timestamp.fromDate(expenseData.date);
  }
  
  await updateDoc(expenseDoc, dataToUpdate);
};
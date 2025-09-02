// src/firebase/expenseService.ts

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Expense } from "../types";

const expensesCollection = (userId: string) => collection(db, "users", userId, "expenses");

// Adicionar uma nova despesa
export const addExpense = async (
  userId: string,
  expenseData: { description: string; amount: number; date: Date }
): Promise<Expense> => {
  const docRef = await addDoc(expensesCollection(userId), {
    userId,
    description: expenseData.description,
    amount: expenseData.amount,
    date: Timestamp.fromDate(expenseData.date),
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, userId, ...expenseData };
};

// Buscar todas as despesas de um usuário
export const getExpenses = async (userId: string): Promise<Expense[]> => {
  if (!userId) return [];
  try {
    const q = query(expensesCollection(userId), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      
      // ✅ **CORREÇÃO APLICADA AQUI**
      // Verifica se a data é um Timestamp do Firestore antes de converter.
      // Isso evita o erro se a data estiver em outro formato.
      const finalDate = data.date instanceof Timestamp 
        ? data.date.toDate() 
        : new Date(); // Usa a data atual como um fallback seguro se o dado estiver corrompido

      return {
        id: docSnap.id,
        userId: data.userId,
        description: data.description,
        amount: data.amount,
        date: finalDate,
      } as Expense;
    });
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
    throw new Error("Não foi possível carregar as despesas.");
  }
};

// Deletar uma despesa
export const deleteExpense = async (userId: string, expenseId: string): Promise<void> => {
  const expenseDocRef = doc(db, "users", userId, "expenses", expenseId);
  await deleteDoc(expenseDocRef);
};
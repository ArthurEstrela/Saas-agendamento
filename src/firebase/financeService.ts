import { db } from "./config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import type { Expense } from "../types";
import type { Transaction } from "../types";

/**
 * Busca todas as despesas de um prestador de serviço a partir da subcoleção correta.
 * @param serviceProviderId O UID do prestador de serviço.
 * @returns Uma promessa que resolve para um array de despesas.
 */
export const getExpenses = async (
  serviceProviderId: string
): Promise<Expense[]> => {
  try {
    // --- CORREÇÃO AQUI ---
    // O caminho correto para a subcoleção de despesas
    const expensesColPath = `users/${serviceProviderId}/expenses`;
    const expensesCol = collection(db, expensesColPath);

    const q = query(expensesCol, orderBy("date", "desc"));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  } catch (error) {
    console.error("Erro ao buscar despesas: ", error);
    throw new Error("Não foi possível carregar as despesas.");
  }
};

/**
 * Adiciona uma nova despesa na subcoleção correta do usuário.
 * @param serviceProviderId O UID do prestador de serviço a quem a despesa pertence.
 * @param expenseData Os dados da nova despesa.
 * @returns O ID do documento recém-criado.
 */
export const addExpense = async (
  serviceProviderId: string,
  expenseData: Omit<Expense, "id" | "serviceProviderId">
): Promise<string> => {
  try {
    // --- CORREÇÃO AQUI ---
    const expensesColPath = `users/${serviceProviderId}/expenses`;
    const docRef = await addDoc(collection(db, expensesColPath), {
      ...expenseData,
      serviceProviderId: serviceProviderId, // Garante que o ID do dono seja salvo
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar despesa: ", error);
    throw new Error("Não foi possível salvar a despesa.");
  }
};

/**
 * Deleta uma despesa da subcoleção correta do usuário.
 * @param serviceProviderId O UID do prestador de serviço.
 * @param expenseId O ID da despesa a ser deletada.
 */
export const deleteExpense = async (
  serviceProviderId: string,
  expenseId: string
): Promise<void> => {
  try {
    // --- CORREÇÃO AQUI ---
    const expenseDocPath = `users/${serviceProviderId}/expenses/${expenseId}`;
    const expenseRef = doc(db, expenseDocPath);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Erro ao deletar despesa: ", error);
    throw new Error("Não foi possível deletar a despesa.");
  }
};

export const getTransactions = async (
  serviceProviderId: string
): Promise<Transaction[]> => {
  if (!serviceProviderId) {
    console.error("ID do prestador de serviço não fornecido.");
    return [];
  }
  try {
    const transactionsCol = collection(db, "transactions");
    const q = query(
      transactionsCol,
      where("serviceProviderId", "==", serviceProviderId),
      orderBy("completedAt", "desc") // Ordena pela data de conclusão
    );

    const querySnapshot = await getDocs(q);

    const transactions: Transaction[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        completedAt:
          data.completedAt instanceof Timestamp
            ? data.completedAt.toDate()
            : new Date(),
      } as Transaction;
    });

    return transactions;
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    throw new Error(
      "Não foi possível carregar os dados financeiros. Tente novamente mais tarde."
    );
  }
};

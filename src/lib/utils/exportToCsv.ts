import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import type { Appointment, Expense } from '../../types';

// Função auxiliar para garantir que estamos lidando com objetos Date
const normalizeTimestamp = (dateValue: unknown): Date => {
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  return new Date(dateValue as string | number | Date);
};

// Função para escapar caracteres que podem quebrar o CSV (como vírgulas na descrição)
const escapeCsvCell = (cellData: string | number) => {
    const stringData = String(cellData);
    if (stringData.includes(',')) {
        return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
};

/**
 * Gera e inicia o download de um arquivo CSV a partir de uma lista de transações.
 * @param filename O nome do arquivo a ser baixado.
 * @param data A lista de agendamentos e despesas.
 */
export const exportTransactionsToCsv = (filename: string, data: (Appointment | Expense)[]) => {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar."); // Podemos substituir por um toast no futuro
    return;
  }

  // Define o cabeçalho do arquivo CSV
  const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor (BRL)'];
  
  // Mapeia cada transação para uma linha do CSV
  const csvRows = data.map(item => {
    const isExpense = 'amount' in item;
    const date = format(normalizeTimestamp(isExpense ? item.date : item.startTime), 'yyyy-MM-dd');
    const description = isExpense ? item.description : `Serviço: ${item.serviceName}`;
    const type = isExpense ? 'Despesa' : 'Receita';
    const category = isExpense ? item.category : 'N/A';
    const value = isExpense ? -item.amount : item.totalPrice;

    return [
      escapeCsvCell(date),
      escapeCsvCell(description),
      escapeCsvCell(type),
      escapeCsvCell(category),
      // Formata o número para o padrão brasileiro de planilhas (vírgula decimal)
      escapeCsvCell(value.toFixed(2).replace('.', ','))
    ].join(',');
  });

  // Junta o cabeçalho e as linhas
  const csvString = [headers.join(','), ...csvRows].join('\n');
  
  // Adiciona BOM para garantir a correta interpretação de caracteres especiais no Excel
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });

  // Cria um link temporário e simula o clique para iniciar o download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

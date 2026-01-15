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

// Função para escapar caracteres que podem quebrar o CSV
const escapeCsvCell = (cellData: string | number) => {
    const stringData = String(cellData);
    if (stringData.includes(',')) {
        return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
};

/**
 * Função interna para gerenciar o download do arquivo
 */
const downloadCsv = (filename: string, headers: string[], rows: string[]) => {
  const csvString = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta transações financeiras (Receitas e Despesas)
 */
export const exportTransactionsToCsv = (filename: string, data: (Appointment | Expense)[]) => {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor (BRL)'];
  
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
      escapeCsvCell(value.toFixed(2).replace('.', ','))
    ].join(',');
  });

  downloadCsv(filename, headers, csvRows);
};

/**
 * Exporta a agenda do dia com Dia e Horário na frente e status em Português
 */
export const exportDailyAgendaToCsv = (filename: string, data: any[]) => {
  if (!data || data.length === 0) {
    alert("Não há agendamentos para exportar.");
    return;
  }

  // Colunas: Dia e Horário na frente, sem a parte de pagamento
  const headers = ['Dia', 'Horário', 'Cliente', 'Serviço', 'Status'];
  
  // Mapeamento de traduções para os status do sistema
  const statusTranslations: Record<string, string> = {
    pending: 'Pendente',
    scheduled: 'Agendado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    free: 'Disponível'
  };

  const csvRows = data.map(item => {
    const isVacant = item.isVacant; 
    const dateObj = normalizeTimestamp(item.startTime);
    
    const dia = format(dateObj, 'dd/MM/yyyy');
    const horario = format(dateObj, 'HH:mm');
    const cliente = isVacant ? 'LIVRE' : (item.clientName || 'N/A');
    const servico = isVacant ? '-' : (item.serviceName || 'N/A');
    const status = isVacant ? 'Disponível' : (statusTranslations[item.status] || item.status);

    return [
      escapeCsvCell(dia),
      escapeCsvCell(horario),
      escapeCsvCell(cliente),
      escapeCsvCell(servico),
      escapeCsvCell(status)
    ].join(',');
  });

  downloadCsv(filename, headers, csvRows);
};
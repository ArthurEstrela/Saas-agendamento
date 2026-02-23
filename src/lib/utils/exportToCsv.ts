import { format } from 'date-fns';
import type { Appointment, Expense } from '../../types';

// Função auxiliar para parsear ISO Strings de forma segura
const normalizeDate = (dateValue: unknown): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  return new Date(dateValue as string | number);
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

// --- Type Guards
const isExpenseType = (item: Appointment | Expense): item is Expense => {
  return (item as Expense).amount !== undefined;
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
    const isExpense = isExpenseType(item);
    const date = format(normalizeDate(isExpense ? item.date : item.startTime), 'yyyy-MM-dd');
    
    // Tratamento de properties que mudaram no Spring Boot
    const description = isExpense 
        ? item.description 
        : `Serviço: ${item.items && item.items.length > 0 ? item.items[0].name : "Indefinido"}`;
    
    const type = isExpense ? 'Despesa' : 'Receita';
    const category = isExpense ? item.category : 'N/A';
    
    // Fallback para totalAmount/finalAmount
    const incomeValue = (item as Appointment).finalAmount || (item as Appointment).totalAmount || 0;
    const value = isExpense ? -item.amount : incomeValue;

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
export const exportDailyAgendaToCsv = (filename: string, data: Appointment[]) => {
  if (!data || data.length === 0) {
    alert("Não há agendamentos para exportar.");
    return;
  }

  const headers = ['Dia', 'Horário', 'Cliente', 'Serviço', 'Status'];
  
  // Mapeamento de traduções (lidando com UPPERCASE da API)
  const statusTranslations: Record<string, string> = {
    PENDING: 'Pendente',
    SCHEDULED: 'Agendado',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    NO_SHOW: 'Faltou',
    BLOCKED: 'Bloqueado'
  };

  const csvRows = data.map(item => {
    const isVacant = item.status.toUpperCase() === "BLOCKED"; // Exemplo de uso
    const dateObj = normalizeDate(item.startTime);
    
    const dia = format(dateObj, 'dd/MM/yyyy');
    const horario = format(dateObj, 'HH:mm');
    const cliente = isVacant ? 'LIVRE' : (item.clientName || 'Particular');
    
    const servico = isVacant 
        ? '-' 
        : (item.items && item.items.length > 0 ? item.items.map(i => i.name).join(", ") : "Indefinido");
        
    const status = isVacant 
        ? 'Disponível' 
        : (statusTranslations[item.status.toUpperCase()] || item.status);

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
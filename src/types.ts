import { Timestamp } from 'firebase/firestore';

// Interface para o endereço estruturado com geolocalização
export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// Interface para Serviços, mantida detalhada para associar aos profissionais
export interface Service {
  id: string;
  serviceProviderId: string;
  name: string;
  price: number;
  duration: number; // Duração em minutos
  description: string;
  professionalIds: string[]; // MUDANÇA: de professionalId para um array de IDs
}

// Estrutura para os intervalos de tempo (trabalho e pausa)
export interface TimeInterval {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface WorkSchedule {
  [dayOfWeek: string]: {
    active: boolean;
    intervals: TimeInterval[];
  };
  // Ex: "monday": { active: true, intervals: [{ start: "09:00", end: "18:00" }] }
}

// Disponibilidade por dia da semana, mais flexível para cada profissional
export interface Availability {
  slotInterval: number;
  weekdays: {
    [day: string]: {
      isOpen: boolean;
      startTime: string;
      endTime: string;
    };
  };
}

// Interface para Folgas e Imprevistos
export interface Unavailability {
  id: string;
  date: string; // 'YYYY-MM-DD'
  period: 'morning' | 'afternoon' | 'all_day';
  description: string;
}

// Interface para o Profissional, com sua própria disponibilidade
export interface Professional {
  id: string;
  name: string;
  photoURL?: string;
  availability: DayAvailability[]; // Cada profissional tem sua agenda
  unavailability?: Unavailability[]; // Campo para folgas e imprevistos
  workSchedule?: WorkSchedule;
}

export interface DayAvailability {
  dayOfWeek: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  isDayOff: boolean;
  workIntervals: TimeInterval[];
  breakIntervals: TimeInterval[];
}

// Perfil do Usuário unificado e atualizado
export interface UserProfile {
  uid: string;
  email: string;
  createdAt: Timestamp;
  userType: "client" | "serviceProvider";

  phoneNumber?: string;
  photoURL?: string;
  
  // Para Clientes
  name?: string; // Nome de exibição do cliente
  favorites?: string[]; // UIDs dos prestadores favoritos

  // Para Prestadores de Serviço
  companyName?: string; // Nome do estabelecimento
  address?: Address; // Endereço estruturado
  instagram?: string;
  whatsapp?: string;
  segment?: string;
  publicProfileSlug?: string;
  professionals?: Professional[];
  services?: Service[];
  cnpj?: string;
  cancellationPolicyMinutes?: number;
  bookingAdvanceDays?: number;
  availability?: Availability;

  averageRating?: number;
  reviewCount?: number;
  totalRevenue?: number;
}

// Interface de Agendamento detalhada
export interface Appointment {
  id: string;
  serviceProviderId: string;
  professionalId: string;
  clientId: string;
  serviceId: string; // ID do serviço principal agendado
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; 
  createdAt: Timestamp;
  serviceName: string;
  professionalName: string;
  clientName: string;
  clientEmail?: string;
  duration: number;
  price: number;
  totalPrice?: number;
  cancellationReason?: string;
  notes?: string;
  hasBeenReviewed?: boolean;
  serviceProviderName: string;      // NOVO CAMPO (ou garantir que exista)
  serviceProviderPhotoURL?: string; // NOVO CAMPO OPCIONAL
}

// Interface para Despesas
export interface Expense {
  id: string;
  userId: string; // ID do prestador de serviço
  description: string;
  amount: number;
  date: Date;
  category: string;
}

export interface ProfessionalRevenue {
  professionalId: string;
  professionalName: string;
  totalRevenue: number;
}

export interface ServiceRevenue {
  serviceId: string;
  serviceName: string;
  totalRevenue: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

// Interface para Avaliações
export interface Review {
  id: string;
  serviceProviderId: string;
  clientId: string;
  clientName: string;
  clientPhotoURL?: string;
  professionalId: string;
  serviceName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface RecurringAppointment {
  id: string;
  professionalId: string;
  clientId: string;
  serviceId: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm'
  recurrence: 'semanal' | 'quinzenal' | 'mensal';
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  providerId: string;
  services: Service[];
  professionalId: string | null;
  professionalName: string;
  date: Date | Timestamp | string; // O Firestore pode retornar diferentes tipos
  totalPrice: number;
  totalDuration: number; // em minutos
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: Timestamp;
  reviewId?: string | null; // ID da avaliação, se houver
}

export interface Transaction {
  id: string;
  serviceProviderId: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  amount: number;
  completedAt: Date; // Data em que o serviço foi concluído
  professionalName: string;
}
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
  name:string;
  price: number;
  duration: number; // em minutos
  description?: string;
  professionalIds: string[]; // Associa quais profissionais realizam o serviço
}

// Estrutura para os intervalos de tempo (trabalho e pausa)
export interface TimeInterval {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

// Disponibilidade por dia da semana, mais flexível para cada profissional
export interface DayAvailability {
  dayOfWeek: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  isDayOff: boolean;
  workIntervals: TimeInterval[];
  breakIntervals: TimeInterval[];
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
  status: "scheduled" | "completed" | "canceledByClient" | "canceledByProvider" | "noShow";
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
}

// Interface para Despesas
export interface Expense {
  id: string;
  serviceProviderId: string;
  description: string;
  category:
    | "Aluguel"
    | "Água"
    | "Luz"
    | "Salários"
    | "Produtos"
    | "Marketing"
    | "Outros";
  amount: number;
  isFixed: boolean;
  recurringDay?: number; // Dia do mês para recorrência (1-31)
  date: string; // 'YYYY-MM-DD'
  createdAt: Timestamp;
}

// Interface para Avaliações
export interface Review {
  id: string;
  serviceProviderId: string;
  clientId: string;
  clientName: string;
  clientPhotoURL?: string;
  appointmentId: string;
  rating: number; // 1 a 5
  comment: string;
  createdAt: Timestamp;
}

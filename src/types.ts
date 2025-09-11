// Tipos Base e Enumerações

export const UserRole = {
  Client: 'client',
  ServiceProvider: 'serviceProvider',
  Professional: 'professional',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

// Disponibilidade

export interface TimeSlot {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface DailyAvailability {
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  isAvailable: boolean;
  slots: TimeSlot[];
}

// Entidades Principais

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
}

export interface Professional {
  id:string;
  name: string;
  services: Service[]; // Array of Service objects
  availability: DailyAvailability[];
}

export interface Review {
  id: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  review?: Review;
  // Opcional: útil para quando o prestador recusa o agendamento
  rejectionReason?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  link?: string; // Opcional, para redirecionar o usuário
}

// Perfis de Usuário

export interface ClientProfile extends BaseUser {
  // Mude de 'UserRole.Client' para a string literal 'client'
  role: 'client';
  favoriteProfessionals?: string[]; // Array of professional IDs
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  // Opcional: para integração com mapas
  lat?: number;
  lng?: number;
}

export interface ServiceProviderProfile extends BaseUser {
  // Mude de 'UserRole.ServiceProvider' para a string literal 'serviceProvider'
  role: 'serviceProvider';
  businessName: string;
  businessAddress: Address;
  businessPhone?: string;
  services: Service[];
  professionals: Professional[];
  reviews: Review[];
}

// Union Type para o perfil do usuário logado
export type UserProfile = ClientProfile | ServiceProviderProfile;

// Tipos para a área Financeira

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: Date;
    category: string;
}

export interface FinancialData {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    monthlyRevenue: Record<string, number>; // Ex: { "2023-01": 5000, "2023-02": 6000 }
    expenses: Expense[];
}
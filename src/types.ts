import type { FieldValue } from "firebase/firestore";

export const UserRole = {
  Client: "client",
  ServiceProvider: "serviceProvider",
  Professional: "professional",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date | FieldValue; 
  lastLogin?: Date;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

// Disponibilidade

export interface TimeSlot {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface ProviderAdditionalData {
  businessName: string;
  cnpj: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface DailyAvailability {
  dayOfWeek:
    | "Sunday"
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday";
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
  id: string;
  name: string;
  photoURL?: string;
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
  providerId: string;
  professionalId: string;
  professionalName: string;
  services: Service[]; 
  serviceName: string;
  startTime: Date;
  endTime: Date;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  totalPrice: number;
  totalDuration: number; // in minutes
  notes?: string;
  review?: Review;
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
  role: "client";
  favoriteProfessionals?: string[];
  cpf?: string;
  dateOfBirth?: string;
  gender?: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não dizer';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
}

export type PaymentMethod = "pix" | "credit_card" | "cash";

export interface ServiceProviderProfile extends BaseUser {
  role: "serviceProvider";
  businessName: string;
  businessAddress: Address;
  cnpj: string;
  publicProfileSlug?: string;
  businessPhone?: string;
  services: Service[];
  professionals: Professional[];
  reviews: Review[];
  areaOfWork?: string; // Área de atuação
  logoUrl?: string; // URL da foto ou logo
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  paymentMethods?: PaymentMethod[];
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

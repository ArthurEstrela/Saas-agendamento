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
  cpf?: string;
  documentType?: "cpf" | "cnpj";
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
  email?: string;
  photoURL?: string;
  services: Service[]; // Array of Service objects
  availability: DailyAvailability[];
  slotInterval?: number; // <-- ADICIONE ESTA LINHA AQUI
  isOwner?: boolean; // <--- ADICIONE ISTO
}

export interface Review {
  id: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  serviceProviderId: string;
  professionalId: string;
  professionalName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export type PaymentMethod = "pix" | "credit_card" | "cash"; // <-- Usado no agendamento

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  providerId: string;
  professionalId: string;
  professionalName: string;
  professionalAvatarUrl?: string;
  providerAvatarUrl?: string;
  services: Service[];
  serviceName: string;
  startTime: Date;
  endTime: Date;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  paymentMethod?: PaymentMethod; // <-- ADICIONADO: Método escolhido pelo cliente
  totalPrice: number;
  finalPrice?: number;
  totalDuration: number; // in minutes
  notes?: string;
  review?: Review;
  reviewId?: string;
  rejectionReason?: string;
  completedAt?: Date | FieldValue;
  createdAt: Date | FieldValue;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date | FieldValue;
  link?: string;
}

// Perfis de Usuário

export interface ClientProfile extends BaseUser {
  role: "client";
  favoriteProfessionals?: string[];
  cpf?: string;
  dateOfBirth?: string;
  gender?: "Masculino" | "Feminino" | "Outro" | "Prefiro não dizer";
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
}

export interface ServiceProviderProfile extends BaseUser {
  role: "serviceProvider";
  businessName: string;
  businessAddress: Address;
  cnpj?: string;
  cpf?: string;
  documentType?: "cpf" | "cnpj";
  publicProfileSlug?: string;
  businessPhone?: string;
  services: Service[];
  reviews: Review[];
  areaOfWork?: string;
  logoUrl?: string;
  bannerUrl?: string;
  pixKey?: string;
  pixKeyType?: "cpf" | "cnpj" | "email" | "phone" | "random";
  cancellationMinHours?: number;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    whatsapp?: string;
  };
  paymentMethods?: PaymentMethod[]; // Quais métodos o provider aceita
  bookingWindowDays?: number;
  slotInterval?: 15 | 30 | 60;
  subscriptionStatus?:
    | "active"
    | "cancelled"
    | "past_due"
    | "trial"
    | "free"
    | string;
  stripeSubscriptionId?: string;
  onboardingDismissed?: boolean;
}

// Union Type para o perfil do usuário logado
export type UserProfile =
  | ClientProfile
  | ServiceProviderProfile
  | ProfessionalProfile;

// Tipos para a área Financeira

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date | FieldValue;
  category: string;
  type: "one-time" | "recurring";
  frequency?: "monthly";
}

export interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  monthlyRevenue: Record<string, number>;
  expenses: Expense[];
  appointments: Appointment[];
  topServices: { name: string; revenue: number }[];
  topProfessionals: { name: string; revenue: number }[];
}

export interface ProfessionalProfile extends BaseUser {
  role: "professional";
  serviceProviderId: string; // ID do ServiceProvider (dono) ao qual pertence
  professionalId: string; // ID do recurso "Professional" (que contém serviços/horários)
  avatarUrl?: string;
  bio?: string;
}

export type ProviderDashboardView =
  | "agenda"
  | "profile"
  | "services"
  | "professionals"
  | "availability"
  | "financial"
  | "reviews"
  | "notifications"
  | "subscription";

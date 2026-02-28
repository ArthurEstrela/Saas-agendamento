// ============================================================================
// 1. ENUMS (Alinhados com o backend Spring Boot)
// ============================================================================

export type UserRoleType =
  | "CLIENT"
  | "SERVICE_PROVIDER"
  | "PROFESSIONAL"
  | "ADMIN";

export type PaymentMethod =
  | "PIX"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CASH"
  | "LINK";

export type AppointmentStatus =
  | "PENDING"
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "BLOCKED";

export type DayOfWeek =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type CashTransactionType =
  | "INCOME"
  | "EXPENSE"
  | "COMMISSION"
  | "PAYOUT"
  | "WITHDRAWAL";
export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "SALE";
export type WaitlistStatus = "WAITING" | "NOTIFIED" | "SCHEDULED" | "CANCELLED";

// ============================================================================
// 2. COMMON & BASE TYPES
// ============================================================================

// Espelha a classe PagedResult.java do backend
export interface PagedResult<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
}

export interface TimeSlot {
  start: string; // Formato "HH:mm"
  end: string;
}

export interface DailyAvailability {
  dayOfWeek: DayOfWeek;
  isAvailable: boolean;
  slots: TimeSlot[];
}

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  createdAt: string; // Recebido como String ISO 8601 (ex: "2026-02-21T10:00:00Z")
  lastLogin?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  providerId?: string;
}

// ============================================================================
// 3. USER PROFILES
// ============================================================================

export interface ClientProfile extends BaseUser {
  role: "CLIENT";
  cpf?: string;
  dateOfBirth?: string;
  gender?: string;
  favoriteProfessionals?: string[]; // IDs
  noShowCount?: number; // Contador de faltas do backend
}

export interface ServiceProviderProfile extends BaseUser {
  role: "SERVICE_PROVIDER";
  businessName: string;
  businessAddress?: Address;
  documentType?: "cpf" | "cnpj" | "CPF" | "CNPJ";
  document?: string;
  publicProfileSlug?: string;
  businessPhone?: string;
  areaOfWork?: string;
  logoUrl?: string;
  bannerUrl?: string;
  pixKey?: string;
  pixKeyType?: string;
  cancellationMinHours?: number;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    whatsapp?: string;
  };
  paymentMethods?: PaymentMethod[];
  bookingWindowDays?: number;
  slotInterval?: number;
  subscriptionStatus?:
    | "ACTIVE"
    | "CANCELLED"
    | "PAST_DUE"
    | "TRIAL"
    | "EXPIRED"
    | "FREE"
    | "active"
    | string;
  stripeSubscriptionId?: string;
  trialEndsAt?: string;
  onboardingDismissed?: boolean;
  averageRating?: number;

  services?: Service[];
  professionals?: ProfessionalProfile[];
  reviews?: Review[];
}

export interface ProfessionalProfile extends BaseUser {
  role: "PROFESSIONAL";
  serviceProviderId: string;
  professionalId: string;
  bio?: string;
  services?: Service[];
  availability?: DailyAvailability[];
  commissionPercentage?: number;
  isOwner: boolean;
}

export type UserProfile =
  | ClientProfile
  | ServiceProviderProfile
  | ProfessionalProfile;

// ============================================================================
// 4. CORE BUSINESS ENTITIES (Services, Products, Appointments)
// ============================================================================

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  duration: number; // Minutos
  price: number;
  active: boolean;
}

export interface Product {
  id: string;
  providerId: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  minStockAlert: number;
  active: boolean;
}

// Item do agendamento (pode ser serviço ou produto vendido na hora)
export interface AppointmentItem {
  id?: string;
  referenceId: string; // ID do serviço ou produto
  name: string;
  type: "SERVICE" | "PRODUCT";
  price: number;
  quantity: number;
  professionalId?: string;
}

export interface Appointment {
  id: string;
  providerId: string;
  professionalId: string;
  professionalName?: string;
  professionalAvatarUrl?: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  startTime: string; // ISO String
  endTime: string;
  status: AppointmentStatus;
  items: AppointmentItem[]; // Lista de serviços/produtos (Ajustado com o backend)
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  couponId?: string;
  reviewId?: string;
  rejectionReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Review {
  id: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  serviceProviderId: string;
  professionalId: string;
  professionalName?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// ============================================================================
// 5. MARKETING & WAITLIST (Cupons e Lista de Espera)
// ============================================================================

export interface Coupon {
  id: string;
  providerId: string;
  code: string;
  description?: string;
  type: DiscountType;
  value: number;
  minPurchaseAmount?: number;
  maxUses?: number;
  currentUses: number;
  validFrom: string; // ISO String
  validUntil: string;
  active: boolean;
}

export interface WaitlistEntry {
  id: string;
  providerId: string;
  professionalId?: string;
  clientId: string;
  clientName?: string;
  requestedDate: string; // YYYY-MM-DD
  requestedStartTime: string; // HH:mm
  requestedEndTime: string; // HH:mm
  status: WaitlistStatus;
  notes?: string;
  createdAt: string;
}

// ============================================================================
// 6. FINANCIAL & POS (Caixa e Despesas)
// ============================================================================

export interface CashRegister {
  id: string;
  providerId: string;
  openedAt: string;
  closedAt?: string;
  status: "OPEN" | "CLOSED";
  initialBalance: number;
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  openedByUserId: string;
  closedByUserId?: string;
}

export interface Expense {
  id: string;
  providerId: string;
  description: string;
  amount: number;
  date: string; // ISO String
  category: string;
  type: "ONE_TIME" | "RECURRING" | "one-time" | "recurring";
  frequency?: "MONTHLY" | "monthly" | string;
}

// Baseado no FinancialDashboardResponse.java
export interface FinancialDashboardData {
  totalRevenue: number;
  netIncome: number;
  totalExpenses: number;
  totalCommissions: number;
  balance: number;
  pendingPayouts: number;
  dailyCashFlow: Array<{
    date: string;
    income: number;
    expense: number;
    net: number;
  }>;
  topServices: Array<{ name: string; revenue: number; count: number }>;
  topProfessionals: Array<{
    name: string;
    revenue: number;
    commission: number;
  }>;
  occupancyReport: {
    occupancyRate: number;
    totalSlots: number;
    bookedSlots: number;
    cancelledSlots: number;
    noShowSlots: number;
  };
}

// ============================================================================
// 7. GOOGLE CALENDAR
// ============================================================================

export interface GoogleConnectionStatus {
  isConnected: boolean;
  email?: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
}

// ============================================================================
// 8. REQUEST DTOs (Para usar no Front-end ao enviar dados via Axios)
// ============================================================================

export interface ClientRegisterData {
  role: "client" | "CLIENT";
  name: string;
  email: string;
  password?: string; // Opcional se for Google Login
  phone?: string;
  cpf: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface ProviderRegisterData {
  role: "serviceProvider" | "SERVICE_PROVIDER";
  name: string;
  email: string;
  password?: string;
  businessName: string;
  document: string; // CPF ou CNPJ
  phone?: string;
  address: {
    zipCode: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
  };
}

export type RegisterData = ClientRegisterData | ProviderRegisterData;

export interface CreateAppointmentRequest {
  professionalId: string;
  clientId: string; // Em caso do provedor marcando para o cliente
  startTime: string; // ISO String
  endTime: string; // ISO String
  items: Array<{
    referenceId: string; // Service ID ou Product ID
    type: "SERVICE" | "PRODUCT";
    quantity: number;
  }>;
  couponCode?: string;
  notes?: string;
}

export interface CompleteAppointmentRequest {
  paymentMethod: PaymentMethod;
  finalAmount: number;
  discountAmount?: number;
  notes?: string;
}

export interface ProviderSearchCriteria {
  city?: string;
  state?: string;
  minRating?: number;
  maxPrice?: number;
  serviceName?: string;
  page?: number;
  size?: number;
}

// ============================================================================
// NOTIFICATIONS (In-App)
// ============================================================================

export interface Notification {
  id: string; // UUID vindo do Java
  userId: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string; // ISO String (ex: "2026-02-21T10:00:00Z")
}

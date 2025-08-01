// src/types.ts

// Interface para o endereço estruturado
export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // em minutos
  price: number;
}

export interface DayAvailability {
  active: boolean;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  breakStartTime?: string;
  breakEndTime?: string;
}

export interface Availability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

// Interface para o Profissional
export interface Professional {
  id: string;
  name: string;
  photoURL?: string;
  services: Service[];
  availability?: Availability;
}

export interface UserProfile {
  uid: string;
  email: string;
  createdAt: any;
  userType: 'client' | 'serviceProvider';
  
  phoneNumber?: string;
  photoURL?: string;
  address?: Address;

  displayName?: string; 
  favoriteProfessionals?: string[];

  establishmentName?: string;
  instagram?: string;
  whatsapp?: string;
  segment?: string;
  publicProfileSlug?: string; 
  professionals?: Professional[]; 
  cnpj?: string;
  cancellationPolicyMinutes?: number;
  bookingAdvanceDays?: number;
}

export interface Appointment {
  id: string;
  serviceProviderId: string;
  professionalId: string; 
  clientId: string;
  serviceIds: string[]; 
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  createdAt: any;
  
  serviceName?: string;
  professionalName?: string;
  clientName?: string;
  clientEmail?: string;
  professionalPhotoURL?: string;
  cancellationPolicyMinutes?: number;
  totalPrice?: number;
}

// NOVA interface para Despesas
export interface Expense {
  id: string;
  serviceProviderId: string;
  description: string;
  category: 'Aluguel' | 'Água' | 'Luz' | 'Salários' | 'Produtos' | 'Marketing' | 'Outros';
  amount: number;
  isFixed: boolean;
  date: string; // 'YYYY-MM-DD'
  createdAt: any;
}

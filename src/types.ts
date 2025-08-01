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
  serviceIds: string[]; // <-- ATUALIZADO AQUI
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: any;
  
  // Estes campos serão montados dinamicamente na UI
  serviceName?: string; // Pode representar múltiplos serviços concatenados
  professionalName?: string;
  clientName?: string;
  clientEmail?: string;
  professionalPhotoURL?: string;
  cancellationPolicyMinutes?: number;
}

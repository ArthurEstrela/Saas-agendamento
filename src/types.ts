// src/types.ts

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

export interface UserProfile {
  uid: string;
  email: string;
  createdAt: any;
  userType: 'client' | 'serviceProvider';
  
  phoneNumber?: string;
  displayName?: string; 
  favoriteProfessionals?: string[];

  establishmentName?: string;
  address?: string;
  instagram?: string;
  whatsapp?: string;
  photoURL?: string;
  segment?: string;
  services?: Service[];
  availability?: Availability;
  cnpj?: string;
  cancellationPolicyMinutes?: number;
  bookingAdvanceDays?: number;
}

export interface Appointment {
  id: string;
  serviceProviderId: string;
  clientId: string;
  serviceId: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: any;
  
  serviceName?: string;
  professionalName?: string;
  clientName?: string;
  clientEmail?: string;
  professionalPhotoURL?: string;
  cancellationPolicyMinutes?: number;
}

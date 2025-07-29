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

export interface ProfessionalProfile {
  uid: string;
  displayName: string;
  email: string;
  userType: 'serviceProvider';
  segment: string;
  address: string;
  services?: Service[];
  availability?: Availability;
}

export interface Appointment {
  id: string;
  serviceProviderId: string;
  clientId: string;
  serviceId: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  serviceName?: string;
  professionalName?: string;
  clientEmail?: string;
}
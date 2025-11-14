// Em src/hooks/useFilteredAppointments.ts

import { useMemo } from "react";
import type { Appointment, UserProfile, ProfessionalProfile } from "../types";
// Importe este tipo do seu AgendaView (terá de o exportar de lá)
import type { AgendaTab } from "../components/ServiceProvider/Agenda/AgendaView";
import { 
  isPast, 
  addDays, 
  subDays, 
  isWithinInterval, 
  startOfDay, 
  endOfDay 
} from "date-fns";

/**
 * Hook customizado para aplicar a lógica de filtragem complexa da Agenda.
 * Inclui filtragem de segurança por role (Dono vs Profissional).
 */
export const useFilteredAppointments = (
  allAppointments: Appointment[],
  userProfile: UserProfile,
  selectedProfessionalId: string, // "all" ou um ID (usado apenas pelo Dono)
  activeTab: AgendaTab,
  selectedDay: Date,
  viewMode: string
) => {

  // --- PASSO 1: FILTRO DE SEGURANÇA POR ROLE (FASE 4) ---
  const professionalFiltered = useMemo(() => {
    const isOwner = userProfile.role === "serviceProvider";
    
    if (isOwner) {
      if (selectedProfessionalId === "all") {
        return allAppointments; // Dono a ver "Todos"
      }
      // Dono a ver um profissional específico
      return allAppointments.filter(
        (appt) => appt.professionalId === selectedProfessionalId
      );
    }
    
    // Se não é dono, é um profissional. Filtra FORÇADAMENTE pelo seu próprio ID (uid).
    const professionalId = (userProfile as ProfessionalProfile).id;
    return allAppointments.filter(
      (appt) => appt.professionalId === professionalId
    );
    
  }, [allAppointments, userProfile, selectedProfessionalId]);

  // --- PASSO 2: FILTRO POR TAB E DATA (A SUA LÓGICA ORIGINAL) ---
  // Este 'useMemo' depende da lista JÁ FILTRADA POR ROLE
  return useMemo(() => {
    let filtered = professionalFiltered;
    
    const beginningOfToday = startOfDay(new Date());
    const startOfSelectedDay = startOfDay(selectedDay);
    const endOfSelectedDay = endOfDay(selectedDay);
    const endOf30DaysForward = endOfDay(addDays(selectedDay, 30));
    const startOf30DaysAgo = startOfDay(subDays(selectedDay, 30));

    switch (activeTab) {
      case "requests":
        filtered = filtered.filter((a) => a.status === "pending");
        break;

      case "pendingIssues":
        filtered = filtered.filter(
          (a) =>
            a.status === "scheduled" &&
            isPast(a.endTime) &&
            a.endTime < beginningOfToday
        );
        break;

      case "scheduled":
        filtered = filtered.filter(
          (a) => a.status === "scheduled" || a.status === "pending"
        );
        if (viewMode !== "calendar") {
          filtered = filtered.filter((a) =>
            isWithinInterval(a.startTime, {
              start: startOfSelectedDay,
              end: endOf30DaysForward,
            })
          );
        }
        break;

      case "history":
        filtered = filtered.filter(
          (a) => a.status === "completed" || a.status === "cancelled"
        );
        filtered = filtered.filter((a) =>
          isWithinInterval(a.startTime, {
            start: startOf30DaysAgo,
            end: endOfSelectedDay,
          })
        );
        break;
    }

    // A sua ordenação original
    return filtered.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [
    professionalFiltered, // <-- Depende da lista já filtrada
    activeTab,
    selectedDay,
    viewMode,
  ]);
};
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
  endOfDay,
} from "date-fns";

// --- Função Utilitária para Datas Seguras ---
// Garante que, independentemente do que vem da API, transformamos num objeto Date válido
const normalizeDate = (dateValue: unknown): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
    return (dateValue as { toDate: () => Date }).toDate();
  }
  return new Date(dateValue as string | number);
};

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
    // Normaliza o role para lidar com diferenças entre Firebase e Java (SERVICE_PROVIDER)
    const role = userProfile.role.toLowerCase();
    const isOwner = role === "serviceprovider" || role === "service_provider";

    if (isOwner) {
      if (selectedProfessionalId === "all") {
        return allAppointments; // Dono a ver "Todos"
      }
      // Dono a ver um profissional específico
      return allAppointments.filter(
        (appt) => appt.professionalId === selectedProfessionalId
      );
    }

    // Se não é dono, é um profissional. Filtra FORÇADAMENTE pelo seu próprio ID.
    const profProfile = userProfile as ProfessionalProfile;
    const profId = profProfile.id || profProfile.professionalId;
    
    return allAppointments.filter(
      (appt) => appt.professionalId === profId
    );
  }, [allAppointments, userProfile, selectedProfessionalId]);

  // --- PASSO 2: FILTRO POR TAB E DATA ---
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
        // Fallback case-insensitive para os status do Java
        filtered = filtered.filter((a) => a.status.toLowerCase() === "pending");
        break;

      case "pendingIssues":
        filtered = filtered.filter((a) => {
          const status = a.status.toLowerCase();
          const endDate = normalizeDate(a.endTime); // Normaliza antes de comparar
          return (
            status === "scheduled" &&
            isPast(endDate) &&
            endDate < beginningOfToday
          );
        });
        break;

      case "scheduled":
        filtered = filtered.filter((a) => {
          const status = a.status.toLowerCase();
          return status === "scheduled" || status === "pending";
        });
        if (viewMode !== "calendar") {
          filtered = filtered.filter((a) =>
            isWithinInterval(normalizeDate(a.startTime), {
              start: startOfSelectedDay,
              end: endOf30DaysForward,
            })
          );
        }
        break;

      case "history":
        filtered = filtered.filter((a) => {
          const status = a.status.toLowerCase();
          return status === "completed" || status === "cancelled";
        });
        filtered = filtered.filter((a) =>
          isWithinInterval(normalizeDate(a.startTime), {
            start: startOf30DaysAgo,
            end: endOfSelectedDay,
          })
        );
        break;
    }

    // A sua ordenação original, mas agora protegida contra ISO Strings da API
    return filtered.sort(
      (a, b) => normalizeDate(a.startTime).getTime() - normalizeDate(b.startTime).getTime()
    );
  }, [
    professionalFiltered, // <-- Depende da lista já filtrada
    activeTab,
    selectedDay,
    viewMode,
  ]);
};
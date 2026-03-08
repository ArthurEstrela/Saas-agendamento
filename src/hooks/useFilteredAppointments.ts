import { useMemo } from "react";
import type { Appointment, UserProfile, ProfessionalProfile } from "../types";
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
const normalizeDate = (dateValue: unknown): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  if (
    typeof dateValue === "object" &&
    dateValue !== null &&
    "toDate" in dateValue
  ) {
    return (dateValue as { toDate: () => Date }).toDate();
  }
  return new Date(dateValue as string | number);
};

export const useFilteredAppointments = (
  allAppointments: Appointment[],
  userProfile: UserProfile | null | undefined, // ✨ Maior segurança de tipagem
  selectedProfessionalId: string,
  activeTab: AgendaTab,
  selectedDay: Date,
  viewMode: string,
) => {
  // --- PASSO 1: FILTRO DE SEGURANÇA POR ROLE ---
  const professionalFiltered = useMemo(() => {
    // ✨ Adicionado fallback de segurança caso userProfile.role seja undefined no primeiro render
    const role = (userProfile?.role || "").toLowerCase();
    const isOwner = role === "serviceprovider" || role === "service_provider";

    if (isOwner) {
      if (selectedProfessionalId === "all") {
        return allAppointments;
      }
      return allAppointments.filter(
        (appt) => appt.professionalId === selectedProfessionalId,
      );
    }

    if (!userProfile) return [];

    const profProfile = userProfile as ProfessionalProfile;
    const profId = profProfile.id || profProfile.professionalId;

    return allAppointments.filter((appt) => appt.professionalId === profId);
  }, [allAppointments, userProfile, selectedProfessionalId]);

  // --- PASSO 2: FILTRO POR TAB E DATA ---
  return useMemo(() => {
    let filtered = professionalFiltered;

    const beginningOfToday = startOfDay(new Date());
    const startOfSelectedDay = startOfDay(selectedDay);
    const endOfSelectedDay = endOfDay(selectedDay);
    const endOf30DaysForward = endOfDay(addDays(selectedDay, 30));
    const startOf30DaysAgo = startOfDay(subDays(selectedDay, 30));

    switch (activeTab) {
      case "requests":
        filtered = filtered.filter((a) => a.status.toLowerCase() === "pending");
        break;

      case "pendingIssues":
        filtered = filtered.filter((a) => {
          const status = a.status.toLowerCase();
          const endDate = normalizeDate(a.endTime);
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
            }),
          );
        }
        break;

      case "history":
        filtered = filtered.filter((a) => {
          const status = a.status.toLowerCase();
          return (
            status === "completed" ||
            status === "cancelled" ||
            status === "rejected"
          ); // ✨ Adicionado rejected pro histórico se quiser
        });
        filtered = filtered.filter((a) =>
          isWithinInterval(normalizeDate(a.startTime), {
            start: startOf30DaysAgo,
            end: endOfSelectedDay,
          }),
        );
        break;
    }

    return filtered.sort(
      (a, b) =>
        normalizeDate(a.startTime).getTime() -
        normalizeDate(b.startTime).getTime(),
    );
  }, [professionalFiltered, activeTab, selectedDay, viewMode]);
};

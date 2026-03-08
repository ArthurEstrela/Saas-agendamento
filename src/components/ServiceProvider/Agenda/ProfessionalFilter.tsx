import { useMemo, useEffect } from "react";
import { useAuthStore } from "../../../store/authStore";
import { useProfessionalsManagementStore } from "../../../store/professionalsManagementStore";
import { Users, Loader2 } from "lucide-react"; // ✨ Adicionado Loader2
import type { ProfessionalProfile } from "../../../types";

// UI
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

// Estendemos a interface para suportar a flag visual 'isOwner' sem recorrer a 'any'
type TeamMember = ProfessionalProfile & {
  isOwner?: boolean;
  photoURL?: string; // Fallback caso o cache local ainda tenha o padrão antigo
};

interface ProfessionalFilterProps {
  selectedProfessionalId: string;
  onSelectProfessional: (id: string) => void;
}

export const ProfessionalFilter = ({
  selectedProfessionalId,
  onSelectProfessional,
}: ProfessionalFilterProps) => {
  // Lemos o utilizador do AuthStore (Nova arquitetura)
  const { user } = useAuthStore();

  // ✨ Lemos a lista, o loading E a função de fetch do store dedicado
  const { professionals, loading, fetchProfessionals } =
    useProfessionalsManagementStore();

  // ✨ CORREÇÃO DEFINITIVA: Checagem segura contra NULL e ID correto
  useEffect(() => {
    if (user && user.role?.toUpperCase() === "SERVICE_PROVIDER") {
      // Pega o providerId de forma segura (no novo Java Backend às vezes vem em providerId)
      const providerId = (user as any).providerId || (user as any).id;

      if ((!professionals || professionals.length === 0) && providerId) {
        fetchProfessionals(providerId);
      }
    }
  }, [
    user,
    fetchProfessionals,
    // ✨ Aqui estava o erro! Avaliação segura para não quebrar a tela:
    professionals ? professionals.length : 0,
  ]);

  // Movido para DENTRO do useMemo para evitar re-renders desnecessários!
  const sortedTeam = useMemo(() => {
    // Garante que team é sempre um array válido sem quebrar as referências de dependência
    const team = (professionals as TeamMember[]) || [];

    return [...team].sort((a, b) => {
      // Dono sempre primeiro
      if (a.isOwner && !b.isOwner) return -1;
      if (!a.isOwner && b.isOwner) return 1;

      // Se não, organiza alfabeticamente
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [professionals]);

  // Se não for prestador/dono, não mostra o filtro
  const userRole = user?.role?.toUpperCase();
  if (userRole !== "SERVICE_PROVIDER") return null;

  return (
    <div className="w-full">
      <label className="text-[10px] uppercase font-bold text-gray-500 mb-1.5 block px-1">
        Filtrar Agenda por:
      </label>
      <Select
        value={selectedProfessionalId}
        onValueChange={onSelectProfessional}
      >
        <SelectTrigger className="w-full h-11 bg-gray-900 border-gray-800 text-gray-200 hover:bg-gray-800 transition-colors focus:ring-1 focus:ring-primary/50 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="p-1.5 bg-gray-800 rounded-md shrink-0">
              {/* ✨ Se estiver carregando pela primeira vez, mostra o spinner no lugar do ícone */}
              {loading && (!professionals || professionals.length === 0) ? (
                <Loader2 size={16} className="text-primary animate-spin" />
              ) : (
                <Users size={16} className="text-primary" />
              )}
            </div>
            <span className="truncate text-sm font-medium flex-1 text-left">
              <SelectValue placeholder="Selecione um profissional" />
            </span>
          </div>
        </SelectTrigger>

        <SelectContent className="bg-gray-900 border-gray-800 max-h-[40vh] z-50">
          <SelectItem
            value="all"
            className="focus:bg-gray-800 cursor-pointer py-3"
          >
            <span className="font-medium text-white pl-1">Todos da Equipe</span>
          </SelectItem>

          <div className="h-px bg-gray-800 my-1 mx-2" />

          {sortedTeam.map((prof) => {
            // Usa o padrão novo da API, com fallback para o antigo
            const displayImage = prof.profilePictureUrl || prof.photoURL;
            const displayName = prof.name || "Profissional";

            return (
              <SelectItem
                key={prof.id}
                value={prof.id}
                className="focus:bg-gray-800 cursor-pointer py-2.5"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7 border border-gray-700">
                    <AvatarImage src={displayImage} className="object-cover" />
                    <AvatarFallback className="text-[10px] bg-gray-800 text-gray-400">
                      {displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="truncate text-sm text-gray-200 font-medium max-w-[180px]">
                      {displayName}
                    </span>
                    {prof.isOwner && (
                      <span className="text-[10px] text-gray-500 -mt-0.5">
                        Administrador
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

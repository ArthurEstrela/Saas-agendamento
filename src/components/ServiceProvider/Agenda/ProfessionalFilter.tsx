import { useMemo } from "react";
import { useProfileStore } from "../../../store/profileStore";
import { Users, ChevronDown } from "lucide-react";

// UI
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

interface ProfessionalFilterProps {
  selectedProfessionalId: string;
  onSelectProfessional: (id: string) => void;
}

export const ProfessionalFilter = ({
  selectedProfessionalId,
  onSelectProfessional,
}: ProfessionalFilterProps) => {
  const { userProfile, professionals } = useProfileStore();

  const team = professionals || [];

  const sortedTeam = useMemo(() => {
    return [...team].sort((a, b) => {
      // Dono sempre primeiro
      if (a.isOwner && !b.isOwner) return -1;
      if (!a.isOwner && b.isOwner) return 1;
      return 0;
    });
  }, [team]);

  // Se não for prestador (ou não tiver perfil), não mostra
  if (userProfile?.role !== "serviceProvider") return null;

  return (
    <div className="w-full"> {/* Container Full Width no mobile */}
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
              <Users size={16} className="text-primary" />
            </div>
            <span className="truncate text-sm font-medium flex-1 text-left">
              <SelectValue placeholder="Selecione um profissional" />
            </span>
          </div>
        </SelectTrigger>

        <SelectContent className="bg-gray-900 border-gray-800 max-h-[40vh] z-50">
          <SelectItem value="all" className="focus:bg-gray-800 cursor-pointer py-3">
            <span className="font-medium text-white pl-1">Todos da Equipe</span>
          </SelectItem>

          <div className="h-px bg-gray-800 my-1 mx-2" />

          {sortedTeam.map((prof) => (
            <SelectItem
              key={prof.id}
              value={prof.id}
              className="focus:bg-gray-800 cursor-pointer py-2.5"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-7 w-7 border border-gray-700">
                  <AvatarImage src={prof.photoURL} className="object-cover" />
                  <AvatarFallback className="text-[10px] bg-gray-800 text-gray-400">
                    {prof.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                    <span className="truncate text-sm text-gray-200 font-medium max-w-[180px]">
                    {prof.name}
                    </span>
                    {prof.isOwner && (
                    <span className="text-[10px] text-gray-500 -mt-0.5">Administrador</span>
                    )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
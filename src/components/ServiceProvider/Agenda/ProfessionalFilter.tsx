import { useMemo } from "react";
import { useProfileStore } from "../../../store/profileStore";
import { Users } from "lucide-react";

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

  // 1. Definição das variáveis de dados (Hooks e derivados devem ficar aqui)
  const team = professionals || [];

  // 2. O useMemo deve ser chamado SEMPRE, independente do return
  const sortedTeam = useMemo(() => {
    return [...team].sort((a, b) => {
      // Dono (isOwner) sempre vem primeiro (-1)
      if (a.isOwner && !b.isOwner) return -1;
      if (!a.isOwner && b.isOwner) return 1;
      return 0;
    });
  }, [team]);

  // 3. AGORA sim podemos fazer o Early Return
  // Se não for prestador, não renderiza nada
  if (userProfile?.role !== "serviceProvider") return null;

  return (
    <div className="w-full sm:w-[220px]">
      <Select
        value={selectedProfessionalId}
        onValueChange={onSelectProfessional}
      >
        <SelectTrigger className="h-10 bg-gray-900/80 border-gray-800 text-gray-200 hover:bg-gray-800 transition-colors focus:ring-1 focus:ring-primary/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1 bg-gray-800 rounded-md shrink-0">
              <Users size={14} className="text-gray-400" />
            </div>
            <span className="truncate text-sm font-medium">
              <SelectValue placeholder="Filtrar Profissional" />
            </span>
          </div>
        </SelectTrigger>

        <SelectContent className="bg-gray-900 border-gray-800 max-h-[300px]">
          <SelectItem value="all" className="focus:bg-gray-800 cursor-pointer">
            <span className="font-medium text-gray-300">Todos da Equipe</span>
          </SelectItem>

          <div className="h-px bg-gray-800 my-1 mx-2" />

          {/* Lista Unificada (Dono + Equipe) */}
          {sortedTeam.map((prof) => (
            <SelectItem
              key={prof.id}
              value={prof.id}
              className="focus:bg-gray-800 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Avatar className="h-6 w-6 border border-gray-700">
                  <AvatarImage src={prof.photoURL} className="object-cover" />
                  <AvatarFallback className="text-[9px] bg-gray-800">
                    {prof.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[140px]">
                  {prof.name}{" "}
                  {prof.isOwner && (
                    <span className="text-gray-500 text-xs">(Você)</span>
                  )}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

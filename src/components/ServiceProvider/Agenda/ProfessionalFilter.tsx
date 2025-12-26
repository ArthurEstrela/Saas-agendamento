import { useProfileStore } from "../../../store/profileStore";
import type { ServiceProviderProfile } from "../../../types";
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

  if (userProfile?.role !== "serviceProvider") return null;
  const profile = userProfile as ServiceProviderProfile;
  const team = professionals || [];

  return (
    <div className="w-full sm:w-[200px]">
      <Select
        value={selectedProfessionalId}
        onValueChange={onSelectProfessional}
      >
        <SelectTrigger className="h-9 bg-gray-900 border-gray-800 text-gray-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <Users size={14} className="text-gray-500 shrink-0" />
            <SelectValue placeholder="Filtrar Profissional" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-800">
          <SelectItem value="all">
            <span className="font-medium">Todos</span>
          </SelectItem>

          {/* O Dono */}
          <SelectItem value={profile.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5 border border-gray-700">
                <AvatarImage src={profile.logoUrl} />
                <AvatarFallback className="text-[9px]">EU</AvatarFallback>
              </Avatar>
              <span>{profile.businessName} (Eu)</span>
            </div>
          </SelectItem>

          {/* Equipe */}
          {team.map((prof) => (
            <SelectItem key={prof.id} value={prof.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 border border-gray-700">
                  <AvatarImage src={prof.photoURL} />
                  <AvatarFallback className="text-[9px]">
                    {prof.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{prof.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

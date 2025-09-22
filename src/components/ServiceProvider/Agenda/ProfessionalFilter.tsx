// src/components/ServiceProvider/Agenda/ProfessionalFilter.tsx
import { useState } from "react";
import type { Professional } from "../../../types";
import { ChevronDown, User, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useProfileStore } from "../../../store/profileStore";
import type { ServiceProviderProfile } from "../../../types";

interface ProfessionalFilterProps {
  selectedProfessionalId: string | null;
  onSelectProfessional: (id: string | null) => void;
}

export const ProfessionalFilter = ({
  selectedProfessionalId,
  onSelectProfessional,
}: ProfessionalFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userProfile } = useProfileStore();
  const professionals =
    (userProfile as ServiceProviderProfile)?.professionals || [];

  const selectedProfessional = professionals.find(
    (p) => p.id === selectedProfessionalId
  );

  return (
    <div className="relative w-full sm:w-52">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <span className="flex items-center gap-2">
          {selectedProfessional ? (
            <>
              <img
                src={selectedProfessional.photoURL || "/placeholder-user.svg"}
                alt={selectedProfessional.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="font-semibold">{selectedProfessional.name}</span>
            </>
          ) : (
            <>
              <Users size={18} className="text-gray-400" />
              <span className="font-semibold">Todos os Profissionais</span>
            </>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
          >
            <ul className="py-1">
              <li
                onClick={() => {
                  onSelectProfessional(null);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-amber-500/10 hover:text-amber-400 cursor-pointer"
              >
                <Users size={18} />
                <span>Todos os Profissionais</span>
              </li>
              {professionals.map((prof) => (
                <li
                  key={prof.id}
                  onClick={() => {
                    onSelectProfessional(prof.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-amber-500/10 hover:text-amber-400 cursor-pointer"
                >
                  <img
                    src={prof.photoURL || "/placeholder-user.svg"}
                    alt={prof.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span>{prof.name}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

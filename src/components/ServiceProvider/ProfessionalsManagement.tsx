import { useState, useMemo, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  useProfessionalsManagementStore,
  type ProfessionalPayload,
} from "../../store/professionalsManagementStore";
import { useServiceManagementStore } from "../../store/serviceManagementStore";
import { ProfessionalModal } from "./ProfessionalModal";
import { ProfessionalCard } from "./ProfessionalCard";
import { ConfirmationModal } from "../Common/ConfirmationModal";
import {
  Loader2,
  Users,
  UserPlus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { ProfessionalProfile } from "../../types";

// UI
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";

type ProfessionalFormData = {
  name: string;
  email?: string;
  password?: string;
  serviceIds: string[];
};

export const ProfessionalsManagement = () => {
  const { user } = useAuthStore();
  const { services, fetchServices } = useServiceManagementStore();

  const {
    professionals,
    loading: isLoading,
    createProfessional,
    updateProfessional,
    deleteProfessional: removeProfessional,
    fetchProfessionals,
  } = useProfessionalsManagementStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<ProfessionalProfile | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    prof: ProfessionalProfile | null;
  }>({ isOpen: false, prof: null });

  // Busca inicial (Carrega Profissionais E Serviços)
  useEffect(() => {
    let targetProviderId: string | undefined;

    if (user?.role === "PROFESSIONAL") {
      targetProviderId = (user as unknown as { serviceProviderId: string })
        .serviceProviderId;
    } else if (user?.role === "SERVICE_PROVIDER") {
      targetProviderId = user.providerId || user.id;
    }

    if (targetProviderId) {
      fetchProfessionals(targetProviderId);
      fetchServices(targetProviderId);
    }
  }, [user, fetchProfessionals, fetchServices]);

  // Ordena: Dono primeiro, depois alfabético
  const sortedProfessionals = useMemo(() => {
    if (!professionals) return [];
    return [...professionals].sort((a, b) => {
      if (a.isOwner) return -1;
      if (b.isOwner) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [professionals]);

  // ✨ VERIFICAÇÃO OFICIAL: Confia na flag que vem do banco de dados agora
  const hasOwnerProfile = useMemo(() => {
    if (!professionals) return false;
    return professionals.some((p) => p.isOwner === true);
  }, [professionals]);

  // Bloqueia a renderização se não for o dono do salão
  if (!user || user.role?.toUpperCase() !== "SERVICE_PROVIDER") return null;

  // -- Funções de Handler --

  const handleOpenModal = (prof: ProfessionalProfile | null = null) => {
    // ✨ Agora passamos o objeto puro, pois o backend já traz o isOwner corretamente
    setEditingProfessional(prof);
    setIsModalOpen(true);
  };

  const handleSave = async (
    formData: ProfessionalFormData,
    photoFile: File | null,
  ) => {
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      serviceIds: formData.serviceIds,
    } as unknown as Partial<ProfessionalProfile>;

    try {
      if (editingProfessional) {
        await updateProfessional(
          editingProfessional.id,
          payload,
          photoFile || undefined,
        );
      } else {
        const targetProviderId = user.providerId || user.id;
        await createProfessional(
          targetProviderId,
          payload,
          photoFile || undefined,
        );
      }

      setIsModalOpen(false);
      setEditingProfessional(null);
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
    }
  };

  const confirmDelete = async () => {
    if (confirmState.prof) {
      try {
        await removeProfessional(confirmState.prof.id);
        setConfirmState({ isOpen: false, prof: null });
      } catch (error) {
        console.error("Erro ao deletar profissional:", error);
      }
    }
  };

  const handleActivateOwner = async () => {
    try {
      const payload = {
        name: user.name,
        email: user.email,
        serviceIds: services.map((s) => s.id),
        isOwner: true, // ✨ Envia explicitamente que é dono
      } as ProfessionalPayload;

      const targetProviderId = user.providerId || user.id;
      
      // Cria o profissional
      await createProfessional(targetProviderId, payload);
      
      // ✨ RE-FETCH DE SEGURANÇA: Garante que a tela pegue os dados exatos do banco
      // para esconder o botão instantaneamente.
      await fetchProfessionals(targetProviderId);
      
    } catch (error) {
      console.error("Erro ao ativar dono:", error);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <Typography variant="h2" className="text-3xl font-bold">
            Equipe
          </Typography>
          <Typography variant="muted" className="mt-1">
            Gerencie os profissionais e suas especialidades.
          </Typography>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          disabled={isLoading}
          className="gap-2 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <UserPlus size={18} /> Novo Profissional
        </Button>
      </div>

      {/* BANNER DE ATIVAÇÃO */}
      {/* ✨ Corrigido: Removido o professionals.length > 0 para o banner aparecer mesmo se a equipe estiver vazia */}
      {!hasOwnerProfile && professionals !== null && !isLoading && (
        <div className="bg-blue-900/20 border border-blue-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 mb-8 animate-fade-in shadow-lg shadow-blue-900/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>

          <div className="flex items-start gap-4 z-10">
            <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 mt-1 shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-blue-100 mb-1">
                Ative seu perfil na agenda
              </h4>
              <p className="text-sm text-blue-300 leading-relaxed max-w-xl">
                Você é o administrador, mas ainda não aparece para os clientes
                agendarem. Ative seu perfil de atendimento para começar a
                receber agendamentos.
              </p>
            </div>
          </div>

          <Button
            onClick={handleActivateOwner}
            disabled={isLoading}
            className="whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-6 h-auto shadow-xl shadow-blue-900/20 transition-all w-full md:w-auto z-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Ativando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2" size={20} />
                Ativar meu Perfil
              </>
            )}
          </Button>
        </div>
      )}

      {/* LISTAGEM DE PROFISSIONAIS */}
      {isLoading && (!professionals || professionals.length === 0) ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : sortedProfessionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProfessionals.map((prof) => (
            <ProfessionalCard
              key={prof.id}
              professional={prof} // ✨ Simplificado, já possui o isOwner correto
              onEdit={() => handleOpenModal(prof)}
              onDelete={() => setConfirmState({ isOpen: true, prof })}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl animate-fade-in">
          <div className="h-20 w-20 bg-gray-800/80 rounded-full flex items-center justify-center mb-4 text-gray-500 ring-4 ring-gray-900">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Sua equipe está vazia
          </h3>
          <p className="text-gray-400 mb-6 max-w-sm text-center">
            Comece adicionando profissionais ou ative seu próprio perfil acima.
          </p>
          <Button
            variant="outline"
            onClick={() => handleOpenModal()}
            disabled={isLoading}
          >
            <UserPlus className="mr-2" size={16} /> Adicionar Profissional
          </Button>
        </div>
      )}

      {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
      <ProfessionalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        professional={editingProfessional}
        availableServices={services}
        isLoading={isLoading}
      />

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, prof: null })}
        onConfirm={confirmDelete}
        // ✨ Usa a flag isOwner oficial para definir os textos
        title={
          confirmState.prof?.isOwner
            ? "Desativar Atendimento?"
            : "Remover Profissional?"
        }
        message={
          confirmState.prof?.isOwner
            ? "Ao remover seu perfil da equipe, você deixará de aparecer na agenda para novos agendamentos. Sua conta administrativa (painel) NÃO será excluída e você pode reativar a qualquer momento."
            : `Tem certeza que deseja remover "${confirmState.prof?.name}"? Esta ação não pode ser desfeita e removerá o profissional da agenda.`
        }
        confirmText={
          confirmState.prof?.isOwner
            ? "Desativar da Agenda"
            : "Remover Profissional"
        }
        variant="danger"
      />
    </div>
  );
};
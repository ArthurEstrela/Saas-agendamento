import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import type { Appointment } from "../types";
import logo from "../assets/stylo-logo.png";
import {
  LayoutDashboard,
  User,
  Scissors,
  Users,
  Clock,
  DollarSign,
  Star,
  LogOut,
  Check,
  X,
  UserX,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "../context/ToastContext"; // Importar useToast

// Importando os seus componentes de gerenciamento existentes
import ProfileManagement from "./ServiceProvider/ProfileManagement";
import ServicesManagement from "./ServiceProvider/ServicesManagement";
import ProfessionalsManagement from "./ServiceProvider/ProfessionalsManagement";
import AvailabilityManagement from "./ServiceProvider/AvailabilityManagement";
import FinancialManagement from "./ServiceProvider/FinancialManagement";
import ReviewsManagement from "./ServiceProvider/ReviewsManagement";

// --- Subcomponente de Modal de Confirmação ---
const ConfirmationModal = ({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-down">
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center w-full max-w-md">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-300 mb-8">{message}</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onConfirm}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

// --- Subcomponente de Modal para Confirmar Serviço com Preço ---
const CompleteServiceModal = ({ isOpen, appointment, onClose, onConfirm }) => {
  const [price, setPrice] = useState<string>("");

  useEffect(() => {
    if (isOpen && appointment?.totalPrice) {
      setPrice(appointment.totalPrice.toFixed(2));
    } else if (isOpen) {
      setPrice(""); // Limpa o preço ao abrir para um novo agendamento
    }
  }, [isOpen, appointment]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const finalPrice = parseFloat(price);
    if (isNaN(finalPrice) || finalPrice < 0) {
      // Poderia usar um toast aqui para informar o usuário sobre o preço inválido
      alert("Por favor, insira um valor de preço válido."); // Temporário, substituir por Toast
      return;
    }
    onConfirm(appointment.id, finalPrice);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-down">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">
          Confirmar Serviço Concluído
        </h3>
        <p className="text-gray-300 mb-4">
          Serviço:{" "}
          <span className="font-semibold">{appointment?.serviceName}</span>
        </p>
        <p className="text-gray-300 mb-4">
          Cliente:{" "}
          <span className="font-semibold">{appointment?.clientName}</span>
        </p>
        <div className="mb-6">
          <label
            htmlFor="price"
            className="block text-left text-gray-300 text-sm font-semibold mb-2"
          >
            Valor Final do Serviço (R$):
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-[#daa520] focus:border-transparent"
            placeholder="Ex: 50.00"
          />
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Concluir e Registrar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Componentes do Layout do Dashboard ---

const NavItem = ({ icon: Icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full h-12 px-4 text-left transition-all duration-300 ease-in-out group ${
      active
        ? "bg-[#daa520] text-black rounded-lg shadow-lg shadow-[#daa520]/20"
        : "text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-md"
    }`}
  >
    <Icon className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
    <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">
      {text}
    </span>
  </button>
);

const SideNav = ({ activeView, setActiveView }) => {
  const { logout, userProfile } = useAuth();
  return (
    <div className="w-72 h-screen bg-black p-4 flex flex-col border-r border-gray-800 fixed top-0 left-0">
      <div className="flex items-center space-x-2 mb-10 px-2">
        <Link to="/">
          <img className="h-10 w-auto" src={logo} alt="Stylo" />
        </Link>
      </div>
      <nav className="flex-grow flex flex-col space-y-2">
        <NavItem
          icon={LayoutDashboard}
          text="Agenda"
          active={activeView === "agenda"}
          onClick={() => setActiveView("agenda")}
        />
        <NavItem
          icon={Scissors}
          text="Serviços"
          active={activeView === "services"}
          onClick={() => setActiveView("services")}
        />
        <NavItem
          icon={Users}
          text="Profissionais"
          active={activeView === "professionals"}
          onClick={() => setActiveView("professionals")}
        />
        <NavItem
          icon={Clock}
          text="Disponibilidade"
          active={activeView === "availability"}
          onClick={() => setActiveView("availability")}
        />
        <NavItem
          icon={DollarSign}
          text="Financeiro"
          active={activeView === "financial"}
          onClick={() => setActiveView("financial")}
        />
        <NavItem
          icon={Star}
          text="Avaliações"
          active={activeView === "reviews"}
          onClick={() => setActiveView("reviews")}
        />
      </nav>
      <div className="mt-auto">
        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center px-2 mb-4">
            <img
              src={
                userProfile?.photoURL ||
                "https://placehold.co/150x150/111827/4B5563?text=Foto"
              }
              alt="Sua foto de perfil"
              className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-gray-700"
            />
            <div>
              <p className="text-sm font-semibold text-white truncate">
                {userProfile?.establishmentName || "Nome do Salão"}
              </p>
              <p className="text-xs text-gray-400">Prestador de Serviço</p>
            </div>
          </div>
          <NavItem
            icon={User}
            text="Meu Perfil"
            active={activeView === "profile"}
            onClick={() => setActiveView("profile")}
          />
          <button
            onClick={logout}
            className="flex items-center w-full h-12 px-4 mt-1 text-left text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all duration-300 ease-in-out group"
          >
            <LogOut className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">
              Sair
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para a Agenda
const AgendaView = () => {
  const { userProfile, updateAppointmentStatus } = useAuth();
  const { showToast } = useToast(); // Usar o toast aqui
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmationModalState, setConfirmationModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [completeServiceModalState, setCompleteServiceModalState] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  } | null>(null);
  const [agendaTab, setAgendaTab] = useState<"upcoming" | "history">(
    "upcoming"
  );
  const [historyFilters, setHistoryFilters] = useState({
    professionalId: "todos",
    clientName: "",
    dateStart: "",
    dateEnd: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // Quantos itens por página

  useEffect(() => {
    if (!userProfile?.uid) return;
    // Adiciona um listener em tempo real para os agendamentos
    const q = query(
      collection(db, "appointments"),
      where("serviceProviderId", "==", userProfile.uid)
    );
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        setLoading(true);
        const apptsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Appointment)
        );

        // Mapeia e busca detalhes adicionais para cada agendamento
        const appointmentsWithDetails = await Promise.all(
          apptsData.map(async (appt) => {
            // Busca o perfil do cliente
            const clientDocRef = doc(db, "users", appt.clientId);
            const clientSnap = await getDoc(clientDocRef);
            const clientProfile = clientSnap.data();

            // Encontra o profissional e calcula o preço total dos serviços
            const professional = userProfile.professionals?.find(
              (p) => p.id === appt.professionalId
            );
            let totalPrice = 0;
            const serviceNames =
              appt.serviceIds
                ?.map((serviceId) => {
                  const service = professional?.services.find(
                    (s) => s.id === serviceId
                  );
                  if (service) {
                    totalPrice += service.price;
                    return service.name;
                  }
                  return "Serviço Removido"; // Caso o serviço não seja encontrado
                })
                .join(", ") || "N/A";

            return {
              ...appt,
              clientName: clientProfile?.displayName || "Cliente Desconhecido",
              professionalName:
                professional?.name || "Profissional Desconhecido",
              serviceName: serviceNames,
              totalPrice: appt.totalPrice || totalPrice, // Usa o totalPrice salvo se existir, senão calcula
            };
          })
        );
        setAllAppointments(appointmentsWithDetails);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar agendamentos:", error);
        showToast("Erro ao carregar agendamentos.", "error");
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Limpa o listener ao desmontar o componente
  }, [userProfile, showToast]);

const { upcomingAppointments, historyAppointments } = useMemo(() => {
  const now = new Date();
  
  const upcoming = allAppointments
    .filter((app) => {
      const [year, month, day] = app.date.split("-").map(Number);
      const [hour, minute] = app.time.split(":").map(Number);
      const appDateTime = new Date(year, month - 1, day, hour, minute);
      return (
        appDateTime >= now &&
        (app.status === "pending" || app.status === "confirmed")
      );
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

  const history = allAppointments
    .filter((app) => {
      const [year, month, day] = app.date.split("-").map(Number);
      const [hour, minute] = app.time.split(":").map(Number);
      const appDateTime = new Date(year, month - 1, day, hour, minute);
      return (
        appDateTime < now ||
        app.status === "completed" ||
        app.status === "cancelled" ||
        app.status === "no-show"
      );
    })
    .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Ordem decrescente
    });

  return { upcomingAppointments: upcoming, historyAppointments: history };
}, [allAppointments]);

// 2. AGORA QUE `historyAppointments` EXISTE, podemos usá-la para criar a lista filtrada.
const filteredHistoryAppointments = useMemo(() => {
  let filtered = historyAppointments; // Agora isso funciona!

  // Filtrar por profissional
  if (historyFilters.professionalId !== "todos") {
    filtered = filtered.filter(
      (app) => app.professionalId === historyFilters.professionalId
    );
  }

  // Filtrar por nome do cliente
  if (historyFilters.clientName) {
    filtered = filtered.filter((app) =>
      app.clientName
        .toLowerCase()
        .includes(historyFilters.clientName.toLowerCase())
    );
  }

  // Filtrar por intervalo de datas
  if (historyFilters.dateStart) {
    const startDate = new Date(historyFilters.dateStart + "T00:00:00");
    filtered = filtered.filter((app) => new Date(app.date) >= startDate);
  }
  if (historyFilters.dateEnd) {
    const endDate = new Date(historyFilters.dateEnd + "T23:59:59");
    filtered = filtered.filter((app) => new Date(app.date) <= endDate);
  }

  return filtered;
}, [historyAppointments, historyFilters]);

// 3. POR FIM, com a lista filtrada pronta, criamos a paginação.
const totalPages = Math.ceil(
  filteredHistoryAppointments.length / ITEMS_PER_PAGE
);
const paginatedHistory = useMemo(() => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  return filteredHistoryAppointments.slice(startIndex, endIndex);
}, [currentPage, filteredHistoryAppointments]);

  // Função para abrir o modal de confirmação genérico
  const handleConfirmation = (
    action: () => void,
    title: string,
    message: string
  ) => {
    setConfirmationModalState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmationModalState(null);
      },
    });
  };

  // Função para confirmar o serviço como concluído (abre o modal de preço)
  const handleCompleteServiceClick = (appointment: Appointment) => {
    handleConfirmation(
      () => setCompleteServiceModalState({ isOpen: true, appointment }),
      "Confirmar Conclusão",
      `Tem a certeza de que pretende marcar o serviço de "${appointment.serviceName}" como concluído?`
    );
  };

  // Função chamada após o preço ser inserido no modal de conclusão
  const handleConfirmCompleteService = async (
    appointmentId: string,
    finalPrice: number
  ) => {
    if (!userProfile?.uid) return;
    await updateAppointmentStatus(
      appointmentId,
      userProfile.uid,
      "completed",
      finalPrice
    );
    setCompleteServiceModalState(null); // Fecha o modal de preço
  };

  // Função para marcar como "não compareceu"
  const handleNoShowClick = (appointment: Appointment) => {
    handleConfirmation(
      () => {
        if (userProfile?.uid) {
          updateAppointmentStatus(appointment.id, userProfile.uid, "no-show");
        }
      },
      "Confirmar Não Comparecimento",
      `Tem certeza que deseja marcar o agendamento de "${appointment.clientName}" para "${appointment.serviceName}" como "Não Compareceu"?`
    );
  };

  // Função para confirmar agendamento
  const handleConfirmAppointment = (appointment: Appointment) => {
    handleConfirmation(
      () => {
        if (userProfile?.uid) {
          updateAppointmentStatus(appointment.id, userProfile.uid, "confirmed");
        }
      },
      "Confirmar Agendamento",
      `Tem certeza que deseja confirmar o agendamento de "${appointment.clientName}" para "${appointment.serviceName}"?`
    );
  };

  // Função para cancelar agendamento
  const handleCancelAppointment = (appointment: Appointment) => {
    handleConfirmation(
      () => {
        if (userProfile?.uid) {
          updateAppointmentStatus(appointment.id, userProfile.uid, "cancelled");
        }
      },
      "Cancelar Agendamento",
      `Tem certeza que deseja cancelar o agendamento de "${appointment.clientName}" para "${appointment.serviceName}"? Esta ação não pode ser desfeita.`
    );
  };

  // Helper para exibir informações de status
  const getStatusInfo = (status: Appointment["status"], isPast: boolean) => {
    switch (status) {
      case "pending":
        return {
          text: "Pendente",
          color: "bg-yellow-500/20 text-yellow-300",
          icon: <Clock size={14} />,
        };
      case "confirmed":
        return {
          text: "Confirmado",
          color: isPast
            ? "bg-orange-500/20 text-orange-300"
            : "bg-green-500/20 text-green-300",
          icon: isPast ? <AlertTriangle size={14} /> : <Check size={14} />,
        };
      case "completed":
        return {
          text: "Concluído",
          color: "bg-blue-500/20 text-blue-300",
          icon: <CheckCircle size={14} />,
        };
      case "no-show":
        return {
          text: "Não Compareceu",
          color: "bg-red-500/20 text-red-300",
          icon: <UserX size={14} />,
        };
      case "cancelled":
        return {
          text: "Cancelado",
          color: "bg-gray-500/20 text-gray-300",
          icon: <X size={14} />,
        };
      default:
        return {
          text: "Desconhecido",
          color: "bg-gray-500/20 text-gray-300",
          icon: <AlertTriangle size={14} />,
        };
    }
  };

  // Cálculo das estatísticas dos cards do dashboard
  const overviewStats = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd"); // Formato YYYY-MM-DD para comparação

    const todayAppointments = allAppointments.filter(
      (app) => app.date === today
    );

    const totalToday = todayAppointments.length;
    const confirmedToday = todayAppointments.filter(
      (app) => app.status === "confirmed"
    ).length;
    const pendingToday = todayAppointments.filter(
      (app) => app.status === "pending"
    ).length;

    // Atrasados: Agendamentos confirmados cuja data/hora já passou, mas que não foram marcados como concluídos/cancelados/no-show
    const pastDueAppointments = allAppointments.filter((app) => {
      const [year, month, day] = app.date.split("-").map(Number);
      const [hour, minute] = app.time.split(":").map(Number);
      const appDateTime = new Date(year, month - 1, day, hour, minute); // Mês é 0-indexado

      return app.status === "confirmed" && appDateTime < new Date();
    }).length;

    return {
      total: totalToday,
      confirmed: confirmedToday,
      pending: pendingToday,
      pastDue: pastDueAppointments,
    };
  }, [allAppointments]);

  const renderAppointmentList = (list) => {
    return (
      <ul className="space-y-4">
        {list.map((app) => {
          // Cria a data no fuso horário local para exibição e comparação
          const [year, month, day] = app.date.split("-").map(Number);
          const [hour, minute] = app.time.split(":").map(Number);
          const appointmentDateTime = new Date(
            year,
            month - 1,
            day,
            hour,
            minute
          ); // Mês é 0-indexado

          const isPast = appointmentDateTime < new Date();
          const statusInfo = getStatusInfo(app.status, isPast);
          return (
            <li
              key={app.id}
              className="bg-gray-800/80 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-700 hover:border-[#daa520]/50 transition-colors duration-300"
            >
              <div className="flex items-center mb-4 md:mb-0 flex-grow">
                <div className="text-center border-r-2 border-gray-700 pr-4 mr-4">
                  <p className="text-2xl font-bold text-white">{app.time}</p>
                  {/* Usa a data construída localmente para formatar */}
                  <p className="text-sm text-gray-400">
                    {format(appointmentDateTime, "dd/MMM", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-lg text-white">
                    {app.serviceName}
                  </p>
                  <p className="text-sm text-gray-300">
                    Cliente: {app.clientName}
                  </p>
                  <p className="text-sm text-gray-400">
                    Profissional: {app.professionalName}
                  </p>
                  {app.totalPrice && (
                    <p className="text-sm text-gray-300">
                      Valor Estimado: R$ {app.totalPrice?.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 self-stretch md:self-center w-full md:w-auto">
                <div
                  className={`flex items-center justify-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}
                >
                  {statusInfo.icon}
                  <span>{statusInfo.text}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {/* Botões para agendamentos PENDENTES */}
                  {app.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleConfirmAppointment(app)}
                        className="p-2 bg-green-600/80 hover:bg-green-600 rounded-md text-white transition-colors"
                        title="Confirmar Agendamento"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(app)}
                        className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white transition-colors"
                        title="Cancelar Agendamento"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  {/* Botões para agendamentos CONFIRMADOS que já passaram */}
                  {app.status === "confirmed" && isPast && (
                    <>
                      <button
                        onClick={() => handleNoShowClick(app)}
                        className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white transition-colors"
                        title="Marcar como Não Compareceu"
                      >
                        <UserX size={16} />
                      </button>
                      <button
                        onClick={() => handleCompleteServiceClick(app)}
                        className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded-md text-white transition-colors"
                        title="Marcar como Concluído"
                      >
                        <CheckCircle size={16} />
                      </button>
                    </>
                  )}
                  {/* Botão de cancelamento para agendamentos confirmados futuros (opcional, se permitido) */}
                  {app.status === "confirmed" && !isPast && (
                    <button
                      onClick={() => handleCancelAppointment(app)}
                      className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white transition-colors"
                      title="Cancelar Agendamento"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="animate-fade-in-down">
      {confirmationModalState?.isOpen && (
        <ConfirmationModal
          title={confirmationModalState.title}
          message={confirmationModalState.message}
          onConfirm={confirmationModalState.onConfirm}
          onCancel={() => setConfirmationModalState(null)}
        />
      )}
      {completeServiceModalState?.isOpen && (
        <CompleteServiceModal
          isOpen={completeServiceModalState.isOpen}
          appointment={completeServiceModalState.appointment}
          onClose={() => setCompleteServiceModalState(null)}
          onConfirm={handleConfirmCompleteService}
        />
      )}

      <h2 className="text-3xl font-bold text-white mb-6">
        Agenda e Solicitações
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-black/30 p-6 rounded-xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total de Hoje</p>
            <p className="text-3xl font-bold text-white mt-1">
              {overviewStats.total}
            </p>
          </div>
          <LayoutDashboard className="h-10 w-10 text-gray-600" />
        </div>
        <div className="bg-black/30 p-6 rounded-xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Confirmados Hoje</p>
            <p className="text-3xl font-bold text-green-400 mt-1">
              {overviewStats.confirmed}
            </p>
          </div>
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div className="bg-black/30 p-6 rounded-xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Pendentes Hoje</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">
              {overviewStats.pending}
            </p>
          </div>
          <Clock className="h-10 w-10 text-yellow-600" />
        </div>
        <div className="bg-black/30 p-6 rounded-xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Atrasados</p>
            <p className="text-3xl font-bold text-orange-400 mt-1">
              {overviewStats.pastDue}
            </p>
          </div>
          <AlertTriangle className="h-10 w-10 text-orange-600" />
        </div>
      </div>

      <div className="mb-6 flex space-x-2 border-b border-gray-800">
        <button
          onClick={() => setAgendaTab("upcoming")}
          className={`py-2 px-4 font-semibold transition-colors duration-300 ${
            agendaTab === "upcoming"
              ? "text-[#daa520] border-b-2 border-[#daa520]"
              : "text-gray-500 hover:text-white"
          }`}
        >
          Próximos Agendamentos
        </button>
        <button
          onClick={() => setAgendaTab("history")}
          className={`py-2 px-4 font-semibold transition-colors duration-300 ${
            agendaTab === "history"
              ? "text-[#daa520] border-b-2 border-[#daa520]"
              : "text-gray-500 hover:text-white"
          }`}
        >
          Histórico de Agendamentos
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">
          A carregar agendamentos...
        </p>
      ) : agendaTab === "upcoming" ? (
        renderAppointmentList(upcomingAppointments)
      ) : (
        <div>
          {/* --- BARRA DE FILTROS --- */}
          <div className="bg-gray-800/50 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Filtro por Profissional */}
            <div>
              <label className="text-sm text-gray-400">Profissional</label>
              <select
                value={historyFilters.professionalId}
                onChange={(e) => {
                  setHistoryFilters((prev) => ({
                    ...prev,
                    professionalId: e.target.value,
                  }));
                  setCurrentPage(1); // Reseta a página ao mudar o filtro
                }}
                className="w-full bg-gray-700 p-2 rounded-md mt-1"
              >
                <option value="todos">Todos</option>
                {userProfile?.professionals?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Cliente */}
            <div>
              <label className="text-sm text-gray-400">Cliente</label>
              <input
                type="text"
                placeholder="Nome do cliente..."
                value={historyFilters.clientName}
                onChange={(e) => {
                  setHistoryFilters((prev) => ({
                    ...prev,
                    clientName: e.target.value,
                  }));
                  setCurrentPage(1);
                }}
                className="w-full bg-gray-700 p-2 rounded-md mt-1"
              />
            </div>

            {/* Filtro por Data */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">De</label>
                <input
                  type="date"
                  value={historyFilters.dateStart}
                  onChange={(e) =>
                    setHistoryFilters((prev) => ({
                      ...prev,
                      dateStart: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-700 p-2 rounded-md mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Até</label>
                <input
                  type="date"
                  value={historyFilters.dateEnd}
                  onChange={(e) =>
                    setHistoryFilters((prev) => ({
                      ...prev,
                      dateEnd: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-700 p-2 rounded-md mt-1"
                />
              </div>
            </div>
          </div>

          {/* --- LISTA E CONTROLES DE PAGINAÇÃO --- */}
          {loading ? (
            <p className="text-center text-gray-400 py-10">
              Carregando histórico...
            </p>
          ) : paginatedHistory.length > 0 ? (
            <>
              {renderAppointmentList(paginatedHistory)}
              {/* Controles de Paginação */}
              <div className="flex justify-center items-center mt-6 gap-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-700 px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-gray-400">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="bg-gray-700 px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 py-10">
              Nenhum registro encontrado para os filtros selecionados.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// --- Componente Principal do Dashboard ---
const ServiceProviderDashboard = () => {
  const { logout, userProfile } = useAuth();
  const [activeView, setActiveView] = useState("agenda");
  // Removido o modalState daqui, pois agora está dentro de AgendaView para melhor escopo

  const renderContent = () => {
    switch (activeView) {
      case "agenda":
        return <AgendaView />;
      case "profile":
        return <ProfileManagement onBack={() => setActiveView("agenda")} />;
      case "services":
        return <ServicesManagement />;
      case "professionals":
        return <ProfessionalsManagement />;
      case "availability":
        return <AvailabilityManagement />;
      case "financial":
        return <FinancialManagement />;
      case "reviews":
        return <ReviewsManagement />;
      default:
        return <div></div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-gray-200 font-sans">
      {/* O modal de confirmação agora é gerenciado dentro de AgendaView */}
      <SideNav activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-grow p-4 sm:p-6 md:p-8 ml-72">
        <div className="bg-gray-900/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-800 min-h-full animate-fade-in-down">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;

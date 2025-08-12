import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import type { UserProfile, Service, Professional } from '../../types';
import { Clock, Coffee, X, Save, User, ChevronDown, CalendarDays, Edit, Moon, Sun, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

// Interfaces locais para compatibilidade com a estrutura de dados usada no seu projeto
interface DayAvailability {
  active: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

interface Availability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

interface ProfessionalWithAvailability extends Professional {
    services: Service[];
    availability?: Availability;
}

const weekDays: { [key: string]: string } = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
};

// --- Componente do Modal (Restilizado) ---
const TimeSlotModal = ({ isOpen, onClose, onSave, dayLabel, initialAvailability }) => {
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [breakStartTime, setBreakStartTime] = useState('12:00');
    const [breakEndTime, setBreakEndTime] = useState('13:00');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialAvailability) {
            setStartTime(initialAvailability.startTime || '09:00');
            setEndTime(initialAvailability.endTime || '18:00');
            setBreakStartTime(initialAvailability.breakStartTime || '12:00');
            setBreakEndTime(initialAvailability.breakEndTime || '13:00');
        }
    }, [initialAvailability]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await onSave({ startTime, endTime, breakStartTime, breakEndTime, active: true });
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 transform transition-all animate-slide-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Editar Horários de <span className="text-[#daa520]">{dayLabel}</span></h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div className="space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2"><Clock size={20} className="text-[#daa520]" /> Horário de Trabalho</h4>
                        <div className="flex items-center gap-4">
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-gray-800 p-3 rounded-md w-full border border-gray-700 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]" />
                            <span className="text-gray-400 font-bold">-</span>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-gray-800 p-3 rounded-md w-full border border-gray-700 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2"><Coffee size={20} className="text-[#daa520]" /> Intervalo de Pausa <span className="text-xs text-gray-500">(Opcional)</span></h4>
                         <div className="flex items-center gap-4">
                            <input type="time" value={breakStartTime} onChange={e => setBreakStartTime(e.target.value)} className="bg-gray-800 p-3 rounded-md w-full border border-gray-700 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]" />
                            <span className="text-gray-400 font-bold">-</span>
                            <input type="time" value={breakEndTime} onChange={e => setBreakEndTime(e.target.value)} className="bg-gray-800 p-3 rounded-md w-full border border-gray-700 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]" />
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="bg-[#daa520] hover:bg-[#c8961e] text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Componente Seletor de Profissional (Restilizado) ---
const ProfessionalSelector = ({ professionals, selectedProfId, setSelectedProfId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedProfessional = professionals.find(p => p.id === selectedProfId);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!professionals || professionals.length === 0) {
        return <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400">Nenhum profissional cadastrado.</div>;
    }
    
    return (
        <div className="relative w-full md:w-72" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between gap-3 bg-gray-900/50 p-3 rounded-xl border-2 border-gray-700 hover:border-[#daa520] transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-3">
                    <img src={selectedProfessional?.photoURL || `https://ui-avatars.com/api/?name=${selectedProfessional?.name.replace(' ', '+')}&background=daa520&color=000`} alt={selectedProfessional?.name} className="w-10 h-10 rounded-full border-2 border-gray-600"/>
                    <div>
                        <p className="text-xs text-gray-400">Profissional</p>
                        <p className="font-bold text-white">{selectedProfessional?.name || 'Selecione'}</p>
                    </div>
                </div>
                <ChevronDown className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-full bg-gray-900 border-2 border-gray-700 rounded-xl shadow-2xl z-20 animate-fade-in-up overflow-hidden">
                    {professionals.map(prof => (
                        <div key={prof.id} onClick={() => { setSelectedProfId(prof.id); setIsOpen(false); }} className="p-3 hover:bg-gray-800 cursor-pointer flex items-center gap-3 transition-colors">
                            <img src={prof.photoURL || `https://ui-avatars.com/api/?name=${prof.name.replace(' ', '+')}&background=2a2a2a&color=daa520`} alt={prof.name} className="w-10 h-10 rounded-full border-2 border-gray-600"/>
                            <span className="text-white font-semibold">{prof.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Componente Principal (Corrigido e Restilizado) ---
const AvailabilityManagement = () => {
    // CORREÇÃO: Removido setUserProfile, pois o contexto não o provê. A atualização será via listener do Firebase.
    const { userProfile } = useAuth(); 
    const { showToast } = useToast();
    const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
    const [availability, setAvailability] = useState<Availability | null>(null);
    const [modal, setModal] = useState<{ isOpen: boolean; dayKey?: keyof Availability; dayLabel?: string; }>({ isOpen: false });
    const [bookingAdvanceDays, setBookingAdvanceDays] = useState<number | string>('');
    const [isSavingRule, setIsSavingRule] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setBookingAdvanceDays(userProfile.bookingAdvanceDays || '');
            if (userProfile.professionals && userProfile.professionals.length > 0 && !selectedProfId) {
                setSelectedProfId(userProfile.professionals[0].id);
            }
        }
    }, [userProfile]);

    useEffect(() => {
        const professional = userProfile?.professionals?.find(p => p.id === selectedProfId) as ProfessionalWithAvailability | undefined;
        if (professional) {
            const initialAvailability: Availability = {
                monday: professional.availability?.monday || { active: true, startTime: '09:00', endTime: '18:00' },
                tuesday: professional.availability?.tuesday || { active: true, startTime: '09:00', endTime: '18:00' },
                wednesday: professional.availability?.wednesday || { active: true, startTime: '09:00', endTime: '18:00' },
                thursday: professional.availability?.thursday || { active: true, startTime: '09:00', endTime: '18:00' },
                friday: professional.availability?.friday || { active: true, startTime: '09:00', endTime: '18:00' },
                saturday: professional.availability?.saturday || { active: false, startTime: '', endTime: '' },
                sunday: professional.availability?.sunday || { active: false, startTime: '', endTime: '' },
            };
            setAvailability(initialAvailability);
        } else {
            setAvailability(null);
        }
    }, [selectedProfId, userProfile?.professionals]);

    const handleSaveBookingAdvanceDays = async () => {
        if (!userProfile) return;
        setIsSavingRule(true);
        const days = bookingAdvanceDays === '' ? 0 : Number(bookingAdvanceDays);
        if (isNaN(days) || days < 0) {
            showToast('Por favor, insira um número de dias válido.', 'error');
            setIsSavingRule(false);
            return;
        }
        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { bookingAdvanceDays: days });
            // CORREÇÃO: A atualização do estado local do userProfile foi removida.
            // O listener do AuthContext cuidará de atualizar o estado globalmente.
            showToast('Regra de agendamento salva com sucesso!', 'success');
        } catch (error) {
            showToast('Ocorreu um erro ao salvar a regra.', 'error');
            console.error("Erro ao salvar limite de dias:", error);
        } finally {
            setIsSavingRule(false);
        }
    };

    const updateProfessionalAvailability = async (newAvailability: Availability) => {
        if (!userProfile || !selectedProfId) return;
        const updatedProfessionals = userProfile.professionals?.map(prof =>
            prof.id === selectedProfId ? { ...prof, availability: newAvailability } : prof
        );
        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { professionals: updatedProfessionals });
            // CORREÇÃO: A atualização do estado local do userProfile foi removida.
            showToast('Disponibilidade atualizada com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao atualizar a disponibilidade.', 'error');
            console.error("Erro ao salvar disponibilidade:", error);
        }
    };

    const handleSaveDayAvailability = async (dayKey: keyof Availability, newDayAvailability: DayAvailability) => {
        if (!availability) return;
        const updatedAvailability = { ...availability, [dayKey]: newDayAvailability };
        setAvailability(updatedAvailability);
        await updateProfessionalAvailability(updatedAvailability);
    };

    const handleToggleDayOff = async (dayKey: keyof Availability, isActive: boolean) => {
        if (!availability) return;
        const dayCurrentState = availability[dayKey];
        const updatedAvailability = { ...availability, [dayKey]: { ...dayCurrentState, active: isActive } };
        setAvailability(updatedAvailability);
        await updateProfessionalAvailability(updatedAvailability);
    };

    const openModal = (dayKey: keyof Availability) => {
        setModal({ isOpen: true, dayKey, dayLabel: weekDays[dayKey] });
    };

    const selectedDayAvailability = useMemo(() => {
        if (!availability || !modal.dayKey) return undefined;
        return availability[modal.dayKey];
    }, [availability, modal.dayKey]);

    return (
        <div className="p-4 sm:p-6 text-white">
            <TimeSlotModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false })}
                onSave={(newDayAvailability) => modal.dayKey && handleSaveDayAvailability(modal.dayKey, newDayAvailability)}
                dayLabel={modal.dayLabel}
                initialAvailability={selectedDayAvailability}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Gestão de Disponibilidade</h2>
                <ProfessionalSelector professionals={userProfile?.professionals || []} selectedProfId={selectedProfId} setSelectedProfId={setSelectedProfId} />
            </div>

            <div className="bg-gray-900/50 p-6 rounded-2xl border-2 border-gray-800 mb-8 animate-fade-in-down shadow-2xl shadow-black/30">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3"><CalendarDays size={24} className="text-[#daa520]" />Regras de Agendamento</h3>
                <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                    <div className="flex-grow w-full">
                        <label htmlFor="bookingAdvanceDays" className="text-sm text-gray-400 block mb-2">
                            Clientes podem agendar com até...
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                id="bookingAdvanceDays"
                                value={bookingAdvanceDays}
                                onChange={(e) => setBookingAdvanceDays(e.target.value)}
                                className="w-28 bg-gray-800 p-3 rounded-md border-2 border-gray-700 text-center text-lg font-bold focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]"
                                placeholder="∞"
                                min="0"
                            />
                            <span className="text-gray-300 text-lg">dias de antecedência.</span>
                        </div>
                         <p className="text-xs text-gray-500 mt-2">Deixe em branco ou 0 para não definir um limite.</p>
                    </div>
                    <button
                        onClick={handleSaveBookingAdvanceDays}
                        disabled={isSavingRule}
                        className="w-full md:w-auto bg-[#daa520] hover:bg-[#c8961e] text-black font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isSavingRule ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                        {isSavingRule ? 'Salvando...' : 'Salvar Regra'}
                    </button>
                </div>
            </div>

            {selectedProfId && availability ? (
                <div className="space-y-4">
                    {Object.entries(availability).map(([dayKey, dayValue]) => (
                        <div key={dayKey} className="bg-gray-900/50 p-4 rounded-2xl border-2 border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up transition-all duration-300 hover:border-[#daa520]/50 hover:shadow-2xl hover:shadow-black/40">
                            <div className="flex items-center gap-3 w-full sm:w-48">
                                {dayValue.active ? <Sun className="text-green-400" size={24}/> : <Moon className="text-red-400" size={24}/>}
                                <span className="text-lg font-bold text-white">{weekDays[dayKey]}</span>
                            </div>
                            <div className="flex-grow text-center sm:text-left">
                                {!dayValue.active ? (
                                    <span className="font-semibold text-red-400">Folga</span>
                                ) : (
                                    <span className="text-green-400 font-mono text-lg">
                                        {dayValue.startTime} - {dayValue.endTime}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => openModal(dayKey as keyof Availability)} className="text-sm text-gray-300 hover:text-[#daa520] transition-colors p-2 rounded-md hover:bg-gray-700 flex items-center gap-2">
                                    <Edit size={16}/> Editar
                                </button>
                                <button onClick={() => handleToggleDayOff(dayKey as keyof Availability, !dayValue.active)} className={`p-2 rounded-full transition-colors ${dayValue.active ? 'bg-green-600/20 hover:bg-green-600/40' : 'bg-red-600/20 hover:bg-red-600/40'}`}>
                                    {dayValue.active ? <ToggleRight className="text-green-400" size={28}/> : <ToggleLeft className="text-red-400" size={28}/>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-700 animate-fade-in">
                    <User size={48} className="mx-auto text-gray-600 mb-4"/>
                    <h3 className="text-xl font-bold text-gray-400">Selecione um Profissional</h3>
                    <p className="text-gray-500">Escolha um profissional acima para ver e gerenciar seus horários.</p>
                </div>
            )}
        </div>
    );
};

export default AvailabilityManagement;

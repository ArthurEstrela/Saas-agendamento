import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import type { UserProfile, Professional, DayAvailability, Unavailability } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Clock, Coffee, X, Save, User, ChevronDown, CalendarDays, Edit, Moon, Sun, ToggleLeft, ToggleRight, Loader2, CalendarPlus, Trash2 } from 'lucide-react';

// Tipos para os Modais e Seletores
type TimeSlotModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (availability: any) => void;
  dayLabel: string;
  initialAvailability: any;
};

type ProfessionalSelectorProps = {
  professionals: Professional[];
  selectedProfId: string | null;
  setSelectedProfId: (id: string) => void;
};

type UnavailabilityModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (unavailabilityData: any) => Promise<void>;
    professionals: Professional[];
    selectedProfId: string | null;
    setSelectedProfId: (id: string) => void;
};


// Componente Modal para editar os horários de um dia
const TimeSlotModal: React.FC<TimeSlotModalProps> = ({ isOpen, onClose, onSave, dayLabel, initialAvailability }) => {
    const [workIntervals, setWorkIntervals] = useState(initialAvailability.workIntervals || [{ start: '09:00', end: '18:00' }]);
    const [breakIntervals, setBreakIntervals] = useState(initialAvailability.breakIntervals || [{ start: '12:00', end: '13:00' }]);

    useEffect(() => {
        setWorkIntervals(initialAvailability.workIntervals || [{ start: '09:00', end: '18:00' }]);
        setBreakIntervals(initialAvailability.breakIntervals || [{ start: '12:00', end: '13:00' }]);
    }, [initialAvailability]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ workIntervals, breakIntervals });
        onClose();
    };
    
    // Funções para manipular os intervalos (add, remove, update)
    const addInterval = (type: 'work' | 'break') => {
        const newInterval = { start: '09:00', end: '10:00' };
        if (type === 'work') {
            setWorkIntervals([...workIntervals, newInterval]);
        } else {
            setBreakIntervals([...breakIntervals, newInterval]);
        }
    };

    const removeInterval = (type: 'work' | 'break', index: number) => {
        if (type === 'work') {
            setWorkIntervals(workIntervals.filter((_: any, i: number) => i !== index));
        } else {
            setBreakIntervals(breakIntervals.filter((_: any, i: number) => i !== index));
        }
    };

    const updateInterval = (type: 'work' | 'break', index: number, field: 'start' | 'end', value: string) => {
        const updater = (intervals: any) => intervals.map((interval: any, i: number) => i === index ? { ...interval, [field]: value } : interval);
        if (type === 'work') {
            setWorkIntervals(updater(workIntervals));
        } else {
            setBreakIntervals(updater(breakIntervals));
        }
    };


    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Editar Horários de {dayLabel}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
                </div>
                
                {/* Horários de Trabalho */}
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-[#daa520] mb-3 flex items-center gap-2"><Clock size={20}/>Horários de Trabalho</h4>
                    {workIntervals.map((interval: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 mb-2">
                            <input type="time" value={interval.start} onChange={e => updateInterval('work', index, 'start', e.target.value)} className="bg-gray-800 p-2 rounded-md w-full" />
                            <span className="text-gray-400">às</span>
                            <input type="time" value={interval.end} onChange={e => updateInterval('work', index, 'end', e.target.value)} className="bg-gray-800 p-2 rounded-md w-full" />
                            <button onClick={() => removeInterval('work', index)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={18}/></button>
                        </div>
                    ))}
                    <button onClick={() => addInterval('work')} className="text-sm text-[#daa520] hover:underline mt-2">Adicionar outro horário</button>
                </div>

                {/* Horários de Pausa */}
                <div>
                    <h4 className="text-lg font-semibold text-[#daa520] mb-3 flex items-center gap-2"><Coffee size={20}/>Horários de Pausa</h4>
                    {breakIntervals.map((interval: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 mb-2">
                            <input type="time" value={interval.start} onChange={e => updateInterval('break', index, 'start', e.target.value)} className="bg-gray-800 p-2 rounded-md w-full" />
                            <span className="text-gray-400">às</span>
                            <input type="time" value={interval.end} onChange={e => updateInterval('break', index, 'end', e.target.value)} className="bg-gray-800 p-2 rounded-md w-full" />
                            <button onClick={() => removeInterval('break', index)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={18}/></button>
                        </div>
                    ))}
                    <button onClick={() => addInterval('break')} className="text-sm text-[#daa520] hover:underline mt-2">Adicionar outra pausa</button>
                </div>

                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} className="bg-[#daa520] hover:bg-[#c8961e] text-black font-bold py-3 px-6 rounded-lg flex items-center gap-2"><Save /> Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
};

// Componente para selecionar o profissional
const ProfessionalSelector: React.FC<ProfessionalSelectorProps> = ({ professionals, selectedProfId, setSelectedProfId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedProfessionalName = professionals.find(p => p.id === selectedProfId)?.name || "Selecione um Profissional";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full md:w-72" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-800 border-2 border-gray-700 p-4 rounded-xl flex justify-between items-center text-left"
            >
                <span className="flex items-center gap-3">
                    <User className="text-[#daa520]" />
                    <span className="font-semibold">{selectedProfessionalName}</span>
                </span>
                <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-gray-800 border-2 border-gray-700 rounded-xl shadow-lg z-10 animate-fade-in-down">
                    {professionals.map(prof => (
                        <div
                            key={prof.id}
                            onClick={() => {
                                setSelectedProfId(prof.id);
                                setIsOpen(false);
                            }}
                            className="p-4 hover:bg-gray-700 cursor-pointer flex items-center gap-3"
                        >
                            {prof.photoURL ? <img src={prof.photoURL} alt={prof.name} className="w-8 h-8 rounded-full" /> : <User className="w-8 h-8 p-1 bg-gray-600 rounded-full" />}
                            {prof.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// MODAL PARA ADICIONAR FOLGA/IMPREVISTO
const UnavailabilityModal: React.FC<UnavailabilityModalProps> = ({ isOpen, onClose, onSave, professionals, selectedProfId, setSelectedProfId }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [period, setPeriod] = useState<'morning' | 'afternoon' | 'all_day'>('all_day');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!selectedProfId) {
            alert('Por favor, selecione um profissional.');
            return;
        }
        setIsSaving(true);
        await onSave({
            date,
            period,
            description,
        });
        setIsSaving(false);
        onClose();
        // Reset state
        setDate(new Date().toISOString().split('T')[0]);
        setPeriod('all_day');
        setDescription('');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Adicionar Folga ou Imprevisto</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Profissional</label>
                        <select
                            value={selectedProfId || ''}
                            onChange={(e) => setSelectedProfId(e.target.value)}
                            className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 text-white"
                        >
                            <option value="" disabled>Selecione um profissional</option>
                            {professionals.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="unavailability-date" className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                        <input
                            id="unavailability-date"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setPeriod('morning')} className={`p-3 rounded-md text-sm transition-colors ${period === 'morning' ? 'bg-[#daa520] text-black font-bold' : 'bg-gray-800 hover:bg-gray-700'}`}>Manhã</button>
                            <button onClick={() => setPeriod('afternoon')} className={`p-3 rounded-md text-sm transition-colors ${period === 'afternoon' ? 'bg-[#daa520] text-black font-bold' : 'bg-gray-800 hover:bg-gray-700'}`}>Tarde</button>
                            <button onClick={() => setPeriod('all_day')} className={`p-3 rounded-md text-sm transition-colors ${period === 'all_day' ? 'bg-[#daa520] text-black font-bold' : 'bg-gray-800 hover:bg-gray-700'}`}>Dia Todo</button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="unavailability-description" className="block text-sm font-medium text-gray-300 mb-2">Motivo (Opcional)</label>
                        <input
                            id="unavailability-description"
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ex: Consulta médica"
                            className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 text-white"
                        />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving || !selectedProfId} className="bg-[#daa520] hover:bg-[#c8961e] text-black font-bold py-3 px-6 rounded-lg flex items-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};


const AvailabilityManagement = () => {
    const { userProfile, loading } = useAuthStore();
    const { showToast } = useToast();
    const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
    const [availability, setAvailability] = useState<DayAvailability[] | null>(null);
    const [modal, setModal] = useState<{ isOpen: boolean; dayKey?: any; dayLabel?: string; }>({ isOpen: false });
    const [unavailabilityModal, setUnavailabilityModal] = useState(false);
    const [bookingAdvanceDays, setBookingAdvanceDays] = useState<number | string>('');
    const [isSavingRule, setIsSavingRule] = useState(false);

    const daysOfWeek = useMemo(() => ({
        sunday: 'Domingo',
        monday: 'Segunda-feira',
        tuesday: 'Terça-feira',
        wednesday: 'Quarta-feira',
        thursday: 'Quinta-feira',
        friday: 'Sexta-feira',
        saturday: 'Sábado',
    }), []);

    useEffect(() => {
        if (userProfile?.professionals && userProfile.professionals.length > 0 && !selectedProfId) {
            setSelectedProfId(userProfile.professionals[0].id);
        }
        if(userProfile?.bookingAdvanceDays) {
            setBookingAdvanceDays(userProfile.bookingAdvanceDays);
        }
    }, [userProfile, selectedProfId]);

    // EFEITO CORRIGIDO para garantir que 'availability' seja sempre um array
    useEffect(() => {
        if (selectedProfId && userProfile?.professionals) {
            const professional = userProfile.professionals.find(p => p.id === selectedProfId);
            const profAvailability = professional?.availability;
            
            // Garante que a disponibilidade seja um array. Se não for, cria uma padrão.
            if (profAvailability && Array.isArray(profAvailability) && profAvailability.length > 0) {
                setAvailability(profAvailability);
            } else {
                // Se não houver disponibilidade ou não for um array, cria uma padrão
                const defaultAvailability: DayAvailability[] = [
                    { dayOfWeek: 'sunday', isDayOff: true, workIntervals: [], breakIntervals: [] },
                    { dayOfWeek: 'monday', isDayOff: false, workIntervals: [{ start: '09:00', end: '18:00' }], breakIntervals: [{ start: '12:00', end: '13:00' }] },
                    { dayOfWeek: 'tuesday', isDayOff: false, workIntervals: [{ start: '09:00', end: '18:00' }], breakIntervals: [{ start: '12:00', end: '13:00' }] },
                    { dayOfWeek: 'wednesday', isDayOff: false, workIntervals: [{ start: '09:00', end: '18:00' }], breakIntervals: [{ start: '12:00', end: '13:00' }] },
                    { dayOfWeek: 'thursday', isDayOff: false, workIntervals: [{ start: '09:00', end: '18:00' }], breakIntervals: [{ start: '12:00', end: '13:00' }] },
                    { dayOfWeek: 'friday', isDayOff: false, workIntervals: [{ start: '09:00', end: '18:00' }], breakIntervals: [{ start: '12:00', end: '13:00' }] },
                    { dayOfWeek: 'saturday', isDayOff: true, workIntervals: [], breakIntervals: [] },
                ];
                setAvailability(defaultAvailability);
            }
        }
    }, [selectedProfId, userProfile?.professionals]);

    const handleSaveBookingAdvanceDays = async () => {
        if (!userProfile) return;
        setIsSavingRule(true);
        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, {
                bookingAdvanceDays: Number(bookingAdvanceDays)
            });
            showToast('Regra de agendamento salva com sucesso!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar a regra.', 'error');
        } finally {
            setIsSavingRule(false);
        }
    };

    const updateProfessionalAvailability = async (newAvailability: DayAvailability[]) => {
        if (!userProfile || !selectedProfId) return;

        const updatedProfessionals = userProfile.professionals?.map(prof =>
            prof.id === selectedProfId ? { ...prof, availability: newAvailability } : prof
        );

        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { professionals: updatedProfessionals });
            showToast('Disponibilidade atualizada com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao atualizar a disponibilidade.', 'error');
            console.error(error);
        }
    };

    const handleSaveUnavailability = async (unavailabilityData: Omit<Unavailability, 'id'>) => {
        if (!userProfile || !selectedProfId) return;

        const professional = userProfile.professionals?.find(p => p.id === selectedProfId);
        if (!professional) return;

        const newUnavailability: Unavailability = { id: uuidv4(), ...unavailabilityData };

        const updatedProfessionals = userProfile.professionals?.map(prof =>
            prof.id === selectedProfId
                ? { ...prof, unavailability: [...(prof.unavailability || []), newUnavailability] }
                : prof
        );

        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { professionals: updatedProfessionals });
            showToast('Folga/imprevisto adicionado com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao adicionar indisponibilidade.', 'error');
            console.error(error);
        }
    };

    const handleRemoveUnavailability = async (unavailabilityId: string) => {
        if (!userProfile || !selectedProfId) return;

        const updatedProfessionals = userProfile.professionals?.map(prof => {
            if (prof.id === selectedProfId) {
                return {
                    ...prof,
                    unavailability: prof.unavailability?.filter(u => u.id !== unavailabilityId) || []
                };
            }
            return prof;
        });

         try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { professionals: updatedProfessionals });
            showToast('Folga/imprevisto removido!', 'success');
        } catch (error) {
            showToast('Erro ao remover indisponibilidade.', 'error');
            console.error(error);
        }
    };

    const handleSaveDayAvailability = (dayKey: keyof typeof daysOfWeek, newDayAvailability: any) => {
        if (!availability) return;
        const newAvailability = availability.map(day =>
            day.dayOfWeek === dayKey ? { ...day, ...newDayAvailability } : day
        );
        setAvailability(newAvailability);
        updateProfessionalAvailability(newAvailability);
    };

    const handleToggleDayOff = (dayKey: keyof typeof daysOfWeek, isDayOff: boolean) => {
        if (!availability) return;
        const newAvailability = availability.map(day =>
            day.dayOfWeek === dayKey ? { ...day, isDayOff: isDayOff } : day
        );
        setAvailability(newAvailability);
        updateProfessionalAvailability(newAvailability);
    };

    const openModal = (dayKey: any, dayLabel: string) => {
        const dayAvailability = availability?.find(d => d.dayOfWeek === dayKey);
        setModal({ isOpen: true, dayKey, dayLabel, ...{initialAvailability: dayAvailability} });
    };

    const selectedProfessional = useMemo(() => {
        return userProfile?.professionals?.find(p => p.id === selectedProfId);
    }, [selectedProfId, userProfile?.professionals]);


    return (
        <div className="p-4 sm:p-6 text-white">
            <TimeSlotModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false })}
                onSave={(newDayAvailability) => handleSaveDayAvailability(modal.dayKey, newDayAvailability)}
                dayLabel={modal.dayLabel || ''}
                initialAvailability={modal.isOpen ? availability?.find(d => d.dayOfWeek === modal.dayKey) : {}}
            />
            
            <UnavailabilityModal
                isOpen={unavailabilityModal}
                onClose={() => setUnavailabilityModal(false)}
                onSave={handleSaveUnavailability}
                professionals={userProfile?.professionals || []}
                selectedProfId={selectedProfId}
                setSelectedProfId={setSelectedProfId}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Gestão de Disponibilidade</h2>
                <ProfessionalSelector professionals={userProfile?.professionals || []} selectedProfId={selectedProfId} setSelectedProfId={setSelectedProfId} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-900/50 p-6 rounded-2xl border-2 border-gray-800 animate-fade-in-down">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3"><CalendarDays size={24} className="text-[#daa520]" />Regras de Agendamento</h3>
                    <label htmlFor="advance-days" className="block text-sm font-medium text-gray-300 mb-2">Com quantos dias de antecedência o cliente pode agendar?</label>
                    <div className="flex gap-4">
                        <input
                            id="advance-days"
                            type="number"
                            value={bookingAdvanceDays}
                            onChange={(e) => setBookingAdvanceDays(e.target.value)}
                            className="w-full bg-gray-800 p-3 rounded-md border border-gray-700"
                            placeholder="Ex: 30"
                        />
                        <button onClick={handleSaveBookingAdvanceDays} disabled={isSavingRule} className="bg-[#daa520] hover:bg-[#c8961e] text-black font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-gray-600">
                            {isSavingRule ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Salvar
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900/50 p-6 rounded-2xl border-2 border-gray-800 animate-fade-in-down">
                     <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3"><CalendarPlus size={24} className="text-[#daa520]" />Folgas e Imprevistos</h3>
                     <p className="text-sm text-gray-400 mb-4">Bloqueie datas ou períodos específicos para um profissional.</p>
                     <button
                        onClick={() => setUnavailabilityModal(true)}
                        disabled={!selectedProfId}
                        className="w-full bg-[#daa520] hover:bg-[#c8961e] text-black font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        Adicionar Folga/Imprevisto
                    </button>
                </div>
            </div>
            
            {selectedProfessional?.unavailability && selectedProfessional.unavailability.length > 0 && (
                <div className="mb-8 bg-gray-900/50 p-6 rounded-2xl border-2 border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-4">Folgas Agendadas para {selectedProfessional.name}</h3>
                    <div className="space-y-3">
                        {selectedProfessional.unavailability.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(u => (
                            <div key={u.id} className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center animate-fade-in">
                                <div>
                                    <p className="font-semibold text-white">{new Date(u.date + 'T12:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - <span className="text-[#daa520] capitalize">{
                                        {morning: 'Manhã', afternoon: 'Tarde', all_day: 'Dia Todo'}[u.period].replace('_', ' ')
                                    }</span></p>
                                    {u.description && <p className="text-sm text-gray-400">{u.description}</p>}
                                </div>
                                <button onClick={() => handleRemoveUnavailability(u.id)} className="p-2 text-red-500 hover:text-red-400 rounded-full hover:bg-red-500/10 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONDIÇÃO CORRIGIDA para garantir que 'availability' seja um array */}
            {selectedProfId && availability ? (
                <div className="bg-gray-900/50 p-6 rounded-2xl border-2 border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-6">Horários de Trabalho Semanal</h3>
                    <div className="space-y-4">
                        {Object.entries(daysOfWeek).map(([dayKey, dayLabel]) => {
                            const dayAvailability = availability.find(d => d.dayOfWeek === dayKey);
                            const isDayOff = dayAvailability?.isDayOff ?? true;

                            return (
                                <div key={dayKey} className="bg-gray-800/50 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
                                    <div className="w-full md:w-1/4 font-bold text-lg">{dayLabel}</div>
                                    <div className="w-full md:w-1/2">
                                        {isDayOff ? (
                                            <span className="text-gray-400 italic">Folga</span>
                                        ) : (
                                            <div className="text-sm">
                                                {dayAvailability?.workIntervals.map((interval, i) => <div key={i}>{interval.start} - {interval.end}</div>)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full md:w-1/4 flex items-center justify-end gap-4">
                                        <button onClick={() => openModal(dayKey, dayLabel)} disabled={isDayOff} className="p-2 text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><Edit size={20}/></button>
                                        <button onClick={() => handleToggleDayOff(dayKey as any, !isDayOff)} className={`p-2 ${isDayOff ? 'text-green-400' : 'text-red-400'}`}>
                                            {isDayOff ? <ToggleLeft size={28}/> : <ToggleRight size={28}/>}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                 <div className="text-center py-10 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-700">
                    <User size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-white">Selecione um Profissional</h3>
                    <p className="text-gray-400">Escolha um profissional acima para ver e gerenciar a disponibilidade.</p>
                </div>
            )}
        </div>
    );
};

export default AvailabilityManagement;

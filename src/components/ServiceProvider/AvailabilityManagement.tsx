import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config'; 
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import type { Professional, DayAvailability } from '../../types';
import { Clock, Coffee, X, Save, User, ChevronDown, Utensils, Edit } from 'lucide-react';

// --- Tipos e Constantes ---
const daysOfWeek = [
    { key: 'sunday', label: 'Domingo' }, { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' }, { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' }, { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
];

// Gera horários de 15 em 15 minutos para os selects
const timeSlots = Array.from({ length: 57 }, (_, i) => { // Das 08:00 às 22:00
    const totalMinutes = 8 * 60 + i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

// --- Componente do Modal de Horários ---
const TimeSlotModal = ({ isOpen, onClose, dayLabel, availability, onSave }) => {
    const [workStart, setWorkStart] = useState('09:00');
    const [workEnd, setWorkEnd] = useState('18:00');
    const [breakStart, setBreakStart] = useState('12:00');
    const [breakEnd, setBreakEnd] = useState('13:00');
    const [hasBreak, setHasBreak] = useState(false);

    useEffect(() => {
        if (isOpen && availability) {
            setWorkStart(availability.startTime || '09:00');
            setWorkEnd(availability.endTime || '18:00');
            setHasBreak(!!availability.breakStartTime);
            setBreakStart(availability.breakStartTime || '12:00');
            setBreakEnd(availability.breakEndTime || '13:00');
        }
    }, [isOpen, availability]);

    if (!isOpen) return null;

    const handleSave = () => {
        const newAvailability: DayAvailability = {
            active: true,
            startTime: workStart,
            endTime: workEnd,
            ...(hasBreak && { breakStartTime: breakStart, breakEndTime: breakEnd }),
        };
        onSave(newAvailability);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-down">
            <div className="bg-gray-900/80 p-8 rounded-2xl w-full max-w-lg border border-[#daa520]/30 shadow-2xl shadow-[#daa520]/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Editar Horários de <span className="text-[#daa520]">{dayLabel}</span></h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-300 block mb-2">Expediente</label>
                        <div className="flex items-center gap-4">
                            <select value={workStart} onChange={e => setWorkStart(e.target.value)} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 appearance-none text-center">{timeSlots.map(t => <option key={t}>{t}</option>)}</select>
                            <span className="text-gray-400">às</span>
                            <select value={workEnd} onChange={e => setWorkEnd(e.target.value)} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 appearance-none text-center">{timeSlots.map(t => <option key={t}>{t}</option>)}</select>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4">
                        <label className="flex items-center gap-3 text-white cursor-pointer mb-4">
                            <input type="checkbox" checked={hasBreak} onChange={(e) => setHasBreak(e.target.checked)} className="h-5 w-5 rounded bg-gray-700 text-[#daa520] focus:ring-[#daa520] border-gray-600" />
                            Adicionar intervalo?
                        </label>
                        {hasBreak && (
                            <div className="animate-fade-in-down">
                                <label className="text-sm font-semibold text-gray-300 block mb-2">Intervalo</label>
                                <div className="flex items-center gap-4">
                                    <select value={breakStart} onChange={e => setBreakStart(e.target.value)} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 appearance-none text-center">{timeSlots.map(t => <option key={t}>{t}</option>)}</select>
                                    <span className="text-gray-400">às</span>
                                    <select value={breakEnd} onChange={e => setBreakEnd(e.target.value)} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 appearance-none text-center">{timeSlots.map(t => <option key={t}>{t}</option>)}</select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-700 mt-6">
                    <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 font-semibold px-6 py-2 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="bg-[#daa520] hover:bg-[#c8961e] text-black font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <Save size={18}/> Guardar Horários
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Componente Customizado de Seleção de Profissional ---
const ProfessionalSelector = ({ professionals, selectedId, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const selectedProfessional = professionals.find(p => p.id === selectedId);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    return (
        <div className="relative w-full md:w-64" ref={wrapperRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-gray-800 border border-gray-700 text-white font-semibold pl-4 pr-10 py-2 rounded-lg appearance-none focus:ring-2 focus:ring-[#daa520] flex items-center justify-between">
                {selectedProfessional ? (
                    <div className="flex items-center gap-3">
                        <img src={selectedProfessional.photoURL || `https://placehold.co/150x150/111827/daa520?text=${selectedProfessional.name.charAt(0)}`} alt={selectedProfessional.name} className="w-8 h-8 rounded-full object-cover" />
                        <span>{selectedProfessional.name}</span>
                    </div>
                ) : (
                    <span>Selecione...</span>
                )}
                <ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20}/>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 animate-fade-in-down">
                    {professionals.map(prof => (
                        <div key={prof.id} onClick={() => { onSelect(prof.id); setIsOpen(false); }} className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer">
                             <img src={prof.photoURL || `https://placehold.co/150x150/111827/daa520?text=${prof.name.charAt(0)}`} alt={prof.name} className="w-8 h-8 rounded-full object-cover" />
                             <span>{prof.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- Componente Principal ---
const AvailabilityManagement = () => {
    const { userProfile, setUserProfile } = useAuth();
    const { showToast } = useToast();
    const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
    const [modal, setModal] = useState<{ isOpen: boolean; dayKey?: string; dayLabel?: string; }>({ isOpen: false });

    useEffect(() => {
        if (userProfile?.professionals && userProfile.professionals.length > 0 && !selectedProfId) {
            setSelectedProfId(userProfile.professionals[0].id);
        }
    }, [userProfile?.professionals, selectedProfId]);

    const selectedProfessional = useMemo(() => {
        return userProfile?.professionals?.find(p => p.id === selectedProfId);
    }, [userProfile, selectedProfId]);

    const handleSaveAvailability = async (dayKey: string, newAvailability: DayAvailability) => {
        if (!userProfile || !selectedProfId) return;

        const updatedProfessionals = userProfile.professionals.map(prof => {
            if (prof.id === selectedProfId) {
                const updatedAvailability = { ...prof.availability, [dayKey]: newAvailability };
                return { ...prof, availability: updatedAvailability };
            }
            return prof;
        });

        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { professionals: updatedProfessionals });
            setUserProfile(prev => ({ ...prev!, professionals: updatedProfessionals }));
            showToast('Horários atualizados com sucesso!', 'success');
            setModal({ isOpen: false });
        } catch (error) {
            showToast('Ocorreu um erro ao atualizar os horários.', 'error');
            console.error(error);
        }
    };
    
    const handleToggleDayOff = (dayKey: string, currentAvailability?: DayAvailability) => {
        const isCurrentlyActive = currentAvailability?.active || false;
        handleSaveAvailability(dayKey, {
            active: !isCurrentlyActive,
            startTime: isCurrentlyActive ? '' : '09:00',
            endTime: isCurrentlyActive ? '' : '18:00',
        });
    };

    return (
        <div>
            <TimeSlotModal 
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false })}
                dayLabel={modal.dayLabel || ''}
                availability={selectedProfessional?.availability?.[modal.dayKey || ''] || { active: false, startTime: '', endTime: '' }}
                onSave={(newAvailability) => handleSaveAvailability(modal.dayKey || '', newAvailability)}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-white">Gestão de Disponibilidade</h2>
                {userProfile?.professionals && userProfile.professionals.length > 0 && (
                     <ProfessionalSelector 
                        professionals={userProfile.professionals}
                        selectedId={selectedProfId}
                        onSelect={setSelectedProfId}
                     />
                )}
            </div>

            {selectedProfessional ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {daysOfWeek.map(({ key, label }) => {
                        const availability = selectedProfessional.availability?.[key] || { active: false };
                        return (
                             <div key={key} className={`group relative p-5 rounded-xl border transition-all duration-300 transform hover:-translate-y-1 ${availability.active ? 'bg-gray-800/80 border-gray-700 hover:border-[#daa520]/50' : 'bg-black/50 border-gray-800'}`}>
                                <div className="flex justify-between items-center">
                                    <h3 className={`text-lg font-bold ${availability.active ? 'text-white' : 'text-gray-500'}`}>{label}</h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={availability.active} onChange={() => handleToggleDayOff(key, availability)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#daa520]"></div>
                                    </label>
                                </div>
                                <div className="mt-4 min-h-[80px] flex flex-col justify-center">
                                    {availability.active ? (
                                        <>
                                            <div className="flex items-center gap-2 text-white">
                                                <Clock size={16} className="text-gray-400"/>
                                                <p className="text-xl font-semibold">{availability.startTime} - {availability.endTime}</p>
                                            </div>
                                            {availability.breakStartTime && (
                                                <div className="flex items-center gap-2 text-gray-400 mt-2">
                                                    <Utensils size={16} />
                                                    <p className="text-md font-medium">{availability.breakStartTime} - {availability.breakEndTime}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Coffee size={18} />
                                            <p className="font-semibold">Descanso</p>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setModal({ isOpen: true, dayKey: key, dayLabel: label })} title="Editar Horários" className="absolute bottom-4 right-4 text-gray-400 hover:text-[#daa520] disabled:text-gray-700 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition-opacity" disabled={!availability.active}>
                                    <Edit size={20} />
                                </button>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-10 bg-black/30 rounded-xl border border-dashed border-gray-700">
                    <p>Para gerir a disponibilidade, primeiro adicione um profissional na aba 'Profissionais'.</p>
                </div>
            )}
        </div>
    );
};

export default AvailabilityManagement;

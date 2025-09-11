import { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import type { Professional, ServiceProviderProfile, DailyAvailability } from '../../types';
import { Clock, Plus, Trash2, Save, Loader2 } from 'lucide-react';

const weekDays: DailyAvailability['dayOfWeek'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekDaysPt: { [key in DailyAvailability['dayOfWeek']]: string } = {
    Sunday: 'Domingo', Monday: 'Segunda-feira', Tuesday: 'Terça-feira', Wednesday: 'Quarta-feira',
    Thursday: 'Quinta-feira', Friday: 'Sexta-feira', Saturday: 'Sábado'
};

export const AvailabilityManagement = () => {
    const { userProfile, updateUserProfile } = useProfileStore();
    const [selectedProf, setSelectedProf] = useState<Professional | null>((userProfile as ServiceProviderProfile)?.professionals[0] || null);
    const [availability, setAvailability] = useState<DailyAvailability[]>(selectedProf?.availability || []);
    const [isSaving, setIsSaving] = useState(false);

    const handleProfessionalChange = (profId: string) => {
        const prof = (userProfile as ServiceProviderProfile)?.professionals.find(p => p.id === profId);
        if (prof) {
            setSelectedProf(prof);
            // Garante que todos os dias da semana existam no estado
            const profAvailability = weekDays.map(day => {
                return prof.availability.find(a => a.dayOfWeek === day) || { dayOfWeek: day, isAvailable: false, slots: [] };
            });
            setAvailability(profAvailability);
        }
    };

    const handleIsAvailableChange = (day: DailyAvailability['dayOfWeek'], isAvailable: boolean) => {
        setAvailability(prev => prev.map(d => d.dayOfWeek === day ? { ...d, isAvailable, slots: isAvailable && d.slots.length === 0 ? [{ start: '09:00', end: '18:00' }] : d.slots } : d));
    };

    const handleSlotChange = (day: DailyAvailability['dayOfWeek'], slotIndex: number, field: 'start' | 'end', value: string) => {
        setAvailability(prev => prev.map(d => {
            if (d.dayOfWeek === day) {
                const newSlots = [...d.slots];
                newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
                return { ...d, slots: newSlots };
            }
            return d;
        }));
    };

    const handleAddSlot = (day: DailyAvailability['dayOfWeek']) => {
        setAvailability(prev => prev.map(d => d.dayOfWeek === day ? { ...d, slots: [...d.slots, { start: '19:00', end: '21:00' }] } : d));
    };

    const handleRemoveSlot = (day: DailyAvailability['dayOfWeek'], slotIndex: number) => {
        setAvailability(prev => prev.map(d => d.dayOfWeek === day ? { ...d, slots: d.slots.filter((_, i) => i !== slotIndex) } : d));
    };

    const handleSave = async () => {
        if (!userProfile || !selectedProf) return;
        setIsSaving(true);
        const updatedProfessionals = (userProfile as ServiceProviderProfile).professionals.map(p => 
            p.id === selectedProf.id ? { ...p, availability } : p
        );
        await updateUserProfile(userProfile.id, { professionals: updatedProfessionals });
        setIsSaving(false);
        // showToast("Disponibilidade salva com sucesso!", "success");
    };

    return (
        <div className="animate-fade-in-down">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Clock /> Gerenciar Disponibilidade</h1>
            <div className="mb-6">
                <label htmlFor="professional-select" className="block text-sm font-medium text-gray-300 mb-1">Selecione o Profissional</label>
                <select 
                    id="professional-select"
                    onChange={(e) => handleProfessionalChange(e.target.value)}
                    value={selectedProf?.id || ''}
                    className="w-full max-w-xs bg-gray-900 p-3 rounded-md border border-gray-700"
                >
                    {(userProfile as ServiceProviderProfile)?.professionals.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {selectedProf && (
                <div className="space-y-6">
                    {availability.map(day => (
                        <div key={day.dayOfWeek} className="bg-gray-800/70 p-4 rounded-xl border border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">{weekDaysPt[day.dayOfWeek]}</h3>
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" checked={day.isAvailable} onChange={(e) => handleIsAvailableChange(day.dayOfWeek, e.target.checked)} className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#daa520]"></div>
                                </label>
                            </div>
                            {day.isAvailable && (
                                <div className="mt-4 space-y-2 pl-4 border-l-2 border-gray-700">
                                    {day.slots.map((slot, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input type="time" value={slot.start} onChange={(e) => handleSlotChange(day.dayOfWeek, i, 'start', e.target.value)} className="bg-gray-900 p-2 rounded-md border border-gray-600" />
                                            <span>até</span>
                                            <input type="time" value={slot.end} onChange={(e) => handleSlotChange(day.dayOfWeek, i, 'end', e.target.value)} className="bg-gray-900 p-2 rounded-md border border-gray-600" />
                                            <button onClick={() => handleRemoveSlot(day.dayOfWeek, i)} className="text-gray-500 hover:text-red-400"><Trash2 size={18} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => handleAddSlot(day.dayOfWeek)} className="flex items-center gap-2 text-sm text-[#daa520] hover:text-yellow-300 mt-2"><Plus size={16} /> Adicionar intervalo</button>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="flex justify-end">
                        <button onClick={handleSave} disabled={isSaving} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] flex items-center gap-2">
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                            Salvar Disponibilidade
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
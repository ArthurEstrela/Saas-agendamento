import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../firebase/config'; 
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import type { Professional, Service } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Edit, Trash2, Tag, DollarSign, Clock, X, GripVertical } from 'lucide-react';

// --- Tipos e Interfaces ---
type ModalMode = 'add' | 'edit';
interface ServiceFormData {
    name: string;
    price: string;
    duration: string;
    description: string;
    category: string;
}

// --- Componente do Modal para Adicionar/Editar Serviço ---
const ServiceModal = ({ isOpen, mode, service, professionalId, onClose, onSave }: { isOpen: boolean; mode: ModalMode; service?: Service; professionalId: string; onClose: () => void; onSave: (profId: string, serviceData: Service, isEditing: boolean) => void; }) => {
    const [formData, setFormData] = useState<ServiceFormData>({
        name: '', price: '', duration: '30', description: '', category: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && service) {
                setFormData({
                    name: service.name,
                    price: String(service.price),
                    duration: String(service.duration),
                    description: service.description,
                    category: service.category || '',
                });
            } else {
                setFormData({ name: '', price: '', duration: '30', description: '', category: '' });
            }
        }
    }, [mode, service, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const serviceData: Service = {
            id: mode === 'edit' && service ? service.id : uuidv4(),
            name: formData.name,
            price: parseFloat(formData.price),
            duration: parseInt(formData.duration, 10),
            description: formData.description,
            category: formData.category || 'Geral',
        };
        onSave(professionalId, serviceData, mode === 'edit');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-down">
            <div className="bg-gray-900/80 p-8 rounded-2xl w-full max-w-lg border border-[#daa520]/30 shadow-2xl shadow-[#daa520]/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">{mode === 'add' ? 'Adicionar Novo Serviço' : 'Editar Serviço'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Serviço (ex: Corte Masculino)" required className="w-full bg-gray-800 p-3 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} /><input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} placeholder="Preço" required className="w-full bg-gray-800 p-3 pl-10 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700" /></div>
                        <div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} /><input name="duration" type="number" step="5" value={formData.duration} onChange={handleChange} placeholder="Duração (min)" required className="w-full bg-gray-800 p-3 pl-10 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700" /></div>
                    </div>
                    <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} /><input name="category" value={formData.category} onChange={handleChange} placeholder="Categoria (ex: Cabelo, Barba, Unhas)" required className="w-full bg-gray-800 p-3 pl-10 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700" /></div>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição do serviço (opcional)..." rows={3} className="w-full bg-gray-800 p-3 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 font-semibold px-6 py-2 rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" className="bg-[#daa520] hover:bg-[#c8961e] text-black font-semibold px-6 py-2 rounded-lg transition-colors">Guardar Serviço</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Componente Principal ---
const ServicesManagement = () => {
    const { userProfile, setUserProfile } = useAuthStore();
    const { showToast } = useToast();
    const [modal, setModal] = useState<{ isOpen: boolean; mode: ModalMode; service?: Service; professionalId: string; }>({ isOpen: false, mode: 'add', professionalId: '' });

    const handleSaveService = async (professionalId: string, serviceData: Service, isEditing: boolean) => {
        if (!userProfile) return;

        const updatedProfessionals = userProfile.professionals.map(prof => {
            if (prof.id === professionalId) {
                const existingServices = prof.services || [];
                const services = isEditing
                    ? existingServices.map(s => s.id === serviceData.id ? serviceData : s)
                    : [...existingServices, serviceData];
                return { ...prof, services };
            }
            return prof;
        });

        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { professionals: updatedProfessionals });
            setUserProfile(prev => ({ ...prev!, professionals: updatedProfessionals }));
            showToast(`Serviço ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            setModal({ isOpen: false, mode: 'add', professionalId: '' });
        } catch (error) {
            showToast('Ocorreu um erro ao guardar o serviço.', 'error');
            console.error(error);
        }
    };

    const handleDeleteService = async (professionalId: string, serviceId: string) => {
        if (!userProfile || !window.confirm("Tem a certeza de que pretende eliminar este serviço? Esta ação não pode ser desfeita.")) return;

        const updatedProfessionals = userProfile.professionals.map(prof => {
            if (prof.id === professionalId) {
                const services = prof.services.filter(s => s.id !== serviceId);
                return { ...prof, services };
            }
            return prof;
        });

        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { professionals: updatedProfessionals });
            setUserProfile(prev => ({ ...prev!, professionals: updatedProfessionals }));
            showToast('Serviço eliminado com sucesso!', 'success');
        } catch (error) {
            showToast('Ocorreu um erro ao eliminar o serviço.', 'error');
            console.error(error);
        }
    };
    
    const servicesByCategory = useMemo(() => {
        const categories: { [key: string]: Service[] & { professionalId: string, professionalName: string }[] } = {};
        userProfile?.professionals?.forEach(prof => {
            prof.services?.forEach(service => {
                const category = service.category || 'Geral';
                if (!categories[category]) {
                    categories[category] = [];
                }
                // Adicionando IDs para o contexto
                const serviceWithContext = { ...service, professionalId: prof.id, professionalName: prof.name };
                categories[category].push(serviceWithContext);
            });
        });
        return categories;
    }, [userProfile?.professionals]);

    return (
        <div>
            <ServiceModal 
                isOpen={modal.isOpen} 
                mode={modal.mode} 
                service={modal.service} 
                professionalId={modal.professionalId}
                onClose={() => setModal({ isOpen: false, mode: 'add', professionalId: '' })} 
                onSave={handleSaveService} 
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-white">Gestão de Serviços</h2>
                {userProfile?.professionals && userProfile.professionals.length > 0 && (
                    <select 
                        onChange={(e) => setModal({ isOpen: true, mode: 'add', professionalId: e.target.value })}
                        className="bg-[#daa520] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#c8961e] transition-colors shadow-lg shadow-[#daa520]/20 appearance-none text-center cursor-pointer"
                        value=""
                    >
                        <option value="" disabled>+ Adicionar Serviço</option>
                        {userProfile.professionals.map(prof => (
                            <option key={prof.id} value={prof.id}>{prof.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {userProfile?.professionals && userProfile.professionals.length > 0 ? (
                <div className="space-y-8">
                    {Object.entries(servicesByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, services]) => (
                        <div key={category}>
                            <h3 className="text-xl font-bold text-[#daa520] border-b-2 border-[#daa520]/20 pb-2 mb-4 flex items-center gap-2">
                                <Tag size={20} />
                                {category}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map(service => (
                                    <div key={service.id} className="group relative bg-gray-800/80 p-5 rounded-xl border border-gray-700 hover:border-[#daa520]/50 transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-lg font-bold text-white truncate">{service.name}</h4>
                                                <p className="text-sm text-gray-400">por {service.professionalName}</p>
                                            </div>
                                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button onClick={() => setModal({ isOpen: true, mode: 'edit', service, professionalId: service.professionalId })} className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded-md text-white"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteService(service.professionalId, service.id)} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 my-3 min-h-[40px]">{service.description || 'Sem descrição.'}</p>
                                        <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                                            <p className="text-sm text-gray-400">{service.duration} min</p>
                                            <p className="text-xl font-bold text-[#daa520]">R$ {service.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-10 bg-black/30 rounded-xl border border-dashed border-gray-700">
                    <p className="mb-4">Para adicionar serviços, primeiro precisa de criar um profissional.</p>
                    {/* Aqui você pode adicionar um botão que leva para a aba de 'Profissionais' */}
                </div>
            )}
        </div>
    );
};

export default ServicesManagement;

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config'; 
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import type { Professional } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Edit, Trash2, User, Image as ImageIcon, X, UploadCloud } from 'lucide-react';

// --- Tipos e Interfaces ---
type ModalMode = 'add' | 'edit';
interface ProfessionalFormData {
    name: string;
    photoURL: string;
}

// --- Componente do Modal para Adicionar/Editar Profissional ---
const ProfessionalModal = ({ isOpen, mode, professional, onClose, onSave }: { isOpen: boolean; mode: ModalMode; professional?: Professional; onClose: () => void; onSave: (data: Professional, imageFile: File | null, isEditing: boolean) => void; }) => {
    const [formData, setFormData] = useState<ProfessionalFormData>({ name: '', photoURL: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && professional) {
                setFormData({ name: professional.name, photoURL: professional.photoURL || '' });
                setImagePreview(professional.photoURL || null);
            } else {
                setFormData({ name: '', photoURL: '' });
                setImagePreview(null);
            }
            setImageFile(null); // Reset file on open
        }
    }, [mode, professional, isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const professionalData: Professional = {
            id: mode === 'edit' && professional ? professional.id : uuidv4(),
            name: formData.name,
            photoURL: formData.photoURL, // A URL final será atualizada na função de save
            services: mode === 'edit' && professional ? professional.services : [],
            availability: mode === 'edit' && professional ? professional.availability : {},
        };
        onSave(professionalData, imageFile, mode === 'edit');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-down">
            <div className="bg-gray-900/80 p-8 rounded-2xl w-full max-w-lg border border-[#daa520]/30 shadow-2xl shadow-[#daa520]/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">{mode === 'add' ? 'Adicionar Novo Profissional' : 'Editar Profissional'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24">
                            <img 
                                src={imagePreview || `https://placehold.co/150x150/111827/daa520?text=${formData.name.charAt(0) || '?'}`} 
                                alt="Pré-visualização" 
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"
                            />
                             <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-[#daa520] p-2 rounded-full text-black hover:bg-[#c8961e] transition-colors">
                                <UploadCloud size={16} />
                            </button>
                        </div>
                        <div className="relative flex-grow">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input name="name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} placeholder="Nome do Profissional" required className="w-full bg-gray-800 p-3 pl-10 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700" />
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 font-semibold px-6 py-2 rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" className="bg-[#daa520] hover:bg-[#c8961e] text-black font-semibold px-6 py-2 rounded-lg transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Componente Principal ---
const ProfessionalsManagement = () => {
    const { userProfile, setUserProfile, uploadImage } = useAuth(); // Adicionar `uploadImage` do contexto
    const { showToast } = useToast();
    const [modal, setModal] = useState<{ isOpen: boolean; mode: ModalMode; professional?: Professional; }>({ isOpen: false, mode: 'add' });
    const [isUploading, setIsUploading] = useState(false);

    const handleSaveProfessional = async (professionalData: Professional, imageFile: File | null, isEditing: boolean) => {
        if (!userProfile) return;
        setIsUploading(true);

        let finalPhotoURL = professionalData.photoURL;

        if (imageFile) {
            try {
                const uploadPath = `professionals/${userProfile.uid}/${professionalData.id}/${imageFile.name}`;
                finalPhotoURL = await uploadImage(imageFile, uploadPath);
            } catch (error) {
                showToast('Erro ao fazer upload da imagem.', 'error');
                console.error(error);
                setIsUploading(false);
                return;
            }
        }
        
        const finalProfessionalData = { ...professionalData, photoURL: finalPhotoURL };

        const existingProfessionals = userProfile.professionals || [];
        const updatedProfessionals = isEditing
            ? existingProfessionals.map(p => p.id === finalProfessionalData.id ? finalProfessionalData : p)
            : [...existingProfessionals, finalProfessionalData];

        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { professionals: updatedProfessionals });
            setUserProfile(prev => ({ ...prev!, professionals: updatedProfessionals }));
            showToast(`Profissional ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            setModal({ isOpen: false, mode: 'add' });
        } catch (error) {
            showToast('Ocorreu um erro ao guardar os dados.', 'error');
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteProfessional = async (professionalId: string) => {
        if (!userProfile || !window.confirm("Tem a certeza de que pretende eliminar este profissional? Todos os seus serviços associados também serão removidos.")) return;

        const updatedProfessionals = userProfile.professionals.filter(p => p.id !== professionalId);

        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, { professionals: updatedProfessionals });
            setUserProfile(prev => ({ ...prev!, professionals: updatedProfessionals }));
            showToast('Profissional eliminado com sucesso!', 'success');
        } catch (error) {
            showToast('Ocorreu um erro ao eliminar o profissional.', 'error');
            console.error(error);
        }
    };

    return (
        <div>
            <ProfessionalModal 
                isOpen={modal.isOpen} 
                mode={modal.mode} 
                professional={modal.professional}
                onClose={() => setModal({ isOpen: false, mode: 'add' })} 
                onSave={handleSaveProfessional} 
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-white">Equipa de Profissionais</h2>
                <button 
                    onClick={() => setModal({ isOpen: true, mode: 'add' })}
                    className="flex items-center gap-2 bg-[#daa520] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#c8961e] transition-colors shadow-lg shadow-[#daa520]/20"
                >
                    <PlusCircle className="h-5 w-5" />
                    Adicionar Profissional
                </button>
            </div>

            {isUploading && <p className="text-center text-[#daa520]">A guardar dados e imagem...</p>}

            {userProfile?.professionals && userProfile.professionals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userProfile.professionals.map(prof => (
                        <div key={prof.id} className="group relative bg-gray-800/80 p-5 rounded-xl border border-gray-700 hover:border-[#daa520]/50 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center">
                                <img 
                                    src={prof.photoURL || `https://placehold.co/150x150/111827/daa520?text=${prof.name.charAt(0)}`} 
                                    alt={`Foto de ${prof.name}`} 
                                    className="h-20 w-20 rounded-full object-cover border-4 border-gray-900/50"
                                />
                                <div className="ml-4">
                                    <h3 className="text-xl font-bold text-white">{prof.name}</h3>
                                    <p className="text-sm text-gray-400">{prof.services?.length || 0} serviços</p>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button onClick={() => setModal({ isOpen: true, mode: 'edit', professional: prof })} className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded-md text-white"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteProfessional(prof.id)} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-10 bg-black/30 rounded-xl border border-dashed border-gray-700">
                    <User size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white">Nenhum profissional adicionado</h3>
                    <p className="text-sm mt-2">Comece por adicionar os membros da sua equipa.</p>
                </div>
            )}
        </div>
    );
};

export default ProfessionalsManagement;

import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useProfileStore } from '../../store/profileStore';
import { uploadProfilePicture } from '../../firebase/userService';

export const ProfilePictureUploader = () => {
    const { userProfile, fetchUserProfile } = useProfileStore();
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(userProfile?.profilePictureUrl || null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userProfile?.id) return;

        setPreview(URL.createObjectURL(file)); // Mostra o preview otimisticamente
        setIsUploading(true);
        try {
            await uploadProfilePicture(userProfile.id, file);
            // Re-busca o perfil para garantir que o estado global está 100% atualizado
            await fetchUserProfile(userProfile.id); 
        } catch (error) {
            console.error("Erro no upload:", error);
            setPreview(userProfile?.profilePictureUrl || null); // Reverte o preview em caso de erro
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg group">
                <img
                    src={preview || 'https://placehold.co/128x128/e2e8f0/4a5568?text=Foto'}
                    alt="Foto de Perfil"
                    className="w-full h-full object-cover"
                />
                <label htmlFor="photo-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {isUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                    <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isUploading} />
                </label>
            </div>
        </div>
    );
};
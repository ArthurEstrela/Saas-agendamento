import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from './config';
import type { Professional, ServiceProviderProfile } from '../types';

/**
 * Adiciona um novo profissional ao perfil de um prestador.
 */
export const addProfessionalToProvider = async (providerId: string, professional: Professional): Promise<void> => {
  const providerRef = doc(db, 'users', providerId);
  await updateDoc(providerRef, {
    professionals: arrayUnion(professional),
  });
};

/**
 * Remove um profissional do perfil de um prestador.
 */
export const removeProfessionalFromProvider = async (providerId: string, professional: Professional): Promise<void> => {
    const providerRef = doc(db, 'users', providerId);
    await updateDoc(providerRef, {
        professionals: arrayRemove(professional),
    });
};

/**
 * Atualiza os dados de um profissional existente.
 */
export const updateProfessionalInProvider = async (providerId: string, updatedProfessional: Professional): Promise<void> => {
    const providerRef = doc(db, 'users', providerId);
    const docSnap = await getDoc(providerRef);

    if (docSnap.exists()) {
        const providerData = docSnap.data() as ServiceProviderProfile;
        const allProfessionals = providerData.professionals || [];
        
        const updatedProfessionals = allProfessionals.map(prof => 
            prof.id === updatedProfessional.id ? updatedProfessional : prof
        );

        await updateDoc(providerRef, {
            professionals: updatedProfessionals
        });
    }
};
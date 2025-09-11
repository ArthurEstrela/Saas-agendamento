import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from './config';
import type { Service, ServiceProviderProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';
/**
 * Adiciona um novo serviço ao perfil de um prestador.
 */
export const addServiceToProvider = async (providerId: string, serviceData: Omit<Service, 'id'>): Promise<void> => {
  const providerRef = doc(db, 'users', providerId);
  const newService: Service = {
    id: uuidv4(), // Gera um ID único para o novo serviço
    ...serviceData,
  };
  await updateDoc(providerRef, {
    services: arrayUnion(newService),
  });
};

/**
 * Remove um serviço do perfil de um prestador.
 */
export const removeServiceFromProvider = async (providerId: string, service: Service): Promise<void> => {
  const providerRef = doc(db, 'users', providerId);
  await updateDoc(providerRef, {
    services: arrayRemove(service),
  });
};

// A atualização de um serviço é mais complexa, pois precisa encontrar o serviço no array e substituí-lo.
// Geralmente é mais fácil remover o antigo e adicionar o novo.

export const updateServiceInProvider = async (providerId: string, serviceId: string, updates: Partial<Omit<Service, 'id'>>): Promise<void> => {
    const providerRef = doc(db, 'users', providerId);
    const docSnap = await getDoc(providerRef);

    if (docSnap.exists()) {
        const providerData = docSnap.data() as ServiceProviderProfile;
        const currentServices = providerData.services || [];
        
        const updatedServices = currentServices.map(service => 
            service.id === serviceId ? { ...service, ...updates } : service
        );

        await updateDoc(providerRef, {
            services: updatedServices
        });
    } else {
        throw new Error("Prestador de serviço não encontrado.");
    }
};
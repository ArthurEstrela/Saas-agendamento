import React from 'react';
import { useAuth } from '../context/AuthContext';
import ClientDashboard from './ClientDashboard';
import ServiceProviderDashboard from './ServiceProviderDashboard';

const Dashboard = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <div>Carregando perfil...</div>;
  }

  return userProfile.userType === 'serviceProvider' ? <ServiceProviderDashboard /> : <ClientDashboard />;
};

export default Dashboard;
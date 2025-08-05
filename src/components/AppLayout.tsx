// src/components/AppLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Header />
      <main className="flex-grow">
        <Outlet /> {/* O conteúdo da rota atual será renderizado aqui */}
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;

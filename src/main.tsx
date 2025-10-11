// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast'; // 1. Importar o Toaster

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 2. Adicionar o componente Toaster com customizações */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Estilos padrão para todos os toasts
          className: '',
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
            border: '1px solid #4a4a4a',
          },

          // Estilos específicos por tipo
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981', // Verde
              secondary: 'white',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444', // Vermelho
              secondary: 'white',
            },
          },
        }}
      />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
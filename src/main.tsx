import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. O HelmetProvider envolve tudo para gerenciar o SEO de todas as rotas */}
    <HelmetProvider>
      <BrowserRouter>
        {/* 2. Toaster configurado com seus estilos personalizados */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 5000,
            style: {
              background: '#363636',
              color: '#fff',
              border: '1px solid #4a4a4a',
            },
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
        {/* 3. O App é renderizado apenas uma vez dentro do Router */}
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
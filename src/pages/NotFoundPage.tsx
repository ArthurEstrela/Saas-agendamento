// src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom';
import { Home, Frown } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Frown className="text-amber-500" size={96} />
      </motion.div>
      
      <motion.h1 
        className="text-6xl font-extrabold text-white mt-8 mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        404
      </motion.h1>
      
      <motion.p 
        className="text-xl text-gray-400 mb-8 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Oops! A página que você está procurando não foi encontrada.
      </motion.p>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Link
          to="/"
          className="flex items-center justify-center px-6 py-3 bg-amber-500 text-black font-semibold rounded-lg shadow-lg hover:bg-amber-600 transition-colors duration-300"
        >
          <Home className="mr-2" size={20} />
          Voltar para a Página Inicial
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;

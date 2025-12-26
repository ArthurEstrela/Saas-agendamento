import { Link } from 'react-router-dom';
import { Home, Frown } from 'lucide-react';
import { motion } from 'framer-motion';

// UI
import { Button } from '../components/ui/button';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Frown className="text-primary/80" size={120} />
      </motion.div>
      
      <motion.h1 
        className="text-8xl font-extrabold text-white mt-8 mb-2 tracking-tighter"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        404
      </motion.h1>
      
      <motion.p 
        className="text-2xl text-gray-400 mb-8 font-light"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Página não encontrada.
      </motion.p>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Link to="/">
          <Button size="lg" className="font-bold gap-2 px-8 h-12 text-lg shadow-lg shadow-primary/20">
            <Home size={20} />
            Voltar ao Início
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
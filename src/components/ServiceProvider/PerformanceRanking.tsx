import { motion } from "framer-motion";
import { Crown } from "lucide-react";

interface RankingItem {
  name: string;
  revenue: number;
}

interface PerformanceRankingProps {
  title: string;
  icon: React.ElementType;
  data: RankingItem[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const PerformanceRanking = ({ title, icon: Icon, data }: PerformanceRankingProps) => {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 h-full">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-6 h-6 text-amber-400" />
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {data.length > 0 ? (
        <ul className="space-y-4">
          {data.map((item, index) => (
            <motion.li 
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex justify-between items-center text-sm mb-1">
                <div className="flex items-center gap-2">
                  {index === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                  <span className="font-medium text-white truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-300">{formatCurrency(item.revenue)}</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: totalRevenue > 0 ? `${(item.revenue / totalRevenue) * 100}%` : '0%' }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                />
              </div>
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>Não há dados de receita no período para gerar o ranking.</p>
        </div>
      )}
    </div>
  );
};

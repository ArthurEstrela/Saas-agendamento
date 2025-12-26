import { motion } from "framer-motion";
import { Crown, Trophy } from "lucide-react";

// UI
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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

export const PerformanceRanking = ({
  title,
  icon: Icon,
  data,
}: PerformanceRankingProps) => {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card className="h-full bg-gray-900/50 border-gray-800 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-lg font-bold text-white">
          <div className="p-2 bg-gray-800 rounded-lg text-amber-500">
            <Icon size={20} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {data.length > 0 ? (
          <ul className="space-y-5 mt-2">
            {data.map((item, index) => (
              <motion.li
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex justify-between items-end text-sm mb-2">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />
                    )}
                    {index === 1 && (
                      <Trophy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    {index === 2 && (
                      <Trophy className="w-3.5 h-3.5 text-amber-700" />
                    )}
                    <span
                      className={`font-medium truncate ${
                        index === 0 ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-gray-200 bg-gray-800 px-2 py-0.5 rounded text-xs">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-amber-600 to-yellow-400 h-full rounded-full shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        totalRevenue > 0
                          ? `${(item.revenue / totalRevenue) * 100}%`
                          : "0%",
                    }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 50,
                    }}
                  />
                </div>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Trophy size={32} className="mb-2 opacity-20" />
            <p className="text-sm">Sem dados para o ranking.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

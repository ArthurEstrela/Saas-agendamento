import type { Service } from '../../types';
import { Edit, Trash2, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}

export const ServiceCard = ({ service, onEdit, onDelete }: ServiceCardProps) => {
  return (
    <Card className="flex flex-col justify-between hover:border-primary/50 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-xl font-bold text-gray-100 line-clamp-1 group-hover:text-primary transition-colors">
            {service.name}
          </CardTitle>
        </div>
        
        {/* Badges de Informação */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Clock size={14} className="text-primary" />
            <span>{service.duration} min</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 border-primary/30 text-primary">
            <DollarSign size={14} />
            <span>R$ {service.price.toFixed(2).replace('.', ',')}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-gray-400 text-sm line-clamp-3 min-h-[40px]">
          {service.description || "Sem descrição disponível."}
        </p>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 pt-2 border-t border-gray-800/50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete}
          className="text-gray-500 hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 size={16} className="mr-2" />
          Excluir
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onEdit}
          className="hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <Edit size={16} className="mr-2" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
};
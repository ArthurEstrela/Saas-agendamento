import type { Professional } from '../../types';
import { Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ProfessionalCardProps {
  professional: Professional;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProfessionalCard = ({ professional, onEdit, onDelete }: ProfessionalCardProps) => {
  const services = professional.services || [];
  const initials = professional.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-all duration-300 group">
      <CardContent className="p-6 flex-grow">
        <div className="flex items-center gap-4 mb-5">
          <Avatar className="h-16 w-16 border-2 border-gray-800 group-hover:border-primary transition-colors">
            <AvatarImage src={professional.photoURL} alt={professional.name} />
            <AvatarFallback className="bg-gray-800 text-lg font-bold text-primary">
                {initials}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="text-lg font-bold text-gray-100 group-hover:text-primary transition-colors">
                {professional.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
                {services.length} {services.length === 1 ? 'serviço' : 'serviços'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500">Especialidades</h4>
          <div className="flex flex-wrap gap-2">
            {services.length > 0 ? (
              services.slice(0, 3).map(service => (
                <Badge key={service.id} variant="secondary" className="bg-gray-800 text-gray-300 font-normal">
                  {service.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-gray-600 italic">Nenhum serviço atribuído</span>
            )}
            
            {services.length > 3 && (
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                  +{services.length - 3}
                </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 bg-black/20 border-t border-gray-800/50 flex justify-end gap-2">
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDelete} 
            className="text-gray-500 hover:text-destructive hover:bg-destructive/10"
        >
            <Trash2 size={16} />
        </Button>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit}
            className="text-gray-400 hover:text-primary hover:bg-primary/10"
        >
            <Edit size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
};
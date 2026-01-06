import type { Professional } from '../../types';
import { Edit, Trash2, Crown, Shield } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils/cn';

interface ProfessionalCardProps {
  professional: Professional;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProfessionalCard = ({ professional, onEdit, onDelete }: ProfessionalCardProps) => {
  const services = professional.services || [];
  const initials = professional.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const isOwner = professional.isOwner;

  return (
    <Card 
      className={cn(
        "flex flex-col h-full transition-all duration-300 group relative overflow-hidden",
        isOwner 
          ? "border-primary/40 bg-primary/5 hover:border-primary" 
          : "hover:border-primary/50"
      )}
    >
      {/* Background Decorativo para o Dono */}
      {isOwner && (
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Crown size={64} />
        </div>
      )}

      <CardContent className="p-6 flex-grow relative z-10">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <Avatar className={cn(
              "h-16 w-16 border-2 transition-colors",
              isOwner ? "border-primary" : "border-gray-800 group-hover:border-primary"
            )}>
              <AvatarImage src={professional.photoURL} alt={professional.name} className="object-cover" />
              <AvatarFallback className="bg-gray-800 text-lg font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-black rounded-full p-1 shadow-lg" title="Proprietário">
                <Crown size={12} fill="currentColor" />
              </div>
            )}
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-100 group-hover:text-primary transition-colors truncate">
                {professional.name}
              </h3>
            </div>
            
            {isOwner ? (
              <Badge variant="outline" className="mt-1 border-primary/30 text-primary bg-primary/10 text-[10px] h-5 px-1.5 gap-1">
                <Shield size={10} /> Proprietário
              </Badge>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                {services.length} {services.length === 1 ? 'serviço' : 'serviços'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 flex justify-between items-center">
            Especialidades
          </h4>
          <div className="flex flex-wrap gap-2">
            {services.length > 0 ? (
              services.slice(0, 3).map(service => (
                <Badge key={service.id} variant="secondary" className="bg-gray-800 text-gray-300 font-normal hover:bg-gray-700">
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
        {/* CORREÇÃO: Removida a condicional !isOwner. Agora o botão aparece para todos. */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete} 
          className="text-gray-500 hover:text-destructive hover:bg-destructive/10"
          // O título muda dinamicamente para fazer mais sentido
          title={isOwner ? "Desativar Perfil" : "Remover Profissional"}
        >
          <Trash2 size={16} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onEdit}
          className="text-gray-400 hover:text-primary hover:bg-primary/10"
          title="Editar Dados"
        >
          <Edit size={16} /> <span className="ml-2 text-xs">Editar</span>
        </Button>
      </CardFooter>
    </Card>
  );
};
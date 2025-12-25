// src/components/ui/avatar.tsx
import * as React from "react"
import { cn } from "../../lib/utils/cn"

// Contexto para comunicação entre Imagem e Fallback
const AvatarContext = React.createContext<{
  hasError: boolean;
  setHasError: (value: boolean) => void;
} | null>(null);

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    return (
      <AvatarContext.Provider value={{ hasError, setHasError }}>
        <div
          ref={ref}
          className={cn(
            "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
            className
          )}
          {...props}
        />
      </AvatarContext.Provider>
    )
  }
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, src, alt, ...props }, ref) => {
    const context = React.useContext(AvatarContext);

    // Se não tiver src, já marca como erro para mostrar o fallback
    React.useEffect(() => {
      if (!src && context) context.setHasError(true);
      else if (src && context) context.setHasError(false);
    }, [src, context]);

    // Se tiver erro, não renderiza a imagem (para não ficar ícone quebrado)
    if (context?.hasError) return null;

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn("aspect-square h-full w-full object-cover", className)}
        onError={() => context?.setHasError(true)}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(AvatarContext);

    // Só renderiza o fallback se tiver ocorrido erro na imagem (ou estiver carregando sem src)
    if (!context?.hasError) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-gray-800 text-gray-400 font-semibold uppercase tracking-wider",
          className
        )}
        {...props}
      />
    )
  }
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
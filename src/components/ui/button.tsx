import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils/cn"; // Certifique-se que o caminho está correto

const buttonVariants = cva(
  // Base: adicionei focus-visible:ring-ring para usar a cor do anel definida no config
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // PADRONIZADO: Usa primary e primary-hover definidos no tailwind.config.js
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        
        // PADRONIZADO: Usa destructive (vermelho de erro)
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        
        // PADRONIZADO: Usa input (borda) e secondary (hover)
        outline:
          "border border-input bg-background hover:bg-secondary hover:text-secondary-foreground",
        
        // PADRONIZADO: Usa secondary (cinza escuro)
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        
        // PADRONIZADO: Ghost usa o mesmo hover do secondary
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        
        // Já estava correto
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
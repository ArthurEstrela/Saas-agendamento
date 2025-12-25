import * as React from "react"
import { cn } from "../../lib/utils/cn"

// O container principal do cartão
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base: Fundo surface, borda sutil, sombra suave
        "rounded-xl border border-gray-800 bg-surface text-gray-100 shadow-sm transition-all",
        // Opcional: Adicione classes de hover se quiser efeito em todos os cards,
        // ou deixe para adicionar manualmente onde precisar (ex: hover:border-primary/50)
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

// Cabeçalho do cartão (opcional, para títulos)
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

// Título principal do cartão
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight text-primary", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

// Descrição menor abaixo do título
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-400", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

// Onde vai o conteúdo principal
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

// Rodapé para botões ou ações
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
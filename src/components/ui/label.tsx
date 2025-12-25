import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label" // Se não tiver radix label instalado, use a versão nativa abaixo*
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils/cn"

// Se você NÃO quiser instalar @radix-ui/react-label, pode trocar "LabelPrimitive.Root" por "label"
// Mas recomendo instalar: npm install @radix-ui/react-label

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-200"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
import * as React from "react";
import { cn } from "../../lib/utils/cn";

type TypographyVariant = 
  | "h1" 
  | "h2" 
  | "h3" 
  | "h4" 
  | "p" 
  | "lead" 
  | "large" 
  | "small" 
  | "muted";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: React.ElementType; // Permite mudar a tag HTML (ex: usar h2 visualmente mas h1 semanticamente)
}

const variantStyles: Record<TypographyVariant, string> = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-gray-50",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 text-gray-100",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight text-gray-100",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight text-gray-100",
  p: "leading-7 text-gray-300 [&:not(:first-child)]:mt-6",
  lead: "text-xl text-gray-400",
  large: "text-lg font-semibold text-gray-200",
  small: "text-sm font-medium leading-none text-gray-400",
  muted: "text-sm text-gray-500",
};

const defaultTags: Record<TypographyVariant, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  p: "p",
  lead: "p",
  large: "div",
  small: "small",
  muted: "p",
};

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = "p", as, children, ...props }, ref) => {
    const Component = as || defaultTags[variant];

    return (
      <Component
        ref={ref}
        className={cn(variantStyles[variant], className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Typography.displayName = "Typography";

export { Typography };
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina e mescla classes do Tailwind CSS de forma segura.
 * Evita conflitos de classes e permite condicionais.
 * @param inputs - As classes a serem combinadas.
 * @returns Uma string de classes CSS otimizada.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

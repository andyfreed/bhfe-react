import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single string using clsx and tailwind-merge
 * Useful for combining conditional classes and default classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 
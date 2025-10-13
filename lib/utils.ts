import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number to a maximum of two decimal places for display only.
 * - Rounds to 2 decimals
 * - Trims trailing zeros and trailing decimal point
 * - Preserves negative sign
 * - Handles very small values by rounding to 0
 */
export function formatNumberMax2(value: number | string): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (!isFinite(num)) return '0'
  const rounded = Math.round(num * 100) / 100
  // Use toFixed then trim trailing zeros to ensure consistent output across locales
  const fixed = rounded.toFixed(2)
  return fixed.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

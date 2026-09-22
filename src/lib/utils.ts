import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBtc(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}₿ ${Math.abs(n).toFixed(8)}`;
}

export function formatBtcShort(n: number): string {
  if (n >= 1) return `₿ ${n.toFixed(3)}`;
  if (n >= 0.01) return `₿ ${n.toFixed(4)}`;
  return `₿ ${n.toFixed(6)}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

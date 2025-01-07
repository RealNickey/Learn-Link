import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function cnTwMerge(...inputs) {
  return twMerge(clsx(inputs));
}

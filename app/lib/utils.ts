import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const DIFFICULTIES = ["Beginner", "Easy", "Medium", "Hard", "Expert"] as const;

export const DIFFICULTY_RANGES: Record<string, [number, number]> = {
  Beginner: [0, 15],
  Easy: [15, 35],
  Medium: [35, 60],
  Hard: [60, 80],
  Expert: [80, 100],
};

export type Holiday = 'christmas' | 'halloween' | null;

export function detectHoliday(): Holiday {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed (0 = January)
  const day = now.getDate();

  // Halloween: October 25 - November 1
  if ((month === 9 && day >= 25) || (month === 10 && day <= 1)) {
    return 'halloween';
  }

  // Christmas: December 15 - January 2
  if ((month === 11 && day >= 15) || (month === 0 && day <= 2)) {
    return 'christmas';
  }

  return null;
}

export const holidayThemes = {
  christmas: {
    background: 'bg-green-950',
    text: 'text-red-400',
    accent: 'text-red-500',
    border: 'border-red-900/50',
  },
  halloween: {
    background: 'bg-orange-950',
    text: 'text-red-700',
    accent: 'text-red-600',
    border: 'border-orange-900/50',
  },
} as const;

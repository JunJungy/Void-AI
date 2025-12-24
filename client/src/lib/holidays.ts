export type Holiday = 'christmas' | 'halloween' | 'thanksgiving' | 'valentines' | 'newyear' | 'july4th' | 'stpatricks' | null;

function getThanksgivingDate(year: number): number {
  // Thanksgiving is the 4th Thursday of November
  const nov1 = new Date(year, 10, 1); // November 1st
  const dayOfWeek = nov1.getDay(); // 0 = Sunday, 4 = Thursday
  const firstThursday = dayOfWeek <= 4 ? (4 - dayOfWeek + 1) : (11 - dayOfWeek + 4 + 1);
  return firstThursday + 21; // 4th Thursday
}

export function detectHoliday(): Holiday {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed (0 = January)
  const day = now.getDate();
  const year = now.getFullYear();

  // New Year's: December 31 - January 2
  if ((month === 11 && day === 31) || (month === 0 && day <= 2)) {
    return 'newyear';
  }

  // Valentine's Day: February 12 - 15
  if (month === 1 && day >= 12 && day <= 15) {
    return 'valentines';
  }

  // St. Patrick's Day: March 15 - 18
  if (month === 2 && day >= 15 && day <= 18) {
    return 'stpatricks';
  }

  // 4th of July: July 2 - 5
  if (month === 6 && day >= 2 && day <= 5) {
    return 'july4th';
  }

  // Halloween: October 25 - November 1
  if ((month === 9 && day >= 25) || (month === 10 && day <= 1)) {
    return 'halloween';
  }

  // Thanksgiving: 4th Thursday of November (and 2 days around it)
  const thanksgivingDay = getThanksgivingDate(year);
  if (month === 10 && day >= thanksgivingDay - 1 && day <= thanksgivingDay + 1) {
    return 'thanksgiving';
  }

  // Christmas: December 15 - December 30
  if (month === 11 && day >= 15 && day <= 30) {
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
  thanksgiving: {
    background: 'bg-amber-950',
    text: 'text-orange-400',
    accent: 'text-orange-500',
    border: 'border-amber-900/50',
  },
  valentines: {
    background: 'bg-pink-950',
    text: 'text-red-400',
    accent: 'text-pink-500',
    border: 'border-pink-900/50',
  },
  newyear: {
    background: 'bg-indigo-950',
    text: 'text-yellow-400',
    accent: 'text-yellow-500',
    border: 'border-indigo-900/50',
  },
  july4th: {
    background: 'bg-blue-950',
    text: 'text-red-400',
    accent: 'text-white',
    border: 'border-blue-900/50',
  },
  stpatricks: {
    background: 'bg-green-950',
    text: 'text-green-400',
    accent: 'text-green-500',
    border: 'border-green-900/50',
  },
} as const;

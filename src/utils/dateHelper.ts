/**
 * Date helper utilities for dynamic live Kurdish and localized dates
 */

export const KURDISH_DAY_NAMES = [
  'یەکشەممە',  // 0 - Sunday
  'دووشەممە',  // 1 - Monday
  'سێشەممە',  // 2 - Tuesday
  'چوارشەممە', // 3 - Wednesday
  'پێنجشەممە', // 4 - Thursday
  'هەینی',     // 5 - Friday
  'شەممە',     // 6 - Saturday
];

export const KURDISH_MONTH_NAMES = [
  'کانوونی دووەم', // 1 - Jan
  'شوبات',         // 2 - Feb
  'ئازار',         // 3 - Mar
  'نیسان',         // 4 - Apr
  'ئایار',         // 5 - May
  'حوزەیران',      // 6 - Jun
  'تەممووز',       // 7 - Jul
  'ئاب',           // 8 - Aug
  'ئەیلوول',       // 9 - Sep
  'تشرینی یەکەم',   // 10 - Oct
  'تشرینی دووەم',   // 11 - Nov
  'کانوونی یەکەم', // 12 - Dec
];

/**
 * Returns today's ISO date string: YYYY-MM-DD
 */
export const getTodayISODate = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Format any date or ISO string into a rich Kurdish date string
 * Example output: "دووشەممە، ٢٤ی ئابی ٢٠٢٦"
 */
export const formatLiveKurdishFullDate = (inputDate?: Date | string): string => {
  let date: Date;
  if (!inputDate) {
    date = new Date();
  } else if (typeof inputDate === 'string') {
    const parts = inputDate.split('-');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      date = new Date(inputDate);
    }
  } else {
    date = inputDate;
  }

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const dayName = KURDISH_DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const monthName = KURDISH_MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}، ${day}ی ${monthName}ی ${year}`;
};

/**
 * Formats date into DD/MM/YYYY
 */
export const formatStandardDate = (inputDate?: Date | string): string => {
  let date: Date;
  if (!inputDate) {
    date = new Date();
  } else if (typeof inputDate === 'string') {
    const parts = inputDate.split('-');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      date = new Date(inputDate);
    }
  } else {
    date = inputDate;
  }

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * Get structured today information
 */
export const getTodayLiveDetails = () => {
  const now = new Date();
  const dayIndex = now.getDay();
  const dayName = KURDISH_DAY_NAMES[dayIndex];
  const dayNumber = now.getDate();
  const monthIndex = now.getMonth();
  const monthName = KURDISH_MONTH_NAMES[monthIndex];
  const year = now.getFullYear();
  const isoDate = getTodayISODate();
  const fullKurdish = `${dayName}، ${dayNumber}ی ${monthName}ی ${year}`;
  const standardDate = `${String(dayNumber).padStart(2, '0')}/${String(monthIndex + 1).padStart(2, '0')}/${year}`;

  return {
    dateObj: now,
    dayIndex,
    dayName,
    dayNumber,
    monthIndex,
    monthName,
    year,
    isoDate,
    fullKurdish,
    standardDate,
  };
};

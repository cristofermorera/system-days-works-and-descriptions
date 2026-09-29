import type { CalendarEntriesMap, MonthSummaryData } from '../types';

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const WEEKDAYS_SUNDAY_FIRST = [
  { short: 'Dom', full: 'Domingo', isWeekend: true },
  { short: 'Seg', full: 'Segunda-feira', isWeekend: false },
  { short: 'Ter', full: 'Terça-feira', isWeekend: false },
  { short: 'Qua', full: 'Quarta-feira', isWeekend: false },
  { short: 'Qui', full: 'Quinta-feira', isWeekend: false },
  { short: 'Sex', full: 'Sexta-feira', isWeekend: false },
  { short: 'Sáb', full: 'Sábado', isWeekend: true },
];

export const WEEKDAYS_MONDAY_FIRST = [
  { short: 'Seg', full: 'Segunda-feira', isWeekend: false },
  { short: 'Ter', full: 'Terça-feira', isWeekend: false },
  { short: 'Qua', full: 'Quarta-feira', isWeekend: false },
  { short: 'Qui', full: 'Quinta-feira', isWeekend: false },
  { short: 'Sex', full: 'Sexta-feira', isWeekend: false },
  { short: 'Sáb', full: 'Sábado', isWeekend: true },
  { short: 'Dom', full: 'Domingo', isWeekend: true },
];

export function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const parts = key.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

export interface CalendarDayInfo {
  dayNumber: number;
  year: number;
  month: number;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export function getCalendarGrid(
  year: number,
  month: number,
  startOnMonday = true
): CalendarDayInfo[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1);
  const rawFirstDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Leading padding count
  let leadingPadding: number;
  if (startOnMonday) {
    leadingPadding = (rawFirstDayOfWeek + 6) % 7;
  } else {
    leadingPadding = rawFirstDayOfWeek;
  }

  const cells: CalendarDayInfo[] = [];

  // Previous month padding days
  const prevMonthIndex = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  for (let i = leadingPadding - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const dateKey = formatDateKey(prevMonthYear, prevMonthIndex, dayNum);
    const dateObj = new Date(prevMonthYear, prevMonthIndex, dayNum);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    cells.push({
      dayNumber: dayNum,
      year: prevMonthYear,
      month: prevMonthIndex,
      dateKey,
      isCurrentMonth: false,
      isToday:
        prevMonthYear === currentYear &&
        prevMonthIndex === currentMonth &&
        dayNum === currentDay,
      isWeekend,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = formatDateKey(year, month, d);
    const dateObj = new Date(year, month, d);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    cells.push({
      dayNumber: d,
      year,
      month,
      dateKey,
      isCurrentMonth: true,
      isToday:
        year === currentYear &&
        month === currentMonth &&
        d === currentDay,
      isWeekend,
    });
  }

  // Trailing padding days to fill 5 or 6 complete weeks (multiple of 7)
  const remainder = cells.length % 7;
  const trailingPadding = remainder === 0 ? 0 : 7 - remainder;

  const nextMonthIndex = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;

  for (let d = 1; d <= trailingPadding; d++) {
    const dateKey = formatDateKey(nextMonthYear, nextMonthIndex, d);
    const dateObj = new Date(nextMonthYear, nextMonthIndex, d);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    cells.push({
      dayNumber: d,
      year: nextMonthYear,
      month: nextMonthIndex,
      dateKey,
      isCurrentMonth: false,
      isToday:
        nextMonthYear === currentYear &&
        nextMonthIndex === currentMonth &&
        d === currentDay,
      isWeekend,
    });
  }

  return cells;
}

export function computeMonthSummary(
  entries: CalendarEntriesMap,
  year: number,
  month: number
): MonthSummaryData {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  let fullDays = 0;
  let halfDays = 0;
  let totalIconsCount = 0;
  let activeDaysCount = 0;

  for (const [dateKey, dayEntry] of Object.entries(entries)) {
    if (dateKey.startsWith(monthPrefix) && dayEntry?.icons && dayEntry.icons.length > 0) {
      activeDaysCount += 1;
      totalIconsCount += dayEntry.icons.length;

      const hasFullCheck = dayEntry.icons.some(
        (i) => i.icon === 'check_full' || i.id === 'icon_check_full' || i.icon === '✅'
      );
      const hasHalfCheck = dayEntry.icons.some(
        (i) =>
          i.icon === 'check_half' ||
          i.id === 'icon_check_half' ||
          i.icon === '🕐' ||
          i.icon === '◐'
      );

      if (hasFullCheck) {
        fullDays += 1;
      } else if (hasHalfCheck) {
        halfDays += 1;
      }
    }
  }

  const totalDaysEquivalent = fullDays + halfDays * 0.5;

  return {
    fullDays,
    halfDays,
    totalDaysEquivalent,
    totalIconsCount,
    activeDaysCount,
  };
}

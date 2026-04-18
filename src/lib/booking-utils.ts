import { 
  addMinutes, 
  format, 
  isBefore, 
  isAfter, 
  isSameDay, 
  startOfDay, 
  setHours, 
  setMinutes,
  getDay,
  getMonth,
  getDate,
  isWeekend
} from 'date-fns';

export const BUSINESS_CONFIG = {
  name: "Chico Cabeleireiros",
  professional: "Sérgio Ramos",
  phone: "+351 916979949",
  address: "Rua do Douro N2b Cruz de Pau",
  mapsLink: "https://www.google.com/maps/dir//Cabeleireiro+Chico,+R.+do+Douro+2B,+2845-095+Amora/@38.620147,-9.1345474,15z/data=!4m8!4m7!1m0!1m5!1m1!1s0xd194a6d3e3b00b7:0x60326cff5da30ab7!2m2!1d-9.1248588!2d38.6194018?entry=ttu&g_ep=EgoyMDI2MDQwOC4wIKXMDSoASAFQAw%3D%3D",
  price: 13.5,
  intervalMinutes: 40,
  morningStart: { hours: 10, minutes: 0 },
  morningEnd: { hours: 13, minutes: 0 },
  afternoonStart: { hours: 15, minutes: 0 },
  afternoonEnd: { hours: 19, minutes: 0 },
  saturdayEnd: { hours: 13, minutes: 0 },
  vacation: {
    start: { month: 7, day: 16 }, // August is month 7 (0-indexed)
    end: { month: 7, day: 30 }
  }
};

/**
 * Calculates Portuguese holidays for a given year.
 * Includes fixed and mobile holidays (Easter-based).
 */
export function getPortugueseHolidays(year: number): string[] {
  const holidays: string[] = [
    `${year}-01-01`, // Ano Novo
    `${year}-04-25`, // Dia da Liberdade
    `${year}-05-01`, // Dia do Trabalhador
    `${year}-06-10`, // Dia de Portugal
    `${year}-08-15`, // Assunção de Nossa Senhora
    `${year}-10-05`, // Implantação da República
    `${year}-11-01`, // Todos os Santos
    `${year}-12-01`, // Restauração da Independência
    `${year}-12-08`, // Imaculada Conceição
    `${year}-12-25`, // Natal
  ];

  // Mobile holidays calculation (Easter-based)
  // Butcher's algorithm for Easter Sunday
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const easter = new Date(year, month - 1, day);
  
  // Good Friday (2 days before Easter)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push(format(goodFriday, 'yyyy-MM-dd'));

  // Corpus Christi (60 days after Easter)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  holidays.push(format(corpusChristi, 'yyyy-MM-dd'));

  // Carnaval (47 days before Easter) - Optional but common
  const carnaval = new Date(easter);
  carnaval.setDate(easter.getDate() - 47);
  holidays.push(format(carnaval, 'yyyy-MM-dd'));

  return holidays;
}

export function isDateAvailable(date: Date): boolean {
  const day = getDay(date);
  const month = getMonth(date);
  const dayOfMonth = getDate(date);
  const year = date.getFullYear();
  const dateStr = format(date, 'yyyy-MM-dd');

  // Sunday is 0
  if (day === 0) return false;

  // Portuguese Holidays
  const holidays = getPortugueseHolidays(year);
  if (holidays.includes(dateStr)) return false;

  // Vacation: Aug 16-30 (Legacy hardcoded, dynamic vacations are handled in App.tsx)
  if (month === 7 && dayOfMonth >= 16 && dayOfMonth <= 30) return false;

  // Check if it's a past date
  if (isBefore(startOfDay(date), startOfDay(new Date()))) return false;

  return true;
}

export function getAvailableSlots(date: Date): string[] {
  if (!isDateAvailable(date)) return [];

  const day = getDay(date);
  const slots: string[] = [];

  // Morning slots
  let current = setMinutes(setHours(startOfDay(date), BUSINESS_CONFIG.morningStart.hours), BUSINESS_CONFIG.morningStart.minutes);
  const morningEnd = setMinutes(setHours(startOfDay(date), BUSINESS_CONFIG.morningEnd.hours), BUSINESS_CONFIG.morningEnd.minutes);

  while (isBefore(addMinutes(current, BUSINESS_CONFIG.intervalMinutes), addMinutes(morningEnd, 1))) {
    slots.push(format(current, 'HH:mm'));
    current = addMinutes(current, BUSINESS_CONFIG.intervalMinutes);
  }

  // Afternoon slots (only Mon-Fri)
  if (day >= 1 && day <= 5) {
    current = setMinutes(setHours(startOfDay(date), BUSINESS_CONFIG.afternoonStart.hours), BUSINESS_CONFIG.afternoonStart.minutes);
    const afternoonEnd = setMinutes(setHours(startOfDay(date), BUSINESS_CONFIG.afternoonEnd.hours), BUSINESS_CONFIG.afternoonEnd.minutes);

    while (isBefore(addMinutes(current, BUSINESS_CONFIG.intervalMinutes), addMinutes(afternoonEnd, 1))) {
      slots.push(format(current, 'HH:mm'));
      current = addMinutes(current, BUSINESS_CONFIG.intervalMinutes);
    }
  }

  return slots;
}

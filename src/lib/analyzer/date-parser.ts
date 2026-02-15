import {
  addDays,
  setHours,
  setMinutes,
  startOfDay,
  parse,
  isValid,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
  format,
} from "date-fns";
import { it } from "date-fns/locale";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TIMEZONE = "Europe/Rome";

// Italian day names
const DAY_PATTERNS: Record<string, (date: Date) => Date> = {
  lunedì: nextMonday,
  lunedi: nextMonday,
  lun: nextMonday,
  martedì: nextTuesday,
  martedi: nextTuesday,
  mart: nextTuesday,
  mar: nextTuesday,
  mercoledì: nextWednesday,
  mercoledi: nextWednesday,
  merc: nextWednesday,
  mer: nextWednesday,
  giovedì: nextThursday,
  giovedi: nextThursday,
  giov: nextThursday,
  gio: nextThursday,
  venerdì: nextFriday,
  venerdi: nextFriday,
  ven: nextFriday,
  sabato: nextSaturday,
  sab: nextSaturday,
  domenica: nextSunday,
  dom: nextSunday,
};

// Italian month names
const MONTH_MAP: Record<string, number> = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11,
  gen: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mag: 4,
  giu: 5,
  lug: 6,
  ago: 7,
  set: 8,
  ott: 9,
  nov: 10,
  dic: 11,
};

export interface ParsedDateTime {
  date: Date;
  hasTime: boolean;
  isConfirmed: boolean;
  original: string;
}

function getNow(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

function toUTC(date: Date): Date {
  return fromZonedTime(date, TIMEZONE);
}

export function parseItalianDate(text: string): ParsedDateTime | null {
  const lowText = text.toLowerCase().trim();
  const now = getNow();
  let result: ParsedDateTime | null = null;

  // Relative days: oggi, domani, dopodomani
  if (/\boggi\b/.test(lowText)) {
    result = {
      date: startOfDay(now),
      hasTime: false,
      isConfirmed: true,
      original: "oggi",
    };
  } else if (/\bdomani\b/.test(lowText)) {
    result = {
      date: startOfDay(addDays(now, 1)),
      hasTime: false,
      isConfirmed: true,
      original: "domani",
    };
  } else if (/\bdopodomani\b/.test(lowText)) {
    result = {
      date: startOfDay(addDays(now, 2)),
      hasTime: false,
      isConfirmed: true,
      original: "dopodomani",
    };
  }

  // Weekday names
  if (!result) {
    for (const [dayName, nextDayFn] of Object.entries(DAY_PATTERNS)) {
      const regex = new RegExp(`\\b${dayName}\\b`, "i");
      if (regex.test(lowText)) {
        result = {
          date: startOfDay(nextDayFn(now)),
          hasTime: false,
          isConfirmed: true,
          original: dayName,
        };
        break;
      }
    }
  }

  // Date formats: 6/1, 06/01, 6-1, 06-01-2024
  if (!result) {
    const dateMatch = lowText.match(
      /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/
    );
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear();
      if (year < 100) year += 2000;

      const parsedDate = new Date(year, month, day);
      if (isValid(parsedDate)) {
        result = {
          date: startOfDay(parsedDate),
          hasTime: false,
          isConfirmed: true,
          original: dateMatch[0],
        };
      }
    }
  }

  // Italian date: 6 gennaio, 15 marzo 2024
  if (!result) {
    const italianDateMatch = lowText.match(
      /\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)(?:\s+(\d{4}))?\b/i
    );
    if (italianDateMatch) {
      const day = parseInt(italianDateMatch[1], 10);
      const month = MONTH_MAP[italianDateMatch[2].toLowerCase()];
      const year = italianDateMatch[3]
        ? parseInt(italianDateMatch[3], 10)
        : now.getFullYear();

      const parsedDate = new Date(year, month, day);
      if (isValid(parsedDate)) {
        result = {
          date: startOfDay(parsedDate),
          hasTime: false,
          isConfirmed: true,
          original: italianDateMatch[0],
        };
      }
    }
  }

  // Parse time if we have a date
  if (result) {
    const timeResult = parseTime(text);
    if (timeResult) {
      result.date = setHours(result.date, timeResult.hours);
      result.date = setMinutes(result.date, timeResult.minutes);
      result.hasTime = true;
    }
    result.date = toUTC(result.date);
  }

  return result;
}

interface ParsedTime {
  hours: number;
  minutes: number;
  original: string;
}

export function parseTime(text: string): ParsedTime | null {
  const lowText = text.toLowerCase();

  // Time formats: 15:30, 15.30, alle 15, ore 8, h 14
  const timePatterns = [
    /\b(?:alle|ore|h\.?)\s*(\d{1,2})(?:[:.](\d{2}))?\b/i,
    /\b(\d{1,2})[:.](\d{2})\b/,
    /\b(?:alle|ore)\s*(\d{1,2})\b/i,
  ];

  for (const pattern of timePatterns) {
    const match = lowText.match(pattern);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return {
          hours,
          minutes,
          original: match[0],
        };
      }
    }
  }

  return null;
}

export function extractAllDates(text: string): ParsedDateTime[] {
  const results: ParsedDateTime[] = [];

  // Split by common separators and try to parse each segment
  const segments = text.split(/[,.\n;]/);

  for (const segment of segments) {
    const parsed = parseItalianDate(segment);
    if (parsed && !results.some((r) => r.date.getTime() === parsed.date.getTime())) {
      results.push(parsed);
    }
  }

  // Also try the full text
  const fullParsed = parseItalianDate(text);
  if (fullParsed && !results.some((r) => r.date.getTime() === fullParsed.date.getTime())) {
    results.push(fullParsed);
  }

  return results;
}

export function formatDateIT(date: Date): string {
  return format(toZonedTime(date, TIMEZONE), "d MMMM yyyy", { locale: it });
}

export function formatDateTimeIT(date: Date): string {
  return format(toZonedTime(date, TIMEZONE), "d MMMM yyyy 'alle' HH:mm", {
    locale: it,
  });
}

export function formatTimeIT(date: Date): string {
  return format(toZonedTime(date, TIMEZONE), "HH:mm", { locale: it });
}

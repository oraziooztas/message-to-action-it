import { CalendarEvent } from "@/lib/types";
import { parseItalianDate, extractAllDates, formatDateIT } from "./date-parser";
import { isAppointmentRelated } from "./intent-detector";
import { addMinutes } from "date-fns";

interface EventExtractorInput {
  text: string;
  personName?: string;
  eventDurationCallMin: number;
  eventDurationMeetMin: number;
}

// Location extraction patterns
const LOCATION_PATTERNS = [
  /\b(?:a|in|da|presso)\s+([A-Z][a-zA-Zàèéìòù\s]+?)(?:\s*[,.]|\s+alle|\s+il|\s+domani|$)/g,
  /\b(?:indirizzo|via|piazza|corso)\s+[A-Z][a-zA-Zàèéìòù\s\d,]+/gi,
];

// Online meeting indicators
const ONLINE_PATTERNS = [
  /\b(zoom|teams|meet|skype|videocall|videochiamata|online|call)\b/i,
];

function extractLocation(text: string): string | null {
  // Check for online meeting first
  for (const pattern of ONLINE_PATTERNS) {
    if (pattern.test(text)) {
      // Try to extract specific platform
      const platformMatch = text.match(/\b(zoom|teams|meet|skype)\b/i);
      if (platformMatch) {
        return `Online (${platformMatch[1]})`;
      }
      return "Online";
    }
  }

  // Try to extract physical location
  for (const pattern of LOCATION_PATTERNS) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      const location = match[1].trim();
      // Filter out common false positives
      if (
        location.length > 2 &&
        !/^(me|te|lui|lei|noi|voi|loro|casa|ufficio)$/i.test(location)
      ) {
        return location;
      }
    }
  }

  return null;
}

function isCallEvent(text: string): boolean {
  return /\b(call|chiamata|telefonata|videochiamata|videocall)\b/i.test(text);
}

function generateEventTitle(text: string, personName?: string): string {
  const isCall = isCallEvent(text);

  // Check for specific event types
  if (/\b(pranzo)\b/i.test(text)) {
    return personName ? `Pranzo con ${personName}` : "Pranzo";
  }
  if (/\b(cena)\b/i.test(text)) {
    return personName ? `Cena con ${personName}` : "Cena";
  }
  if (/\b(aperitivo)\b/i.test(text)) {
    return personName ? `Aperitivo con ${personName}` : "Aperitivo";
  }
  if (/\b(caffè|colazione)\b/i.test(text)) {
    return personName ? `Caffè con ${personName}` : "Caffè";
  }
  if (/\b(riunione|meeting)\b/i.test(text)) {
    return personName ? `Riunione con ${personName}` : "Riunione";
  }
  if (/\b(visita)\b/i.test(text)) {
    return personName ? `Visita - ${personName}` : "Visita";
  }
  if (isCall) {
    return personName ? `Call con ${personName}` : "Chiamata";
  }

  // Generic appointment
  return personName ? `Appuntamento con ${personName}` : "Appuntamento";
}

function generateEventNotes(text: string): string {
  // Truncate to first 200 chars as summary
  const summary = text.length > 200 ? text.slice(0, 200) + "..." : text;
  return `Estratto da messaggio:\n"${summary}"`;
}

export function extractCalendarEvent(
  input: EventExtractorInput
): CalendarEvent | null {
  const { text, personName, eventDurationCallMin, eventDurationMeetMin } = input;

  // First check if this is appointment-related
  if (!isAppointmentRelated(text)) {
    // Also check for explicit date/time mentions with meeting context
    const hasDateTime = parseItalianDate(text);
    const hasMeetingContext =
      /\b(vediamoci|incontriamoci|ci\s+vediamo|passare\s+da|venire\s+da)\b/i.test(
        text
      );

    if (!hasDateTime || !hasMeetingContext) {
      return null;
    }
  }

  // Try to extract dates
  const dates = extractAllDates(text);

  if (dates.length === 0) {
    return null;
  }

  const primaryDate = dates[0];
  const isCall = isCallEvent(text);
  const duration = isCall ? eventDurationCallMin : eventDurationMeetMin;

  // Calculate end time
  const startDate = primaryDate.date;
  const endDate = addMinutes(startDate, duration);

  return {
    title: generateEventTitle(text, personName),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    location: extractLocation(text),
    notes: generateEventNotes(text),
    isConfirmed: primaryDate.isConfirmed && primaryDate.hasTime,
  };
}

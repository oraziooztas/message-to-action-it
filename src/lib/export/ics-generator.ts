import { CalendarEvent, Task } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

/**
 * Generates an ICS (iCalendar) file content from a CalendarEvent
 */
export function generateICS(event: CalendarEvent): string {
  const uid = uuidv4();
  const now = new Date();
  const dtstamp = formatICSDate(now);
  const dtstart = formatICSDate(new Date(event.startDate));
  const dtend = formatICSDate(new Date(event.endDate));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Messaggio Azione//IT//1.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }

  if (event.notes) {
    lines.push(`DESCRIPTION:${escapeICS(event.notes)}`);
  }

  if (!event.isConfirmed) {
    lines.push("STATUS:TENTATIVE");
  } else {
    lines.push("STATUS:CONFIRMED");
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Generates an ICS file for a task with a due date
 */
export function generateTaskICS(task: Task): string | null {
  if (!task.dueDate) {
    return null;
  }

  const uid = uuidv4();
  const now = new Date();
  const dtstamp = formatICSDate(now);
  const dueDate = new Date(task.dueDate);

  // For tasks, we create an all-day event on the due date
  const dtstart = formatICSDateOnly(dueDate);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Messaggio Azione//IT//1.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `SUMMARY:${escapeICS("📋 " + task.title)}`,
  ];

  const description = [
    task.description,
    "",
    `Priorità: ${task.priority}`,
    task.dueDateReason ? `Scadenza: ${task.dueDateReason}` : "",
    task.tags.length > 0 ? `Tag: ${task.tags.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  lines.push(`DESCRIPTION:${escapeICS(description)}`);

  // Set priority in iCal format (1-9, 1 being highest)
  const priorityMap = { Alta: 1, Media: 5, Bassa: 9 };
  lines.push(`PRIORITY:${priorityMap[task.priority]}`);

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Generate multiple ICS files for all tasks with due dates
 */
export function generateAllTasksICS(tasks: Task[]): { filename: string; content: string }[] {
  return tasks
    .filter((task) => task.dueDate)
    .map((task) => ({
      filename: `task-${slugify(task.title)}.ics`,
      content: generateTaskICS(task)!,
    }));
}

// Helper functions

function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

function formatICSDateOnly(date: Date): string {
  return format(date, "yyyyMMdd");
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâã]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõ]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

/**
 * Download helper for browser
 */
export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

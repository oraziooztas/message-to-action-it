import { Task } from "@/lib/types";
import { format } from "date-fns";
import { it } from "date-fns/locale";

/**
 * Generates a CSV string from tasks
 * Format: title, priority, dueDate, tags, notes
 */
export function generateTasksCSV(tasks: Task[]): string {
  const headers = ["Titolo", "Priorità", "Scadenza", "Tag", "Note"];
  const rows: string[][] = [];

  for (const task of tasks) {
    const dueDate = task.dueDate
      ? format(new Date(task.dueDate), "dd/MM/yyyy", { locale: it })
      : "";

    rows.push([
      escapeCSV(task.title),
      task.priority,
      dueDate,
      task.tags.join("; "),
      escapeCSV(task.description + (task.dueDateReason ? ` (${task.dueDateReason})` : "")),
    ]);
  }

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ];

  return csvLines.join("\n");
}

function escapeCSV(text: string): string {
  // If the field contains commas, quotes, or newlines, wrap in quotes
  if (/[,"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Download helper for browser
 */
export function downloadCSV(content: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

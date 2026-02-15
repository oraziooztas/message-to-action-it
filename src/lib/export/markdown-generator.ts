import { Task, Replies, CalendarEvent, NextStep, AnalysisResult } from "@/lib/types";
import { format } from "date-fns";
import { it } from "date-fns/locale";

/**
 * Generates a complete Markdown document from analysis results
 */
export function generateAnalysisMarkdown(
  result: AnalysisResult,
  rawText: string,
  personName?: string
): string {
  const sections: string[] = [];
  const dateStr = format(new Date(), "d MMMM yyyy 'alle' HH:mm", { locale: it });

  // Header
  sections.push(`# Analisi Messaggio`);
  sections.push(`*Generato il ${dateStr}*`);
  if (personName) {
    sections.push(`**Da:** ${personName}`);
  }
  sections.push("");

  // Original message
  sections.push("## Messaggio Originale");
  sections.push("```");
  sections.push(rawText);
  sections.push("```");
  sections.push("");

  // Tasks
  sections.push("## Task");
  if (result.tasks.length > 0) {
    sections.push(generateTasksMarkdown(result.tasks));
  } else {
    sections.push("*Nessun task rilevato*");
  }
  sections.push("");

  // Replies
  sections.push("## Risposte Pronte");
  sections.push(generateRepliesMarkdown(result.replies));
  sections.push("");

  // Event
  if (result.event) {
    sections.push("## Evento Calendario");
    sections.push(generateEventMarkdown(result.event));
    sections.push("");
  }

  // Next Step
  sections.push("## Prossimo Passo");
  sections.push(generateNextStepMarkdown(result.nextStep));

  return sections.join("\n");
}

/**
 * Generates Markdown for tasks only
 */
export function generateTasksMarkdown(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "*Nessun task*";
  }

  const lines: string[] = [];

  for (const task of tasks) {
    const priorityEmoji = {
      Alta: "🔴",
      Media: "🟡",
      Bassa: "🟢",
    }[task.priority];

    lines.push(`### ${priorityEmoji} ${task.title}`);
    lines.push("");
    lines.push(`- **Priorità:** ${task.priority}`);

    if (task.dueDate) {
      const dateStr = format(new Date(task.dueDate), "d MMMM yyyy", {
        locale: it,
      });
      lines.push(`- **Scadenza:** ${dateStr}`);
      if (task.dueDateReason) {
        lines.push(`  - *${task.dueDateReason}*`);
      }
    }

    if (task.tags.length > 0) {
      lines.push(`- **Tag:** ${task.tags.map((t) => `\`${t}\``).join(", ")}`);
    }

    if (task.description) {
      lines.push(`- **Note:** ${task.description}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generates Markdown for replies
 */
export function generateRepliesMarkdown(replies: Replies): string {
  const lines: string[] = [];

  lines.push("### 📝 Formale");
  lines.push("```");
  lines.push(replies.formale);
  lines.push("```");
  lines.push("");

  lines.push("### 💬 Cordiale");
  lines.push("```");
  lines.push(replies.cordiale);
  lines.push("```");
  lines.push("");

  lines.push("### ⚡ Sintetica");
  lines.push("```");
  lines.push(replies.sintetica);
  lines.push("```");

  return lines.join("\n");
}

/**
 * Generates Markdown for calendar event
 */
export function generateEventMarkdown(event: CalendarEvent): string {
  const lines: string[] = [];

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const dateStr = format(startDate, "EEEE d MMMM yyyy", { locale: it });
  const startTime = format(startDate, "HH:mm", { locale: it });
  const endTime = format(endDate, "HH:mm", { locale: it });

  lines.push(`**${event.title}**`);
  lines.push("");
  lines.push(`- 📅 **Data:** ${dateStr}`);
  lines.push(`- ⏰ **Orario:** ${startTime} - ${endTime}`);

  if (event.location) {
    lines.push(`- 📍 **Luogo:** ${event.location}`);
  }

  if (!event.isConfirmed) {
    lines.push("");
    lines.push("⚠️ *Data/orario da confermare*");
  }

  if (event.notes) {
    lines.push("");
    lines.push("**Note:**");
    lines.push(event.notes);
  }

  return lines.join("\n");
}

/**
 * Generates Markdown for next step
 */
export function generateNextStepMarkdown(nextStep: NextStep): string {
  const lines: string[] = [];

  lines.push(`**🎯 ${nextStep.action}**`);
  lines.push("");

  if (nextStep.checklist.length > 0) {
    lines.push("Checklist:");
    for (const item of nextStep.checklist) {
      lines.push(`- [ ] ${item}`);
    }
  }

  return lines.join("\n");
}

/**
 * Download helper for browser
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

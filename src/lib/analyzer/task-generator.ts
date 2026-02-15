import { v4 as uuidv4 } from "uuid";
import {
  Task,
  Priority,
  TaskTag,
  ContextType,
  SourceType,
} from "@/lib/types";
import { parseItalianDate, formatDateIT } from "./date-parser";
import {
  detectIntents,
  hasUrgency,
  isAppointmentRelated,
  isPaymentRelated,
  IntentType,
} from "./intent-detector";
import { addDays, format } from "date-fns";

interface TaskGeneratorInput {
  text: string;
  contextType: ContextType;
  sourceType: SourceType;
  personName?: string;
  role?: string;
}

// Keywords to detect specific task types
const TASK_KEYWORDS = {
  call: /\b(chiama|chiamata|telefonata|call|chiamare|telefono)\b/i,
  email: /\b(email|e-mail|mail|scrivi|invia|messaggio)\b/i,
  documenti: /\b(documento|documenti|file|allegato|pdf|contratto|modulo|certificato)\b/i,
  università: /\b(esame|lezione|tesi|prof|professore|corso|studente|università|facoltà|appello)\b/i,
  appuntamento: /\b(appuntamento|incontro|visita|meeting|riunione)\b/i,
  pagamento: /\b(pagamento|pagare|bonifico|fattura|quota|rata|importo)\b/i,
  risposta: /\b(rispondi|risposta|conferma|confermare|fammi sapere)\b/i,
};

function detectTags(text: string): TaskTag[] {
  const tags: TaskTag[] = [];

  for (const [tag, pattern] of Object.entries(TASK_KEYWORDS)) {
    if (pattern.test(text)) {
      tags.push(tag as TaskTag);
    }
  }

  if (tags.length === 0) {
    tags.push("altro");
  }

  return tags;
}

function determinePriority(text: string, intents: ReturnType<typeof detectIntents>): Priority {
  // Check for urgency
  if (hasUrgency(text)) {
    return "Alta";
  }

  // Check primary intent confidence
  const primaryIntent = intents[0];
  if (primaryIntent) {
    if (primaryIntent.type === "pagamento" && primaryIntent.confidence > 0.7) {
      return "Alta";
    }
    if (primaryIntent.type === "richiesta" && primaryIntent.confidence > 0.8) {
      return "Media";
    }
  }

  // Check for deadline keywords
  if (/\b(entro|scadenza|deadline)\b/i.test(text)) {
    return "Alta";
  }

  return "Media";
}

function suggestDueDate(text: string, priority: Priority): { date: string | null; reason: string | null } {
  // Try to extract date from text
  const parsedDate = parseItalianDate(text);

  if (parsedDate) {
    return {
      date: parsedDate.date.toISOString(),
      reason: parsedDate.isConfirmed
        ? `Data menzionata nel messaggio (${parsedDate.original})`
        : "Data rilevata ma da confermare",
    };
  }

  // Suggest based on priority
  const today = new Date();

  if (priority === "Alta") {
    return {
      date: addDays(today, 1).toISOString(),
      reason: "Urgente - suggerito entro domani",
    };
  }

  if (/\b(presto|quando puoi|appena)\b/i.test(text)) {
    return {
      date: addDays(today, 3).toISOString(),
      reason: "Richiesta sollecita",
    };
  }

  return {
    date: addDays(today, 7).toISOString(),
    reason: "Scadenza standard suggerita",
  };
}

function extractTaskTitles(text: string, intents: ReturnType<typeof detectIntents>): string[] {
  const titles: string[] = [];

  // Look for explicit requests
  const requestPatterns = [
    /(?:puoi|potresti|mi\s+puoi)\s+(.+?)(?:\?|$|\.)/gi,
    /(?:mi\s+mandi|mi\s+invii)\s+(.+?)(?:\?|$|\.)/gi,
    /(?:serve|servirebbe)\s+(.+?)(?:\?|$|\.)/gi,
    /(?:ho\s+bisogno\s+di)\s+(.+?)(?:\?|$|\.)/gi,
    /(?:fammi|fai)\s+(.+?)(?:\?|$|\.)/gi,
  ];

  for (const pattern of requestPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const extracted = match[1].trim();
      if (extracted.length > 3 && extracted.length < 100) {
        titles.push(extracted);
      }
    }
  }

  // Generate titles from intents if no explicit requests found
  if (titles.length === 0) {
    for (const intent of intents) {
      switch (intent.type) {
        case "richiesta":
          titles.push("Rispondere alla richiesta");
          break;
        case "appuntamento":
          titles.push("Organizzare appuntamento");
          break;
        case "pagamento":
          titles.push("Gestire pagamento");
          break;
        case "conferma":
          titles.push("Confermare ricezione");
          break;
        case "domanda":
          titles.push("Rispondere alla domanda");
          break;
        case "informazione":
          titles.push("Prendere nota dell'informazione");
          break;
      }
    }
  }

  // Always add a follow-up task if there's a response needed
  const hasQuestion = /\?/.test(text);
  const needsResponse = /\b(fammi sapere|rispondimi|aspetto|conferma)\b/i.test(text);

  if (hasQuestion || needsResponse) {
    const followUpExists = titles.some(t =>
      t.toLowerCase().includes("rispond") || t.toLowerCase().includes("conferma")
    );
    if (!followUpExists) {
      titles.push("Inviare risposta");
    }
  }

  return [...new Set(titles)]; // Remove duplicates
}

export function generateTasks(input: TaskGeneratorInput): Task[] {
  const { text, contextType, sourceType, personName, role } = input;
  const intents = detectIntents(text);
  const tasks: Task[] = [];

  // Extract task titles
  const titles = extractTaskTitles(text, intents);

  // Generate tasks for each title
  for (const title of titles) {
    const priority = determinePriority(text, intents);
    const { date, reason } = suggestDueDate(text, priority);
    const tags = detectTags(text + " " + title);

    // Create description based on context
    let description = "";
    if (personName) {
      description = `Per ${personName}`;
      if (role) {
        description += ` (${role})`;
      }
      description += ". ";
    }
    description += generateTaskDescription(title, contextType, sourceType);

    tasks.push({
      id: uuidv4(),
      title: capitalizeFirst(title),
      description: description.trim(),
      priority,
      dueDate: date,
      dueDateReason: reason,
      tags,
    });
  }

  // If no tasks generated, create a generic one
  if (tasks.length === 0) {
    const priority = determinePriority(text, intents);
    const { date, reason } = suggestDueDate(text, priority);

    tasks.push({
      id: uuidv4(),
      title: "Valutare e rispondere al messaggio",
      description: personName
        ? `Messaggio da ${personName}${role ? ` (${role})` : ""} da valutare`
        : "Messaggio da valutare",
      priority,
      dueDate: date,
      dueDateReason: reason,
      tags: ["risposta"],
    });
  }

  return tasks;
}

function generateTaskDescription(
  title: string,
  contextType: ContextType,
  sourceType: SourceType
): string {
  const contexts: Record<ContextType, string> = {
    famiglia: "Ambito familiare",
    università: "Ambito universitario",
    lavoro: "Ambito lavorativo",
    palestra: "Abbonamento/palestra",
    vendite: "Ambito commerciale",
    altro: "",
  };

  const sources: Record<SourceType, string> = {
    WhatsApp: "via WhatsApp",
    Email: "via email",
    Altro: "",
  };

  const parts = [];
  if (contexts[contextType]) {
    parts.push(contexts[contextType]);
  }
  if (sources[sourceType]) {
    parts.push(sources[sourceType]);
  }

  return parts.join(" - ");
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

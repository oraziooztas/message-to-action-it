import { Replies, ContextType, SourceType } from "@/lib/types";
import { detectIntents, IntentType } from "./intent-detector";
import { parseItalianDate } from "./date-parser";

interface ReplyGeneratorInput {
  text: string;
  contextType: ContextType;
  sourceType: SourceType;
  personName?: string;
  role?: string;
}

// Greetings based on context
const GREETINGS: Record<ContextType, { formale: string; cordiale: string; sintetica: string }> = {
  famiglia: {
    formale: "Ciao",
    cordiale: "Ciao",
    sintetica: "",
  },
  università: {
    formale: "Gentile Professore/Professoressa",
    cordiale: "Buongiorno",
    sintetica: "Buongiorno",
  },
  lavoro: {
    formale: "Gentile",
    cordiale: "Buongiorno",
    sintetica: "Buongiorno",
  },
  palestra: {
    formale: "Gentili",
    cordiale: "Ciao",
    sintetica: "Ciao",
  },
  vendite: {
    formale: "Gentile Cliente",
    cordiale: "Buongiorno",
    sintetica: "Buongiorno",
  },
  altro: {
    formale: "Buongiorno",
    cordiale: "Ciao",
    sintetica: "",
  },
};

// Closings based on context
const CLOSINGS: Record<ContextType, { formale: string; cordiale: string; sintetica: string }> = {
  famiglia: {
    formale: "Un abbraccio",
    cordiale: "Un bacio",
    sintetica: "",
  },
  università: {
    formale: "Cordiali saluti",
    cordiale: "Grazie e buona giornata",
    sintetica: "Grazie",
  },
  lavoro: {
    formale: "Distinti saluti",
    cordiale: "Cordiali saluti",
    sintetica: "Grazie",
  },
  palestra: {
    formale: "Cordiali saluti",
    cordiale: "Grazie",
    sintetica: "Grazie",
  },
  vendite: {
    formale: "Resto a disposizione per qualsiasi chiarimento.\nCordiali saluti",
    cordiale: "Grazie per la fiducia",
    sintetica: "Grazie",
  },
  altro: {
    formale: "Cordiali saluti",
    cordiale: "Grazie",
    sintetica: "",
  },
};

// Extract what's being asked/needed
function extractRequestedInfo(text: string): string[] {
  const requested: string[] = [];

  // Look for questions
  const questions = text.match(/[^.!?]*\?/g) || [];
  for (const q of questions) {
    // Extract the core question
    const cleaned = q.trim().replace(/^\s*(puoi|potresti|mi|ti)\s+/gi, "");
    if (cleaned.length > 5) {
      requested.push(cleaned);
    }
  }

  // Look for explicit requests
  const requestPatterns = [
    /(?:mi\s+(?:mandi|invii|dai|passi))\s+(.+?)(?:\?|$|\.)/gi,
    /(?:serve|servirebbe)\s+(.+?)(?:\?|$|\.)/gi,
    /(?:ho\s+bisogno\s+di)\s+(.+?)(?:\?|$|\.)/gi,
  ];

  for (const pattern of requestPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      requested.push(match[1].trim());
    }
  }

  return [...new Set(requested)];
}

// Check if there are missing info to ask about
function findMissingInfo(text: string): string[] {
  const missing: string[] = [];

  // Check for incomplete date references
  const hasDateRef = /\b(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica|domani|dopodomani)\b/i.test(text);
  const hasTime = /\b(\d{1,2}[:.]?\d{0,2}|alle\s+\d+|ore\s+\d+)\b/i.test(text);
  const hasAppointment = /\b(appuntamento|incontro|vediamoci|ci\s+vediamo)\b/i.test(text);

  if (hasAppointment && !hasDateRef) {
    missing.push("data dell'incontro");
  }
  if (hasAppointment && hasDateRef && !hasTime) {
    missing.push("orario preciso");
  }

  // Check for location mentions without specifics
  const hasLocationRef = /\b(dove|luogo|posto)\b/i.test(text);
  const hasSpecificLocation = /\b(in|a|da|presso)\s+[A-Z][a-zA-Z]+/g.test(text);
  if (hasAppointment && !hasLocationRef && !hasSpecificLocation) {
    missing.push("luogo dell'incontro");
  }

  return missing;
}

// Generate reply body based on intent
function generateReplyBody(
  text: string,
  intents: ReturnType<typeof detectIntents>,
  tone: "formale" | "cordiale" | "sintetica",
  contextType: ContextType
): string {
  const primaryIntent = intents[0];
  const requestedInfo = extractRequestedInfo(text);
  const missingInfo = findMissingInfo(text);

  const parts: string[] = [];

  // Acknowledge based on intent
  switch (primaryIntent?.type) {
    case "richiesta":
      if (tone === "formale") {
        parts.push("Ho ricevuto la Sua richiesta e provvederò a quanto necessario.");
      } else if (tone === "cordiale") {
        parts.push("Ricevuto! Mi occupo subito della tua richiesta.");
      } else {
        parts.push("Ok, provvedo.");
      }
      break;

    case "appuntamento":
      if (tone === "formale") {
        parts.push("Confermo la mia disponibilità per l'incontro proposto.");
      } else if (tone === "cordiale") {
        parts.push("Perfetto, per me va bene!");
      } else {
        parts.push("Ok, confermo.");
      }
      break;

    case "pagamento":
      if (tone === "formale") {
        parts.push("Ho preso nota delle informazioni relative al pagamento.");
      } else if (tone === "cordiale") {
        parts.push("Grazie per le informazioni, provvedo al pagamento.");
      } else {
        parts.push("Ok, provvedo.");
      }
      break;

    case "informazione":
      if (tone === "formale") {
        parts.push("La ringrazio per l'informazione.");
      } else if (tone === "cordiale") {
        parts.push("Grazie per avermi avvisato!");
      } else {
        parts.push("Ricevuto, grazie.");
      }
      break;

    case "domanda":
      if (tone === "formale") {
        parts.push("In merito alla Sua domanda:");
      } else if (tone === "cordiale") {
        parts.push("Riguardo alla tua domanda:");
      } else {
        // Sintetica: go straight to the point
      }
      break;

    case "conferma":
      if (tone === "formale") {
        parts.push("Confermo la ricezione del messaggio.");
      } else if (tone === "cordiale") {
        parts.push("Ricevuto, tutto chiaro!");
      } else {
        parts.push("Ok!");
      }
      break;

    default:
      if (tone === "formale") {
        parts.push("Ho ricevuto il Suo messaggio.");
      } else if (tone === "cordiale") {
        parts.push("Grazie per il messaggio!");
      } else {
        parts.push("Ricevuto.");
      }
  }

  // Ask for missing info if needed
  if (missingInfo.length > 0) {
    if (tone === "formale") {
      parts.push(`Avrei bisogno di alcune informazioni aggiuntive: ${missingInfo.join(", ")}.`);
    } else if (tone === "cordiale") {
      parts.push(`Mi servirebbe sapere: ${missingInfo.join(", ")}. Puoi farmi sapere?`);
    } else {
      parts.push(`Mi servono: ${missingInfo.join(", ")}.`);
    }
  }

  return parts.join("\n\n");
}

export function generateReplies(input: ReplyGeneratorInput): Replies {
  const { text, contextType, sourceType, personName, role } = input;
  const intents = detectIntents(text);

  const greetings = GREETINGS[contextType];
  const closings = CLOSINGS[contextType];

  // Personalize greeting
  const getGreeting = (base: string, includeRole: boolean = false) => {
    if (!base) return "";
    if (personName) {
      const roleStr = includeRole && role ? ` (${role})` : "";
      return `${base} ${personName}${roleStr},`;
    }
    return `${base},`;
  };

  // Generate each reply variant
  const formaleBody = generateReplyBody(text, intents, "formale", contextType);
  const cordialeBody = generateReplyBody(text, intents, "cordiale", contextType);
  const sinteticaBody = generateReplyBody(text, intents, "sintetica", contextType);

  const formale = [
    getGreeting(greetings.formale, true),
    "",
    formaleBody,
    "",
    closings.formale,
  ]
    .filter((l) => l !== undefined)
    .join("\n")
    .trim();

  const cordiale = [
    getGreeting(greetings.cordiale),
    "",
    cordialeBody,
    "",
    closings.cordiale,
  ]
    .filter((l) => l !== undefined)
    .join("\n")
    .trim();

  const sintetica = [
    greetings.sintetica ? getGreeting(greetings.sintetica) : "",
    sinteticaBody,
    closings.sintetica,
  ]
    .filter((l) => l.trim() !== "")
    .join("\n")
    .trim();

  return {
    formale,
    cordiale,
    sintetica,
  };
}

export function generateEmailSubject(text: string, contextType: ContextType): string {
  const intents = detectIntents(text);
  const primaryIntent = intents[0];

  const prefixes: Record<ContextType, string> = {
    famiglia: "",
    università: "Re: ",
    lavoro: "Re: ",
    palestra: "Re: ",
    vendite: "Re: ",
    altro: "Re: ",
  };

  const subjects: Record<IntentType, string> = {
    richiesta: "Risposta alla richiesta",
    appuntamento: "Conferma appuntamento",
    pagamento: "Conferma pagamento",
    informazione: "Ricevuto - Grazie",
    conferma: "Conferma ricezione",
    domanda: "Risposta alla domanda",
    urgenza: "URGENTE - Risposta",
    altro: "Risposta",
  };

  return prefixes[contextType] + (subjects[primaryIntent?.type || "altro"] || "Risposta");
}

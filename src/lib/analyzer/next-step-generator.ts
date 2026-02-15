import { NextStep, Task, CalendarEvent, ContextType } from "@/lib/types";
import { detectIntents, hasUrgency } from "./intent-detector";

interface NextStepInput {
  text: string;
  tasks: Task[];
  event: CalendarEvent | null;
  contextType: ContextType;
}

export function generateNextStep(input: NextStepInput): NextStep {
  const { text, tasks, event, contextType } = input;
  const intents = detectIntents(text);
  const primaryIntent = intents[0];
  const isUrgent = hasUrgency(text);

  const checklist: string[] = [];
  let action = "";

  // Determine primary action based on context and intents
  if (isUrgent) {
    action = "Rispondere immediatamente al messaggio";
    checklist.push("Leggi attentamente il messaggio");
    checklist.push("Prepara una risposta rapida");
    checklist.push("Invia entro 5 minuti");
  } else if (event && !event.isConfirmed) {
    action = "Confermare i dettagli dell'appuntamento";
    checklist.push("Verifica data e orario proposti");
    if (!event.location) {
      checklist.push("Chiedere conferma del luogo");
    }
    checklist.push("Inviare conferma o proposta alternativa");
  } else if (event && event.isConfirmed) {
    action = "Salvare l'appuntamento in calendario";
    checklist.push("Scaricare il file .ics");
    checklist.push("Importare nel calendario");
    checklist.push("Confermare partecipazione");
  } else {
    // Based on primary intent
    switch (primaryIntent?.type) {
      case "richiesta":
        if (tasks.length > 0) {
          const highPriorityTask = tasks.find((t) => t.priority === "Alta");
          if (highPriorityTask) {
            action = `Completare: "${highPriorityTask.title}"`;
            checklist.push("Valuta cosa viene richiesto");
            checklist.push("Prepara quanto necessario");
            checklist.push("Rispondi confermando l'azione");
          } else {
            action = "Rispondere confermando la presa in carico";
            checklist.push("Leggere attentamente la richiesta");
            checklist.push("Inviare risposta di conferma");
          }
        }
        break;

      case "pagamento":
        action = "Verificare e completare il pagamento";
        checklist.push("Controllare importo e scadenza");
        checklist.push("Effettuare il pagamento");
        checklist.push("Inviare conferma dell'avvenuto pagamento");
        break;

      case "domanda":
        action = "Rispondere alla domanda";
        checklist.push("Preparare la risposta");
        checklist.push("Verificare che sia completa");
        checklist.push("Inviare la risposta");
        break;

      case "informazione":
        action = "Prendere nota e confermare ricezione";
        checklist.push("Salvare le informazioni importanti");
        checklist.push("Ringraziare per l'aggiornamento");
        break;

      case "conferma":
        action = "Confermare di aver ricevuto";
        checklist.push("Inviare breve conferma");
        break;

      default:
        action = "Valutare il messaggio e rispondere";
        checklist.push("Leggere con attenzione");
        checklist.push("Identificare eventuali azioni necessarie");
        checklist.push("Rispondere in modo appropriato");
    }
  }

  // Add context-specific tips
  switch (contextType) {
    case "università":
      if (!checklist.some((c) => c.includes("formal"))) {
        checklist.push("Usare tono formale nella risposta");
      }
      break;
    case "lavoro":
      if (primaryIntent?.type === "richiesta") {
        checklist.push("Definire tempistiche se necessario");
      }
      break;
    case "palestra":
      if (primaryIntent?.type === "pagamento") {
        checklist.push("Verificare termini di disdetta/rinnovo");
      }
      break;
    case "vendite":
      if (!checklist.some((c) => c.includes("call to action"))) {
        checklist.push("Includere proposta chiara nella risposta");
      }
      break;
  }

  // Limit checklist to max 3 items
  const finalChecklist = checklist.slice(0, 3);

  // Ensure we have an action
  if (!action) {
    action = "Valutare il messaggio e decidere il prossimo passo";
  }

  return {
    action,
    checklist: finalChecklist,
  };
}

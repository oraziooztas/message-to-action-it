import { AnalysisInput, AnalysisResult, AnalysisResultSchema } from "../types";
import { AnalyzerOptions } from "./index";

const SYSTEM_PROMPT = `Sei un assistente NLP italiano specializzato nell'estrarre task, appuntamenti e azioni da messaggi testuali (WhatsApp, Email, ecc).
Il tuo obiettivo è analizzare il messaggio dell'utente e restituire un oggetto JSON strettamente aderente alla struttura richiesta, senza testo aggiuntivo.

Il messaggio ha il seguente contesto:
- Contesto (Ambito): {contextType}
- Fonte: {sourceType}
- Mittente: {personName} (Ruolo: {role})

Devi restituire un JSON con QUESTA ESATTA STRUTTURA:
{
  "tasks": [
    {
      "id": "uuid-v4-string",
      "title": "Titolo del task (es. Rispondere a Mario)",
      "description": "Descrizione estesa del task",
      "priority": "Alta" | "Media" | "Bassa",
      "dueDate": "ISO Date string (es. 2026-06-20T10:00:00.000Z) oppure null",
      "dueDateReason": "Motivo per la data suggerita oppure null",
      "tags": ["call", "email", "documenti", "università", "appuntamento", "pagamento", "risposta", "altro"]
    }
  ],
  "replies": {
    "formale": "Risposta molto formale e professionale",
    "cordiale": "Risposta gentile e amichevole",
    "sintetica": "Risposta breve e dritta al punto (max 10 parole)"
  },
  "event": null // OPPURE oggetto se è un appuntamento: { "title": "Titolo", "startDate": "ISO string", "endDate": "ISO string", "location": "Luogo o null", "notes": "Note aggiuntive", "isConfirmed": true/false }
  "nextStep": {
    "action": "La prossima macro azione da compiere (es. Salvare il documento e confermare ricezione)",
    "checklist": ["Step 1", "Step 2"]
  }
}

REGOLE CRITICHE:
- Le date di default, se non specificate, considerale rispetto alla data odierna: ${new Date().toISOString()}
- Ritorna SOLO JSON VALIDO, nessuna formattazione markdown \`\`\`json.`;

export async function callLlmFallback(
  input: AnalysisInput,
  options: AnalyzerOptions
): Promise<AnalysisResult> {
  const { llmProvider, llmApiKey } = options;

  if (!llmApiKey) {
    throw new Error("API Key mancante per il provider LLM");
  }

  const filledSystemPrompt = SYSTEM_PROMPT
    .replace("{contextType}", input.contextType)
    .replace("{sourceType}", input.sourceType)
    .replace("{personName}", input.personName || "Sconosciuto")
    .replace("{role}", input.role || "Nessuno");

  const userMessage = `Messaggio da analizzare: "${input.rawText}"`;

  let jsonResponseText = "";

  if (llmProvider === "openai" || llmProvider === "OpenAI") {
    // OpenAI Fetch API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${llmApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // o un modello configurabile se presente in options
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: filledSystemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    jsonResponseText = data.choices[0].message.content;

  } else if (llmProvider === "anthropic" || llmProvider === "Anthropic") {
    // Anthropic Fetch API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": llmApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system: filledSystemPrompt,
        messages: [
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    jsonResponseText = data.content[0].text;
    
    // Pulizia di eventuale markdown ```json ... ``` (Claude a volte lo aggiunge nonostante il prompt)
    jsonResponseText = jsonResponseText.replace(/```json\n?|\n?```/g, "").trim();

  } else {
    throw new Error(`Provider LLM non supportato o non valido: ${llmProvider}`);
  }

  // Parse JSON and Validate
  try {
    const rawResult = JSON.parse(jsonResponseText);
    
    // Provide a fallback UUID for tasks if the LLM hallucinated random formats
    if (rawResult.tasks && Array.isArray(rawResult.tasks)) {
      rawResult.tasks = rawResult.tasks.map((t: Record<string, unknown>) => ({
        ...t,
        id: t.id || crypto.randomUUID()
      }));
    }

    // Force validation via zod (strips out extra fields and checks correctness)
    const result = AnalysisResultSchema.parse(rawResult);
    return result;
  } catch (error) {
    console.error("Errore nel parsing del risultato LLM:", error, jsonResponseText);
    throw new Error("Risposta LLM malformata o non compatibile con lo schema richiesto");
  }
}

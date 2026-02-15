// Intent detection patterns for Italian messages

export type IntentType =
  | "richiesta"
  | "appuntamento"
  | "urgenza"
  | "pagamento"
  | "informazione"
  | "conferma"
  | "domanda"
  | "altro";

export interface DetectedIntent {
  type: IntentType;
  confidence: number; // 0-1
  matchedPatterns: string[];
  context: string; // The part of text that matched
}

// Pattern groups with weights
const INTENT_PATTERNS: Record<IntentType, { pattern: RegExp; weight: number }[]> = {
  richiesta: [
    { pattern: /\b(puoi|potresti|potrebbe|mi\s+puoi|mi\s+potresti)\b/i, weight: 0.9 },
    { pattern: /\b(vuoi|vorresti|vorrebbe)\b/i, weight: 0.7 },
    { pattern: /\b(mi\s+mandi|mi\s+invii|mi\s+dai|mi\s+passi)\b/i, weight: 0.95 },
    { pattern: /\b(serve|servirebbe|avrei\s+bisogno|ho\s+bisogno)\b/i, weight: 0.85 },
    { pattern: /\b(fammi|facci|fai|fate)\s+\w+/i, weight: 0.8 },
    { pattern: /\b(devi|dovresti|dovrebbe|dovremmo)\b/i, weight: 0.75 },
    { pattern: /\b(ti\s+chiedo|ti\s+chiederei|le\s+chiedo)\b/i, weight: 0.9 },
    { pattern: /\b(portami|comprami|prendimi)\b/i, weight: 0.85 },
  ],
  appuntamento: [
    { pattern: /\b(appuntamento|incontro|meeting|riunione)\b/i, weight: 0.95 },
    { pattern: /\b(vediamoci|ci\s+vediamo|incontriamoci)\b/i, weight: 0.9 },
    { pattern: /\b(passare\s+da|venire\s+da|andare\s+da)\b/i, weight: 0.7 },
    { pattern: /\b(quando\s+sei\s+libero|quando\s+possiamo)\b/i, weight: 0.85 },
    { pattern: /\b(fissiamo|organizziamo|prenotiamo)\b/i, weight: 0.8 },
    { pattern: /\b(call|chiamata|videochiamata|videocall)\b/i, weight: 0.9 },
    { pattern: /\b(pranzo|cena|aperitivo|caffè)\s*(insieme|con\s+me)?/i, weight: 0.6 },
  ],
  urgenza: [
    { pattern: /\b(urgente|urgenza|subito|immediatamente)\b/i, weight: 0.95 },
    { pattern: /\b(oggi|entro\s+oggi|stasera|stanotte)\b/i, weight: 0.8 },
    { pattern: /\b(scadenza|deadline|entro\s+il|entro\s+le)\b/i, weight: 0.85 },
    { pattern: /\b(il\s+prima\s+possibile|appena\s+puoi|asap)\b/i, weight: 0.9 },
    { pattern: /\b(non\s+c'è\s+tempo|poco\s+tempo|tempo\s+stringe)\b/i, weight: 0.85 },
    { pattern: /\b(importante|fondamentale|cruciale|essenziale)\b/i, weight: 0.6 },
  ],
  pagamento: [
    { pattern: /\b(pagamento|pagare|bonifico|fattura)\b/i, weight: 0.95 },
    { pattern: /\b(rinnovo|disdetta|abbonamento|iscrizione)\b/i, weight: 0.85 },
    { pattern: /\b(quota|rata|mensilità|canone)\b/i, weight: 0.8 },
    { pattern: /\b(scaduto|in\s+scadenza|da\s+pagare)\b/i, weight: 0.85 },
    { pattern: /\b(euro|€|\beur\b)/i, weight: 0.6 },
    { pattern: /\b(costo|prezzo|tariffa|importo)\b/i, weight: 0.5 },
  ],
  informazione: [
    { pattern: /\b(ti\s+informo|ti\s+comunico|ti\s+avviso)\b/i, weight: 0.9 },
    { pattern: /\b(volevo\s+dirti|volevo\s+farti\s+sapere)\b/i, weight: 0.85 },
    { pattern: /\b(per\s+tua\s+informazione|fyi|nota\s+bene)\b/i, weight: 0.9 },
    { pattern: /\b(aggiornamento|update|news)\b/i, weight: 0.7 },
  ],
  conferma: [
    { pattern: /\b(conferma|confermare|confermo)\b/i, weight: 0.9 },
    { pattern: /\b(va\s+bene|ok\s+per|d'accordo)\b/i, weight: 0.7 },
    { pattern: /\b(ricevuto|preso\s+nota|capito)\b/i, weight: 0.65 },
  ],
  domanda: [
    { pattern: /\?/g, weight: 0.6 },
    { pattern: /\b(come|quando|dove|perché|quanto|quale|chi)\b/i, weight: 0.5 },
    { pattern: /\b(sai|sapete|conosci|conoscete)\s+\w+\?/i, weight: 0.8 },
    { pattern: /\b(hai|avete)\s+\w+\?/i, weight: 0.7 },
  ],
  altro: [],
};

export function detectIntents(text: string): DetectedIntent[] {
  const intents: DetectedIntent[] = [];

  for (const [intentType, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intentType === "altro") continue;

    let totalWeight = 0;
    const matchedPatterns: string[] = [];
    const matchedContexts: string[] = [];

    for (const { pattern, weight } of patterns) {
      const match = text.match(pattern);
      if (match) {
        totalWeight += weight;
        matchedPatterns.push(pattern.source);
        matchedContexts.push(match[0]);
      }
    }

    if (matchedPatterns.length > 0) {
      // Normalize confidence to 0-1 range
      const confidence = Math.min(totalWeight / patterns.length, 1);

      intents.push({
        type: intentType as IntentType,
        confidence,
        matchedPatterns,
        context: matchedContexts.join(", "),
      });
    }
  }

  // Sort by confidence
  intents.sort((a, b) => b.confidence - a.confidence);

  // If no intents detected, mark as "altro"
  if (intents.length === 0) {
    intents.push({
      type: "altro",
      confidence: 0.5,
      matchedPatterns: [],
      context: text.slice(0, 50),
    });
  }

  return intents;
}

export function getPrimaryIntent(text: string): DetectedIntent {
  const intents = detectIntents(text);
  return intents[0];
}

export function hasUrgency(text: string): boolean {
  const intents = detectIntents(text);
  return intents.some((i) => i.type === "urgenza" && i.confidence > 0.5);
}

export function isAppointmentRelated(text: string): boolean {
  const intents = detectIntents(text);
  return intents.some((i) => i.type === "appuntamento" && i.confidence > 0.4);
}

export function isPaymentRelated(text: string): boolean {
  const intents = detectIntents(text);
  return intents.some((i) => i.type === "pagamento" && i.confidence > 0.5);
}

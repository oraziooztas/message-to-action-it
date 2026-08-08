import {
  AnalysisInput,
  AnalysisResult,
  Settings,
} from "@/lib/types";
import { generateTasks } from "./task-generator";
import { generateReplies } from "./reply-generator";
import { extractCalendarEvent } from "./event-extractor";
import { generateNextStep } from "./next-step-generator";
import { getPrimaryIntent } from "./intent-detector";
import { callLlmFallback } from "./llm-fallback";

export interface AnalyzerOptions {
  eventDurationCallMin: number;
  eventDurationMeetMin: number;
  llmEnabled?: boolean;
  llmProvider?: string | null;
  llmApiKey?: string | null;
}

const DEFAULT_OPTIONS: AnalyzerOptions = {
  eventDurationCallMin: 30,
  eventDurationMeetMin: 60,
};

/**
 * Main analyzer function that processes a message and generates:
 * - Tasks with priorities and due dates
 * - Three reply variants (formal, cordiale, sintetica)
 * - Calendar event if date/time detected
 * - Next step recommendation
 * 
 * Includes an LLM Semantic Fallback if the rule-based intent confidence is too low.
 */
export async function analyzeMessage(
  input: AnalysisInput,
  options: Partial<AnalyzerOptions> = {}
): Promise<AnalysisResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Rule-based intent detection
  const primaryIntent = getPrimaryIntent(input.rawText);
  
  // Semantic Fallback trigger
  const needsFallback = primaryIntent.confidence < 0.5 || primaryIntent.type === "altro";

  if (needsFallback && opts.llmEnabled && opts.llmApiKey && opts.llmProvider) {
    try {
      console.log(`[Analyzer] Rule-based confidence low (${primaryIntent.confidence}). Triggering LLM fallback via ${opts.llmProvider}...`);
      const llmResult = await callLlmFallback(input, opts);
      return llmResult;
    } catch (error) {
      console.error("[Analyzer] LLM Fallback failed, falling back to rule-based degradation:", error);
      // If LLM fails, we continue with the graceful rule-based degradation below
    }
  }

  // Generate tasks
  const tasks = generateTasks({
    text: input.rawText,
    contextType: input.contextType,
    sourceType: input.sourceType,
    personName: input.personName,
    role: input.role,
  });

  // Generate replies
  const replies = generateReplies({
    text: input.rawText,
    contextType: input.contextType,
    sourceType: input.sourceType,
    personName: input.personName,
    role: input.role,
  });

  // Extract calendar event
  const event = extractCalendarEvent({
    text: input.rawText,
    personName: input.personName,
    eventDurationCallMin: opts.eventDurationCallMin,
    eventDurationMeetMin: opts.eventDurationMeetMin,
  });

  // Generate next step
  const nextStep = generateNextStep({
    text: input.rawText,
    tasks,
    event,
    contextType: input.contextType,
  });

  return {
    tasks,
    replies,
    event,
    nextStep,
  };
}

// Re-export submodules for direct access if needed
export * from "./date-parser";
export * from "./intent-detector";
export * from "./task-generator";
export * from "./reply-generator";
export * from "./event-extractor";
export * from "./next-step-generator";
export * from "./llm-fallback";

import { z } from "zod";

// Enums
export const SourceTypes = ["WhatsApp", "Email", "Altro"] as const;
export type SourceType = (typeof SourceTypes)[number];

export const ContextTypes = [
  "famiglia",
  "università",
  "lavoro",
  "palestra",
  "vendite",
  "altro",
] as const;
export type ContextType = (typeof ContextTypes)[number];

export const Priorities = ["Alta", "Media", "Bassa"] as const;
export type Priority = (typeof Priorities)[number];

export const TaskTags = [
  "call",
  "email",
  "documenti",
  "università",
  "appuntamento",
  "pagamento",
  "risposta",
  "altro",
] as const;
export type TaskTag = (typeof TaskTags)[number];

// Task
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(Priorities),
  dueDate: z.string().nullable(),
  dueDateReason: z.string().nullable(),
  tags: z.array(z.enum(TaskTags)),
});

export type Task = z.infer<typeof TaskSchema>;

// Replies
export const RepliesSchema = z.object({
  formale: z.string(),
  cordiale: z.string(),
  sintetica: z.string(),
});

export type Replies = z.infer<typeof RepliesSchema>;

// Calendar Event
export const CalendarEventSchema = z.object({
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().nullable(),
  notes: z.string(),
  isConfirmed: z.boolean(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

// Next Step
export const NextStepSchema = z.object({
  action: z.string(),
  checklist: z.array(z.string()),
});

export type NextStep = z.infer<typeof NextStepSchema>;

// Analysis Input
export const AnalysisInputSchema = z.object({
  rawText: z.string().min(1, "Il messaggio non può essere vuoto"),
  sourceType: z.enum(SourceTypes),
  contextType: z.enum(ContextTypes),
  personName: z.string().optional(),
  role: z.string().optional(),
});

export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;

// Full Analysis Result
export const AnalysisResultSchema = z.object({
  tasks: z.array(TaskSchema),
  replies: RepliesSchema,
  event: CalendarEventSchema.nullable(),
  nextStep: NextStepSchema,
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// Full Analysis with metadata
export interface AnalysisWithMeta {
  id: string;
  createdAt: Date;
  input: AnalysisInput;
  result: AnalysisResult;
}

// Settings
export const SettingsSchema = z.object({
  timezone: z.string().default("Europe/Rome"),
  defaultContext: z.enum(ContextTypes).default("altro"),
  defaultTone: z.enum(["formale", "cordiale", "sintetica"]).default("cordiale"),
  pinHash: z.string().nullable().optional(),
  eventDurationCallMin: z.number().default(30),
  eventDurationMeetMin: z.number().default(60),
  llmEnabled: z.boolean().default(false),
  llmProvider: z.string().nullable().optional(),
  llmApiKey: z.string().nullable().optional(),
  notionEnabled: z.boolean().default(false),
  notionToken: z.string().nullable().optional(),
  notionDatabaseId: z.string().nullable().optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

// Context labels (Italian)
export const ContextLabels: Record<ContextType, string> = {
  famiglia: "Famiglia",
  università: "Università",
  lavoro: "Lavoro",
  palestra: "Palestra",
  vendite: "Vendite",
  altro: "Altro",
};

export const SourceLabels: Record<SourceType, string> = {
  WhatsApp: "WhatsApp",
  Email: "Email",
  Altro: "Altro",
};

export const PriorityLabels: Record<Priority, string> = {
  Alta: "Alta",
  Media: "Media",
  Bassa: "Bassa",
};

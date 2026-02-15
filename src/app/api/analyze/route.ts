import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeMessage } from "@/lib/analyzer";
import { AnalysisInputSchema } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = AnalysisInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Dati non validi",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Get settings for event duration
    let settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 1 },
      });
    }

    // Analyze the message
    const result = analyzeMessage(input, {
      eventDurationCallMin: settings.eventDurationCallMin,
      eventDurationMeetMin: settings.eventDurationMeetMin,
    });

    // Save to database
    const analysis = await prisma.analysis.create({
      data: {
        sourceType: input.sourceType,
        contextType: input.contextType,
        personName: input.personName || null,
        role: input.role || null,
        rawText: input.rawText,
        tasksJson: JSON.stringify(result.tasks),
        repliesJson: JSON.stringify(result.replies),
        eventJson: result.event ? JSON.stringify(result.event) : null,
        nextStepJson: JSON.stringify(result.nextStep),
      },
    });

    return NextResponse.json({
      id: analysis.id,
      createdAt: analysis.createdAt,
      input: {
        sourceType: analysis.sourceType,
        contextType: analysis.contextType,
        personName: analysis.personName,
        role: analysis.role,
        rawText: analysis.rawText,
      },
      result,
    });
  } catch (error) {
    console.error("Errore durante l'analisi:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

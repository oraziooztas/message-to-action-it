import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeMessage } from "@/lib/analyzer";
import { ContextType, SourceType } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single analysis
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const analysis = await prisma.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analisi non trovata" },
        { status: 404 }
      );
    }

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
      result: {
        tasks: JSON.parse(analysis.tasksJson),
        replies: JSON.parse(analysis.repliesJson),
        event: analysis.eventJson ? JSON.parse(analysis.eventJson) : null,
        nextStep: JSON.parse(analysis.nextStepJson),
      },
    });
  } catch (error) {
    console.error("Errore nel recupero dell'analisi:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

// PATCH - regenerate with new context/tone
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const analysis = await prisma.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analisi non trovata" },
        { status: 404 }
      );
    }

    // Get settings
    let settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 1 },
      });
    }

    // Regenerate with new context if provided
    const contextType = (body.contextType || analysis.contextType) as ContextType;
    const sourceType = (body.sourceType || analysis.sourceType) as SourceType;

    const newResult = analyzeMessage(
      {
        rawText: analysis.rawText,
        sourceType,
        contextType,
        personName: body.personName ?? analysis.personName ?? undefined,
        role: body.role ?? analysis.role ?? undefined,
      },
      {
        eventDurationCallMin: settings.eventDurationCallMin,
        eventDurationMeetMin: settings.eventDurationMeetMin,
      }
    );

    // Determine what to update based on regenerateOnly flag
    const regenerateOnly = body.regenerateOnly as string | undefined;
    let updateData: Record<string, string | null> = {};

    if (regenerateOnly === "tasks") {
      updateData.tasksJson = JSON.stringify(newResult.tasks);
      updateData.nextStepJson = JSON.stringify(newResult.nextStep);
    } else if (regenerateOnly === "replies") {
      updateData.repliesJson = JSON.stringify(newResult.replies);
    } else {
      // Regenerate everything
      updateData = {
        contextType,
        sourceType,
        personName: body.personName ?? analysis.personName,
        role: body.role ?? analysis.role,
        tasksJson: JSON.stringify(newResult.tasks),
        repliesJson: JSON.stringify(newResult.replies),
        eventJson: newResult.event ? JSON.stringify(newResult.event) : null,
        nextStepJson: JSON.stringify(newResult.nextStep),
      };
    }

    const updated = await prisma.analysis.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      createdAt: updated.createdAt,
      input: {
        sourceType: updated.sourceType,
        contextType: updated.contextType,
        personName: updated.personName,
        role: updated.role,
        rawText: updated.rawText,
      },
      result: {
        tasks: JSON.parse(updated.tasksJson),
        replies: JSON.parse(updated.repliesJson),
        event: updated.eventJson ? JSON.parse(updated.eventJson) : null,
        nextStep: JSON.parse(updated.nextStepJson),
      },
    });
  } catch (error) {
    console.error("Errore nell'aggiornamento dell'analisi:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

// DELETE analysis
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.analysis.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nell'eliminazione dell'analisi:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

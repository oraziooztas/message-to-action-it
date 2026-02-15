import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - duplicate an analysis
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const original = await prisma.analysis.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Analisi non trovata" },
        { status: 404 }
      );
    }

    // Create a copy
    const duplicate = await prisma.analysis.create({
      data: {
        sourceType: original.sourceType,
        contextType: original.contextType,
        personName: original.personName,
        role: original.role,
        rawText: original.rawText,
        tasksJson: original.tasksJson,
        repliesJson: original.repliesJson,
        eventJson: original.eventJson,
        nextStepJson: original.nextStepJson,
      },
    });

    return NextResponse.json({
      id: duplicate.id,
      createdAt: duplicate.createdAt,
      input: {
        sourceType: duplicate.sourceType,
        contextType: duplicate.contextType,
        personName: duplicate.personName,
        role: duplicate.role,
        rawText: duplicate.rawText,
      },
      result: {
        tasks: JSON.parse(duplicate.tasksJson),
        replies: JSON.parse(duplicate.repliesJson),
        event: duplicate.eventJson ? JSON.parse(duplicate.eventJson) : null,
        nextStep: JSON.parse(duplicate.nextStepJson),
      },
    });
  } catch (error) {
    console.error("Errore nella duplicazione dell'analisi:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

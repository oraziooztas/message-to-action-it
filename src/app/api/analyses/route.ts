import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContextType, SourceType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contextType = searchParams.get("contextType") as ContextType | null;
    const sourceType = searchParams.get("sourceType") as SourceType | null;
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (contextType) {
      where.contextType = contextType;
    }

    if (sourceType) {
      where.sourceType = sourceType;
    }

    if (search) {
      where.OR = [
        { rawText: { contains: search } },
        { personName: { contains: search } },
      ];
    }

    // Fetch analyses
    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.analysis.count({ where }),
    ]);

    // Transform to include parsed JSON
    const transformed = analyses.map((analysis) => ({
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
    }));

    return NextResponse.json({
      analyses: transformed,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Errore nel recupero delle analisi:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

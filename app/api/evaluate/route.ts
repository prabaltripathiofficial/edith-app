import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncAuthenticatedUser } from "@/lib/sync-auth-user";
import { isValidCategory, getCategoryBySlug } from "@/lib/categories";

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const EVALUATION_MODEL = "gemini-2.5-flash";
const MIN_ACCEPTANCE_SCORE = 85;

type EvaluationResponse = {
  score: number;
  categoryMatch: boolean;
  constraintFeedback: string;
  generalFeedback: string;
};

type EvaluateRequestBody = {
  title?: unknown;
  markdown?: unknown;
  category?: unknown;
};

const evaluationSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    score: {
      type: SchemaType.INTEGER,
    },
    categoryMatch: {
      type: SchemaType.BOOLEAN,
    },
    constraintFeedback: {
      type: SchemaType.STRING,
    },
    generalFeedback: {
      type: SchemaType.STRING,
    },
  },
  required: ["score", "categoryMatch", "constraintFeedback", "generalFeedback"],
};

function isValidEvaluationResponse(value: unknown): value is EvaluationResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    Number.isInteger(candidate.score) &&
    typeof candidate.categoryMatch === "boolean" &&
    typeof candidate.constraintFeedback === "string" &&
    typeof candidate.generalFeedback === "string" &&
    Number(candidate.score) >= 0 &&
    Number(candidate.score) <= 100
  );
}

function extractPlanTitle(markdown: string) {
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const heading = lines.find((line) => line.startsWith("#"));
  const rawTitle = heading
    ? heading.replace(/^#+\s*/, "")
    : lines[0] ?? "Untitled Plan Submission";

  return rawTitle.slice(0, 120) || "Untitled Plan Submission";
}

function buildEvaluationPrompt(markdown: string, category: string, categoryDescription: string) {
  return [
    "You are a strict senior software engineer reviewing an enterprise-grade agentic AI `plan.md` submission.",
    "Evaluate the plan harshly and do not reward vague, hand-wavy, or unsafe answers.",
    "Return JSON only, matching the provided response schema exactly.",
    "",
    "CRITICAL EVALUATION CRITERIA:",
    "- The plan MUST be tech-stack agnostic. It should describe general principles, patterns, and strategies — NOT specific frameworks, libraries, or tools.",
    "- A plan that says 'use Redis for caching' instead of 'implement a distributed caching layer' should be scored lower.",
    "- A plan that says 'use Express.js middleware' instead of 'introduce centralized request interception' should be scored lower.",
    "",
    "Scoring rubric:",
    "- Tech-Stack Agnosticism: 20 points (CRITICAL — deduct heavily for framework-specific language)",
    "- Category Specificity: 15 points",
    "- AI Constraint & Bias Mitigation: 20 points",
    "- Step-by-Step Logic: 20 points",
    "- Edge Case Handling: 15 points",
    "- Structure & Formatting: 10 points",
    "",
    "Evaluation requirements:",
    `- The target category is: ${category}`,
    `- Category description: ${categoryDescription}`,
    "- Set `categoryMatch` to true only if the plan is clearly and specifically aligned with that category.",
    "- Use `constraintFeedback` to focus on AI-specific weaknesses, constraint violations, missing guardrails, tech-stack specificity issues, and bias/risk mitigation gaps.",
    "- Use `generalFeedback` to explain the main quality issues or strengths in direct, concise language.",
    "- Keep the score as an integer from 0 to 100.",
    "- A strong enterprise-grade submission should be concrete, procedural, risk-aware, implementation-ready, AND tech-stack agnostic.",
    "",
    "Plan markdown:",
    "```md",
    markdown,
    "```",
  ].join("\n");
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Authentication required. Sign in with GitHub before submitting a plan for evaluation.",
      },
      { status: 401 },
    );
  }

  const currentUser = await syncAuthenticatedUser(session.user);

  if (!currentUser?.id) {
    return NextResponse.json(
      {
        error: "Failed to resolve the authenticated user profile.",
      },
      { status: 503 },
    );
  }

  let body: EvaluateRequestBody;

  try {
    body = (await request.json()) as EvaluateRequestBody;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON request body.",
      },
      { status: 400 },
    );
  }

  const markdown = typeof body.markdown === "string" ? body.markdown.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title || !markdown || !category) {
    return NextResponse.json(
      {
        error: "`title`, `markdown`, and `category` are all required.",
      },
      { status: 400 },
    );
  }

  if (!isValidCategory(category)) {
    return NextResponse.json(
      {
        error: `Invalid category: "${category}". Must be one of the defined categories.`,
      },
      { status: 400 },
    );
  }

  const categoryInfo = getCategoryBySlug(category);

  // Rate limiting
  let lastSubmission: { createdAt: Date } | null = null;

  try {
    lastSubmission = await db.plan.findFirst({
      where: {
        authorId: currentUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Failed to query last submission", error);

    return NextResponse.json(
      {
        error: "Failed to verify submission history.",
      },
      { status: 503 },
    );
  }

  if (lastSubmission) {
    const earliestNextSubmission = new Date(lastSubmission.createdAt.getTime() + RATE_LIMIT_WINDOW_MS);

    if (Date.now() < earliestNextSubmission.getTime()) {
      return NextResponse.json(
        {
          error: `You can only submit one plan every 24 hours. Your next eligible submission time is ${earliestNextSubmission.toISOString()}.`,
        },
        { status: 429 },
      );
    }
  }

  // Fetch the current champion for this category
  let currentChampion: { id: string; score: number | null; version: number } | null = null;

  try {
    currentChampion = await db.plan.findFirst({
      where: {
        category,
        status: "accepted",
      },
      select: {
        id: true,
        score: true,
        version: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch current champion", error);
  }

  const apiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Gemini API key is not configured on the server.",
      },
      { status: 500 },
    );
  }

  let parsed: EvaluationResponse;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: EVALUATION_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.2,
      },
    });

    const result = await model.generateContent(
      buildEvaluationPrompt(markdown, category, categoryInfo?.description ?? ""),
    );
    const responsePayload = JSON.parse(result.response.text()) as unknown;

    if (!isValidEvaluationResponse(responsePayload)) {
      return NextResponse.json(
        {
          error: "Gemini returned an invalid evaluation payload.",
        },
        { status: 502 },
      );
    }
    parsed = responsePayload;
  } catch (error) {
    console.error("AI judge invocation failed", error);

    return NextResponse.json(
      {
        error: "Failed to connect to AI judge.",
      },
      { status: 502 },
    );
  }

  try {
    const championScore = currentChampion?.score ?? 0;
    const meetsMinScore = parsed.score >= MIN_ACCEPTANCE_SCORE;
    const beatsChampion = parsed.score > championScore;
    const categoryAligned = parsed.categoryMatch;
    const isNewChampion = meetsMinScore && beatsChampion && categoryAligned;

    if (isNewChampion) {
      // Archive the old champion
      if (currentChampion) {
        await db.plan.update({
          where: { id: currentChampion.id },
          data: { status: "archived" },
        });
      }

      // Create the new champion
      await db.plan.create({
        data: {
          authorId: currentUser.id,
          category,
          content: markdown,
          score: parsed.score,
          status: "accepted",
          version: (currentChampion?.version ?? 0) + 1,
          previousPlanId: currentChampion?.id ?? undefined,
          title: title || extractPlanTitle(markdown),
        },
      });
    } else {
      // Rejected — save for record but not as accepted
      await db.plan.create({
        data: {
          authorId: currentUser.id,
          category,
          content: markdown,
          score: parsed.score,
          status: "rejected",
          title: title || extractPlanTitle(markdown),
        },
      });
    }

    return NextResponse.json({
      ...parsed,
      championScore,
      isNewChampion,
    });
  } catch (error) {
    console.error("Failed to persist evaluation result", error);

    return NextResponse.json(
      {
        error: "Failed to save evaluation result.",
      },
      { status: 503 },
    );
  }
}

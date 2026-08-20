"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { model, parseJsonResponse } from "@/lib/gemini";
import { industries } from "@/data/industries";
import { toIndustrySlug, slugify } from "@/app/lib/helper";

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }

          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text());
};

async function findOrCreateIndustryInsight(industry, promptTerm = industry) {
  const existing = await db.industryInsight.findUnique({
    where: { industry },
  });

  if (existing) return existing;

  const insights = await generateAIInsights(promptTerm);

  return db.industryInsight.create({
    data: {
      industry,
      ...insights,
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

function isKnownIndustrySlug(slug) {
  return industries.some((ind) =>
    ind.subIndustries.some((sub) => toIndustrySlug(ind.id, sub) === slug)
  );
}

async function isIndustryTermAllowed(term) {
  const prompt = `You are a content moderator for a professional career-insights platform.
A user wants to view career/industry insights for: "${term}"

Reply with exactly one word:
- ALLOW if this describes a legitimate, legal, and professionally/ethically acceptable industry, occupation, or business sector.
- BLOCK if it describes or promotes illegal activity (e.g. drug trafficking, weapons trafficking, human trafficking, fraud, hacking/cybercrime, terrorism) or is otherwise unethical, hateful, sexually explicit, or not a real industry/occupation.

Reply with ONLY "ALLOW" or "BLOCK".`;

  const result = await model.generateContent(prompt);
  const answer = result.response.text().trim().toUpperCase();

  return answer.startsWith("ALLOW");
}

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return findOrCreateIndustryInsight(user.industry);
}

// Lets a signed-in user preview any catalog industry's insights without changing their saved industry
export async function getIndustryInsightsByIndustry(industry) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!isKnownIndustrySlug(industry)) {
    throw new Error("Invalid industry selection");
  }

  return findOrCreateIndustryInsight(industry);
}

// Lets a signed-in user search for an industry/specialization that isn't in the catalog,
// moderated so illegal/unethical terms are rejected before hitting Gemini or the database
export async function getCustomIndustryInsights(term) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const cleaned = term?.trim();
  if (!cleaned || cleaned.length < 2 || cleaned.length > 60) {
    throw new Error("Please enter a valid industry or specialization name.");
  }

  const allowed = await isIndustryTermAllowed(cleaned);
  if (!allowed) {
    throw new Error(
      "That doesn't look like a supported industry. Please try a different term."
    );
  }

  const slug = slugify(cleaned);
  if (!slug) {
    throw new Error("Please enter a valid industry or specialization name.");
  }

  return findOrCreateIndustryInsight(slug, cleaned);
}

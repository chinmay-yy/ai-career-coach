"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { model, parseJsonResponse } from "@/lib/gemini";

export async function saveResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content,
      },
      create: {
        userId: user.id,
        content,
      },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}

export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.resume.findUnique({
    where: {
      userId: user.id,
    },
  });
}

export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    
    Format the response as a single paragraph without any additional text or explanations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();
    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}

// Guarantees a shape safe to hand straight to react-hook-form's reset() —
// arrays stay arrays and every field is at least a string, but nothing here is
// *required* the way entrySchema's min(1) rules are for manually-added entries,
// since a real uploaded resume often has entries with blank descriptions.
function sanitizeEntry(entry) {
  return {
    title: entry?.title || "",
    organization: entry?.organization || "",
    startDate: entry?.startDate || "",
    endDate: entry?.endDate || "",
    current: !!entry?.current,
    description: entry?.description || "",
  };
}

function sanitizeParsedResume(parsed) {
  const asArray = (value) => (Array.isArray(value) ? value : []);

  return {
    contactInfo: {
      email: parsed?.contactInfo?.email || "",
      mobile: parsed?.contactInfo?.mobile || "",
      linkedin: parsed?.contactInfo?.linkedin || "",
      twitter: parsed?.contactInfo?.twitter || "",
    },
    summary: parsed?.summary || "",
    skills: parsed?.skills || "",
    experience: asArray(parsed?.experience).map(sanitizeEntry),
    education: asArray(parsed?.education).map(sanitizeEntry),
    projects: asArray(parsed?.projects).map((p) => ({
      title: p?.title || "",
      description: p?.description || "",
      link: p?.link || "",
    })),
  };
}

// Persist just the ATS score/feedback without touching the resume content,
// so a "Check Match Score" or "Generate Tailored Resume" call survives a refresh
// even if the user hasn't hit the main Save button.
export async function saveResumeScore({ atsScore, feedback }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  try {
    const resume = await db.resume.upsert({
      where: { userId: user.id },
      update: { atsScore, feedback },
      create: { userId: user.id, content: "", atsScore, feedback },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume score:", error);
    throw new Error("Failed to save resume score");
  }
}

// The one structured shape every resume-editing AI feature reads/writes —
// matches resumeSchema, so the client can always call reset() with the result.
const RESUME_FIELDS_SHAPE = `{
  "contactInfo": { "email": "string", "mobile": "string", "linkedin": "string", "twitter": "string" },
  "summary": "string",
  "skills": "comma-separated string of skills",
  "experience": [
    { "title": "string", "organization": "string", "startDate": "MMM yyyy", "endDate": "MMM yyyy", "current": boolean, "description": "string" }
  ],
  "education": [
    { "title": "degree/field of study", "organization": "school name", "startDate": "MMM yyyy", "endDate": "MMM yyyy", "current": boolean, "description": "string" }
  ],
  "projects": [
    { "title": "string", "description": "string", "link": "string" }
  ]
}`;

const RESUME_FIELDS_PROMPT = `Extract this resume's information and respond with ONLY the following JSON shape, no additional notes, explanations, or markdown formatting:
${RESUME_FIELDS_SHAPE}

Rules:
- Use "" for any field you can't find, and [] for missing arrays. Never omit a key.
- Dates must look like "Jan 2022", not "2022-01" or "January 2022".
- If a section (contact field, experience entry, etc.) isn't present, leave it blank/omit the entry rather than inventing one.`;

// Reads an uploaded resume file (PDF sent to Gemini as a document, TXT/MD as plain
// text) and extracts it into the same shape resumeSchema expects, so the client
// can call reset() with it directly.
export async function parseResumeFile(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    throw new Error("No file provided");
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File is too large (max 5MB)");
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isText = file.name.toLowerCase().endsWith(".txt") || file.name.toLowerCase().endsWith(".md");

  if (!isPdf && !isText) {
    throw new Error("Please upload a PDF, TXT, or MD file");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let result;

    if (isPdf) {
      result = await model.generateContent([
        RESUME_FIELDS_PROMPT,
        { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } },
      ]);
    } else {
      const text = buffer.toString("utf-8");
      result = await model.generateContent(
        `${RESUME_FIELDS_PROMPT}\n\nResume text:\n"""\n${text}\n"""`
      );
    }

    const rawText = result.response.text();

    let parsed;
    try {
      parsed = parseJsonResponse(rawText);
    } catch (jsonError) {
      console.error("Resume parse: Gemini returned invalid JSON:", rawText);
      throw new Error(
        "The AI couldn't structure that resume properly (often means it's long/complex). Try a shorter or simpler file."
      );
    }

    return sanitizeParsedResume(parsed);
  } catch (error) {
    console.error("Error parsing resume file:", error);
    if (error.message?.includes("couldn't structure")) throw error;
    throw new Error(`Couldn't read that resume: ${error.message || "unknown error"}`);
  }
}

// Plain-text rendering of the structured resume, used only inside AI prompts
// below — the source of truth stays the structured `data`, this is disposable.
function resumeDataToText(data) {
  const { contactInfo = {}, summary, skills, experience = [], education = [], projects = [] } = data || {};
  const lines = [];

  if (summary) lines.push(`Summary: ${summary}`);
  if (skills) lines.push(`Skills: ${skills}`);

  experience.forEach((exp) => {
    lines.push(
      `Experience: ${exp.title} at ${exp.organization} (${exp.startDate} - ${exp.current ? "Present" : exp.endDate})\n${exp.description}`
    );
  });
  education.forEach((edu) => {
    lines.push(`Education: ${edu.title} at ${edu.organization} (${edu.startDate} - ${edu.current ? "Present" : edu.endDate})`);
  });
  projects.forEach((p) => {
    lines.push(`Project: ${p.title} - ${p.description}`);
  });

  return lines.join("\n\n");
}

// Non-destructive: scores the given resume against a job description without
// changing anything in the database.
export async function getResumeMatchScore({ resumeData, jobDescription }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!resumeData || !jobDescription?.trim()) {
    throw new Error("Resume data and job description are both required");
  }

  try {
    const prompt = `You are an ATS (Applicant Tracking System) simulator. Compare this resume against this job description and respond with ONLY this JSON shape, no additional notes or markdown formatting:
{
  "atsScore": number (0-100),
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "feedback": "2-3 sentence summary of how well the resume matches and what to improve"
}

Resume:
"""
${resumeDataToText(resumeData)}
"""

Job description:
"""
${jobDescription}
"""`;

    const result = await model.generateContent(prompt);
    return parseJsonResponse(result.response.text());
  } catch (error) {
    console.error("Error scoring resume match:", error);
    throw new Error("Failed to check match score");
  }
}

// Rewrites the resume to target a specific job description, preserving factual
// history, and returns an ATS score for the rewritten version. Returns the
// same structured shape as parseResumeFile, so the caller can reset() with it.
export async function generateTailoredResume({ resumeData, jobDescription }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!resumeData || !jobDescription?.trim()) {
    throw new Error("Resume data and job description are both required");
  }

  try {
    const prompt = `You are an expert resume writer. Given this resume (as JSON) and a job description, rewrite the summary, skills, and experience/education/project descriptions to better target the job, then respond with ONLY this JSON shape, no additional notes or markdown formatting:
{
  "resume": ${RESUME_FIELDS_SHAPE},
  "atsScore": number (0-100, the estimated ATS match score of the REWRITTEN resume against the job description),
  "feedback": "2-3 sentence summary of what was changed and why"
}

Rules:
- Do NOT invent new jobs, employers, degrees, dates, or credentials, and do NOT add or remove entries — same number of experience/education/project items as the original, only reworded.
- Emphasize skills/keywords from the job description that the candidate genuinely already has.

Original resume (JSON):
"""
${JSON.stringify(resumeData)}
"""

Job description:
"""
${jobDescription}
"""`;

    const result = await model.generateContent(prompt);
    const parsed = parseJsonResponse(result.response.text());
    return {
      resume: sanitizeParsedResume(parsed.resume),
      atsScore: parsed.atsScore,
      feedback: parsed.feedback,
    };
  } catch (error) {
    console.error("Error generating tailored resume:", error);
    throw new Error("Failed to generate tailored resume");
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const model = genAI.getGenerativeModel(
  {
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    // Several features (resume parsing, tailored rewrites) ask for a sizeable
    // JSON object back — a low default limit would silently truncate it.
    generationConfig: { maxOutputTokens: 8192 },
  },
  { apiVersion: "v1" }
);

// Every AI feature in this app asks Gemini for strict JSON and parses it the
// same way — this is that shared step so each action doesn't repeat it.
export function parseJsonResponse(text) {
  const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
  return JSON.parse(cleaned);
}

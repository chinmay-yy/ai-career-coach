import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { generateAIInsights } from "@/actions/dashboard";

// Weekly refresh of every industry's shared insight row. Runs on Vercel Cron
// (see vercel.json) instead of a separate background-job service — there's
// only ever this one scheduled job, so a plain route is enough.
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const industries = await db.industryInsight.findMany({
    select: { industry: true },
  });

  const results = [];
  for (const { industry } of industries) {
    try {
      const insights = await generateAIInsights(industry);
      await db.industryInsight.update({
        where: { industry },
        data: {
          ...insights,
          lastUpdated: new Date(),
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      results.push({ industry, status: "ok" });
    } catch (error) {
      console.error(`Failed to refresh insights for ${industry}:`, error);
      results.push({ industry, status: "failed" });
    }
  }

  return NextResponse.json({ refreshed: results.length, results });
}
